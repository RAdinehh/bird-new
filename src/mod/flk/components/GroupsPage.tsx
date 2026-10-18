/**
 * GroupsPage.tsx — مدیریت گروه‌های گله
 */
import { useState, useMemo, useRef } from 'react';
import { Modal, Btn, BtnRow, Field, Input, Select, Textarea, Grid2 } from '../../../shr/components/ui';
import { useFlk, type FlockGroup, type FlockGroupType, type FlockGroupRule } from '../store';
import { useBrd } from '../../brd/store';
import { useHal } from '../../hal/store';
import { useGroupKpi } from '../hooks/useGroupKpi';
import { SmartRuleEditor } from './SmartRuleEditor';
import { GroupKpiRow } from './GroupKpiRow';
import GroupReportModal from './GroupReportModal';
import GroupComparisonModal from './GroupComparisonModal';
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
  const [comparisonOpen, setComparisonOpen] = useState(false);
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
          <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'stretch' }}>
            <Btn variant="primary" onClick={handleNew} style={{ flex: 1, minHeight: 42, fontWeight: 700 }}>
              + گروه جدید
            </Btn>
            <div style={{ display: 'flex', gap: 2, padding: 3, background: 'var(--input-bg)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
              <button type="button" onClick={handleExport} disabled={groups.length === 0} title="Export JSON" aria-label="Export" style={{ width: 36, height: 36, background: 'transparent', border: 'none', borderRadius: 6, cursor: groups.length === 0 ? 'not-allowed' : 'pointer', fontSize: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: groups.length === 0 ? 0.4 : 1, transition: 'background .15s' }}>📥</button>
              <button type="button" onClick={() => fileInputRef.current?.click()} title="Import JSON" aria-label="Import" style={{ width: 36, height: 36, background: 'transparent', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .15s' }}>📤</button>
              <button type="button" onClick={() => setComparisonOpen(true)} disabled={groups.length < 2} title="مقایسه" aria-label="مقایسه" style={{ width: 36, height: 36, background: 'transparent', border: 'none', borderRadius: 6, cursor: groups.length < 2 ? 'not-allowed' : 'pointer', fontSize: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: groups.length < 2 ? 0.4 : 1, transition: 'background .15s' }}>🔍</button>
            </div>
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
    
      <GroupComparisonModal
        open={comparisonOpen}
        onClose={() => setComparisonOpen(false)}
      />
    </Modal>
  );
}
