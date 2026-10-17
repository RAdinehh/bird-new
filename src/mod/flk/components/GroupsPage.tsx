/**
 * GroupsPage.tsx — مدیریت گروه‌های گله
 */
import { useState, useMemo, useRef } from 'react';
import { Modal, Btn, BtnRow, Field, Input, Select, Textarea, Grid2 } from '../../../shr/components/ui';
import { useFlk, type FlockGroup, type FlockGroupType, type FlockGroupRule } from '../store';
import { useBrd } from '../../brd/store';
import { useHal } from '../../hal/store';
import { useGroupKpi } from '../hooks/useGroupKpi';
import GroupReportModal from './GroupReportModal';
import { showConfirmAsync } from '../../../cor/store/dialog';
import { toastMsg } from '../../../cor/store/toast';
import { logAction } from '../../../cor/logger/auditLog';
import { toFa } from '../../../shr/utils/fa';

interface Props {
  open: boolean;
  onClose: () => void;
}

const TYPE_LABEL: Record<FlockGroupType, string> = {
  season: '🗓 فصلی',
  breed: '🧬 نژادی',
  cohort: '👥 هم‌دوره',
  farm: '🏭 مزرعه',
  owner: '👤 مالک',
  custom: '📁 سفارشی',
  smart: '🤖 هوشمند',
};

const TYPE_DESC: Record<FlockGroupType, string> = {
  season: 'گله‌های یه فصل (هر ترکیبی)',
  breed: 'گله‌های هم‌نژاد (سن آزاد)',
  cohort: 'گله‌های هم‌دوره (سن نزدیک)',
  farm: 'گله‌های یه مزرعه',
  owner: 'گله‌های یه مالک/شریک',
  custom: 'دسته‌بندی دلخواه',
  smart: 'قوانین خودکار',
};

const TYPE_OPTIONS = [
  { value: 'season', label: 'فصلی', icon: '🗓', subtitle: 'گله‌های یه فصل' },
  { value: 'breed', label: 'نژادی', icon: '🧬', subtitle: 'گله‌های هم‌نژاد (سن آزاد)' },
  { value: 'cohort', label: 'هم‌دوره', icon: '👥', subtitle: 'گله‌های هم‌دوره (سن نزدیک)' },
  { value: 'farm', label: 'مزرعه', icon: '🏭', subtitle: 'گله‌های یه مزرعه' },
  { value: 'owner', label: 'مالک', icon: '👤', subtitle: 'گله‌های یه مالک' },
  { value: 'custom', label: 'سفارشی', icon: '📁', subtitle: 'دسته‌بندی دلخواه' },
  { value: 'smart', label: 'هوشمند', icon: '🤖', subtitle: 'قوانین خودکار' },
];

const NAME_PLACEHOLDER: Record<FlockGroupType, string> = {
  season: 'مثلاً: گله پاییز ۱۴۰۵',
  breed: 'مثلاً: مرندی‌ها',
  cohort: 'مثلاً: هم‌دوره مرداد',
  farm: 'مثلاً: مزرعه شمال',
  owner: 'مثلاً: گله‌های آقای رضایی',
  custom: 'مثلاً: گله‌های ممتاز',
  smart: 'مثلاً: همه لایه‌های فعال',
};

interface GroupKpiRowProps {
  group: FlockGroup;
  onOpen: () => void;
}

function GroupKpiRow({ group, onOpen }: GroupKpiRowProps) {
  const kpi = useGroupKpi(group.id);
  if (kpi.flockCount === 0) return null;

  const profitTone = kpi.totalProfit > 0 ? 'var(--accent)' : kpi.totalProfit < 0 ? 'var(--danger)' : 'var(--muted)';
  const mortalityTone = kpi.mortalityRate > 5 ? 'var(--danger)' : kpi.mortalityRate > 3 ? 'var(--warn)' : 'var(--accent)';

  return (
    <div
      onClick={onOpen}
      style={{
        marginTop: 8,
        paddingTop: 8,
        borderTop: '1px dashed var(--border)',
        display: 'flex',
        gap: 14,
        flexWrap: 'wrap',
        fontSize: 11,
        color: 'var(--muted)',
        alignItems: 'center',
        cursor: 'pointer',
      }}
      title="کلیک برای گزارش کامل"
    >
      <span>🐔 <b style={{ color: 'var(--text)' }}>{toFa(kpi.totalCurrent)}</b></span>
      {kpi.totalDeaths > 0 && (
        <span>💀 <b style={{ color: mortalityTone }}>{toFa(kpi.totalDeaths)}</b> ({toFa(kpi.mortalityRate.toFixed(1))}٪)</span>
      )}
      {kpi.totalCost > 0 && <span>💰 <b style={{ color: 'var(--text)' }}>{toFa(Math.round(kpi.totalCost / 1_000_000))}M</b></span>}
      {kpi.totalRevenue > 0 && <span>📈 <b style={{ color: profitTone }}>{toFa(Math.round(kpi.totalProfit / 1_000_000))}M</b></span>}
    </div>
  );
}

interface SmartRuleEditorProps {
  rule: FlockGroupRule;
  onChange: (rule: FlockGroupRule) => void;
  breeds: Array<{ id: string; name: string; birdId: string }>;
  halls: Array<{ id: string; name: string }>;
}

function SmartRuleEditor({ rule, onChange, breeds, halls }: SmartRuleEditorProps) {
  const update = (patch: Partial<FlockGroupRule>) => {
    const next: FlockGroupRule = { ...rule, ...patch };
    // حذف فیلدهای خالی
    Object.keys(next).forEach(k => {
      const v = (next as Record<string, unknown>)[k];
      if (v === '' || v === undefined || v === null) {
        delete (next as Record<string, unknown>)[k];
      }
    });
    onChange(next);
  };

  return (
    <div style={{
      padding: 'var(--pad-normal)',
      background: 'var(--purple-soft)',
      border: '1px solid var(--purple)',
      borderRadius: 'var(--r-md)',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--purple)' }}>
        🤖 قوانین خودکار
        <span style={{ fontSize: 10, fontWeight: 400, opacity: 0.7 }}>
          (فقط گله‌های منطبق عضو می‌شن)
        </span>
      </div>

      <Field label="نوع گله">
        <Select value={rule.type || ''} onChange={e => update({ type: e.target.value as FlockGroupRule['type'] || undefined })}>
          <option value="">همه</option>
          <option value="layer">تخم‌گذار</option>
          <option value="broiler">گوشتی</option>
          <option value="breeder">مادر</option>
        </Select>
      </Field>

      <Field label="نژاد">
        <Select value={rule.breedId || ''} onChange={e => update({ breedId: e.target.value || undefined })}>
          <option value="">همه</option>
          {breeds.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </Select>
      </Field>

      <Field label="سالن">
        <Select value={rule.hallId || ''} onChange={e => update({ hallId: e.target.value || undefined })}>
          <option value="">همه</option>
          {halls.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
        </Select>
      </Field>

      <Field label="وضعیت">
        <Select value={rule.status || ''} onChange={e => update({ status: e.target.value as FlockGroupRule['status'] || undefined })}>
          <option value="">همه</option>
          <option value="active">فعال</option>
          <option value="archived">آرشیو</option>
          <option value="sold">فروخته‌شده</option>
        </Select>
      </Field>

      <Field label="منبع">
        <Select value={rule.source || ''} onChange={e => update({ source: e.target.value || undefined })}>
          <option value="">همه</option>
          <option value="purchase">خریداری</option>
          <option value="hatch">جوجه‌کشی خودم</option>
          <option value="gift">اهدا</option>
        </Select>
      </Field>

      <Grid2>
        <Field label="سن از (روز)">
          <Input
            type="number"
            value={rule.minAge || ''}
            onChange={e => update({ minAge: e.target.value ? parseInt(e.target.value) : undefined })}
            placeholder="—"
            inputMode="numeric"
          />
        </Field>
        <Field label="سن تا (روز)">
          <Input
            type="number"
            value={rule.maxAge || ''}
            onChange={e => update({ maxAge: e.target.value ? parseInt(e.target.value) : undefined })}
            placeholder="—"
            inputMode="numeric"
          />
        </Field>
      </Grid2>

      <div style={{ fontSize: 10, color: 'var(--purple)', fontStyle: 'italic' }}>
        {Object.keys(rule).length === 0
          ? '⚠️ هیچ شرطی تعریف نشده — همه گله‌ها عضو می‌شن'
          : '✅ گله‌هایی که با همه شرط‌های بالا منطبق باشن، خودکار عضو می‌شن'}
      </div>
    </div>
  );
}

interface FormState {
  name: string;
  type: FlockGroupType;
  description: string;
  color: string;
  parentGroupId: string;
  rule: FlockGroupRule;
}

const EMPTY_FORM: FormState = {
  name: '', type: 'custom', description: '', color: '', parentGroupId: '', rule: {},
};

interface Node extends FlockGroup {
  children: Node[];
  memberCount: number;
}

export default function GroupsPage({ open, onClose }: Props) {
  const groups = useFlk(s => s.groups);
  const groupMembers = useFlk(s => s.groupMembers);
  const addGroup = useFlk(s => s.addGroup);
  const updateGroup = useFlk(s => s.updateGroup);
  const deleteGroup = useFlk(s => s.deleteGroup);
  const { breeds } = useBrd();
  const { halls } = useHal();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [reportGroupId, setReportGroupId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    try {
      const exportData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        groups,
        groupMembers: useFlk.getState().groupMembers,
      };
      const json = JSON.stringify(exportData, null, 2);
      const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'flk-groups-' + new Date().toISOString().slice(0, 10) + '.json';
      a.click();
      URL.revokeObjectURL(url);
      toastMsg.success('گروه‌ها export شد (' + groups.length + ' گروه)');
    } catch (e) {
      toastMsg.error('Export ناموفق');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.groups || !Array.isArray(data.groups)) {
        toastMsg.error('فایل نامعتبر — groups[] نداره');
        return;
      }
      const msg = data.groups.length + ' گروه در فایل موجود است. جایگزین گروه‌های فعلی کنیم؟ (لغو = ادغام)';
      const replace = await showConfirmAsync('ایمپورت گروه‌ها', msg);
      
      const flkStore = useFlk.getState();
      const existingNames = new Set(flkStore.groups.map(g => g.name));
      const imported: typeof data.groups = [];
      const skipped: string[] = [];
      
      for (const g of data.groups) {
        if (!replace && existingNames.has(g.name)) {
          skipped.push(g.name);
          continue;
        }
        imported.push(g);
      }
      
      if (replace) {
        flkStore.groups.forEach(g => flkStore.deleteGroup(g.id));
      }
      
      for (const g of imported) {
        flkStore.addGroup({
          name: g.name,
          type: g.type,
          description: g.description || '',
          color: g.color || '',
          parentGroupId: g.parentGroupId,
          rule: g.rule,
          archived: g.archived || false,
          sortOrder: g.sortOrder || 0,
        });
      }
      
      if (data.groupMembers && Array.isArray(data.groupMembers)) {
        for (const m of data.groupMembers) {
          flkStore.addToGroup(m.groupId, m.flockId, {
            role: m.role,
            weight: m.weight,
            notes: m.notes,
          });
        }
      }
      
      logAction('import', 'flk', 'ایمپورت گروه‌ها: ' + imported.length + ' مورد');
      toastMsg.success(imported.length + ' گروه ایمپورت شد' + (skipped.length > 0 ? ' (' + skipped.length + ' رد شد)' : ''));
      
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (e) {
      console.error(e);
      toastMsg.error('ایمپورت ناموفق — فایل JSON معتبر نیست');
    }
  };

  const tree = useMemo(() => {
    const build = (parentId: string | undefined): Node[] => {
      return groups
        .filter(g => (g.parentGroupId || undefined) === parentId && !g.archived)
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
        .map(g => ({
          ...g,
          children: build(g.id),
          memberCount: groupMembers.filter(m => m.groupId === g.id && !m.leftAt).length,
        }));
    };
    return build(undefined);
  }, [groups, groupMembers]);

  const handleNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const handleEdit = (g: FlockGroup) => {
    setEditingId(g.id);
    setForm({
      name: g.name,
      type: g.type,
      description: g.description || '',
      color: g.color || '',
      parentGroupId: g.parentGroupId || '',
      rule: g.rule || {},
    });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toastMsg.error('نام گروه اجباری است');
      return;
    }
    const data = {
      name: form.name.trim(),
      type: form.type,
      description: form.description.trim(),
      color: form.color,
      parentGroupId: form.parentGroupId || undefined,
      rule: form.type === 'smart' ? form.rule : undefined,
      archived: false,
      sortOrder: 0,
    };
    if (editingId) {
      updateGroup(editingId, data);
      toastMsg.saved(form.name);
      logAction('update', 'flk', 'ویرایش گروه: ' + data.name);
    } else {
      addGroup(data);
      toastMsg.added(form.name, 'گروه');
      logAction('add', 'flk', 'افزودن گروه: ' + data.name + ' (' + data.type + ')');
    }
    setShowForm(false);
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const handleDelete = async (g: FlockGroup) => {
    const childCount = groups.filter(c => c.parentGroupId === g.id).length;
    const msg = childCount > 0
      ? 'گروه «' + g.name + '» ' + toFa(childCount) + ' زیرگروه دارد. با حذف، زیرگروه‌ها یتیم می‌شن. ادامه؟'
      : 'گروه «' + g.name + '» حذف شود؟';
    const ok = await showConfirmAsync('حذف گروه', msg, { danger: true });
    if (!ok) return;
    deleteGroup(g.id);
    toastMsg.deleted(g.name);
    logAction('delete', 'flk', 'حذف گروه: ' + g.name);
  };

  const renderNode = (node: Node, depth: number = 0) => (
    <div key={node.id} style={{ marginRight: depth * 20 }}>
      <div style={{
        display: 'flex', flexDirection: 'column',
        padding: 'var(--pad-normal)', background: 'var(--card)',
        border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
        marginBottom: 4,
        borderRight: node.color ? '3px solid ' + node.color : undefined,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: 'var(--fs-sm)' }}>{node.name}</span>
              <span style={{ fontSize: 10, color: 'var(--muted)', background: 'var(--input-bg)', padding: '1px 6px', borderRadius: 4 }}>
                {TYPE_LABEL[node.type]}
              </span>
            </div>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 2 }}>
              {toFa(node.memberCount)} گله{node.description ? ' · ' + node.description : ''}
            </div>
          </div>
          <Btn size="sm" onClick={() => handleEdit(node)}>ویرایش</Btn>
          <Btn size="sm" onClick={() => handleDelete(node)} style={{ color: 'var(--danger)' }}>حذف</Btn>
        </div>
        <GroupKpiRow group={node} onOpen={() => setReportGroupId(node.id)} />
      </div>
      {node.children.map(child => renderNode(child, depth + 1))}
    </div>
  );

  return (
    <Modal open={open} onClose={onClose} title="📁 مدیریت گروه‌های گله">
      {!showForm ? (
        <>
          <div style={{ marginBottom: 12, display: 'flex', gap: 6 }}>
            <Btn variant="primary" onClick={handleNew} style={{ flex: 1 }}>+ گروه جدید</Btn>
            <Btn onClick={handleExport} disabled={groups.length === 0} style={{ flexShrink: 0 }} title="Export JSON">📥</Btn>
            <Btn onClick={() => fileInputRef.current?.click()} style={{ flexShrink: 0 }} title="Import JSON">📤</Btn>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImport}
            style={{ display: 'none' }}
          />

          {tree.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>📁</div>
              <div>هنوز گروهی نساخته‌ای</div>
              <div style={{ fontSize: 11, marginTop: 4, opacity: 0.7 }}>
                گروه‌ها برای گزارش‌گیری و فیلتر استفاده می‌شن
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {tree.map(node => renderNode(node))}
            </div>
          )}
        </>
      ) : (
        <>
          <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, marginBottom: 12, color: 'var(--accent)' }}>
            {editingId ? 'ویرایش گروه' : 'گروه جدید'}
          </div>

          <Field label="نوع گروه" hint={TYPE_DESC[form.type]}>
            <Select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as FlockGroupType })}>
              {(Object.keys(TYPE_LABEL) as FlockGroupType[]).map(t => (
                <option key={t} value={t}>{TYPE_LABEL[t]}</option>
              ))}
            </Select>
          </Field>

          {form.type === 'smart' && (
            <SmartRuleEditor
              rule={form.rule}
              onChange={(rule) => setForm({ ...form, rule })}
              breeds={breeds.map(b => ({ id: b.id, name: b.name, birdId: b.birdId }))}
              halls={halls.map(h => ({ id: h.id, name: h.name }))}
            />
          )}

          <Field label="نام گروه" required>
            <Input
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder={NAME_PLACEHOLDER[form.type]}
            />
          </Field>

          <Field label="گروه والد (اختیاری)" hint="برای ساختار تودرتو">
            <Select value={form.parentGroupId} onChange={e => setForm({ ...form, parentGroupId: e.target.value })}>
              <option value="">— بدون والد —</option>
              {groups.filter(g => g.id !== editingId && !g.archived).map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </Select>
          </Field>

          <Field label="رنگ (اختیاری)">
            <Input value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} placeholder="مثلاً: قرمز، آبی، ..." />
          </Field>

          <Field label="توضیحات (اختیاری)">
            <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="..." rows={2} />
          </Field>

          <BtnRow>
            <Btn variant="primary" onClick={handleSave}>{editingId ? 'ذخیره' : 'ایجاد'}</Btn>
            <Btn onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setEditingId(null); }}>لغو</Btn>
          </BtnRow>
        </>
      )}
    
      <GroupReportModal
        open={reportGroupId !== null}
        onClose={() => setReportGroupId(null)}
        groupId={reportGroupId}
      />
    </Modal>
  );
}
