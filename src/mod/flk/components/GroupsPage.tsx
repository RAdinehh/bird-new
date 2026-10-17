/**
 * GroupsPage.tsx — مدیریت گروه‌های گله
 */
import { useState, useMemo } from 'react';
import { Modal, Btn, BtnRow, Field, Input, Select, Textarea } from '../../../shr/components/ui';
import { useFlk, type FlockGroup, type FlockGroupType } from '../store';
import { useGroupKpi } from '../hooks/useGroupKpi';
import { showConfirmAsync } from '../../../cor/store/dialog';
import { toastMsg } from '../../../cor/store/toast';
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
}

function GroupKpiRow({ group }: GroupKpiRowProps) {
  const kpi = useGroupKpi(group.id);
  if (kpi.flockCount === 0) return null;

  const profitTone = kpi.totalProfit > 0 ? 'var(--accent)' : kpi.totalProfit < 0 ? 'var(--danger)' : 'var(--muted)';
  const mortalityTone = kpi.mortalityRate > 5 ? 'var(--danger)' : kpi.mortalityRate > 3 ? 'var(--warn)' : 'var(--accent)';

  return (
    <div style={{
      marginTop: 6,
      padding: 'var(--pad-tight)',
      background: 'var(--card-solid)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-sm)',
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap',
      fontSize: 10,
      color: 'var(--muted)',
    }}>
      <span>🐔 <b style={{ color: 'var(--text)' }}>{toFa(kpi.totalCurrent)}</b></span>
      {kpi.totalDeaths > 0 && (
        <span>💀 <b style={{ color: mortalityTone }}>{toFa(kpi.totalDeaths)}</b> ({toFa(kpi.mortalityRate.toFixed(1))}٪)</span>
      )}
      {kpi.totalCost > 0 && <span>💰 <b style={{ color: 'var(--text)' }}>{toFa(Math.round(kpi.totalCost / 1_000_000))}M</b></span>}
      {kpi.totalRevenue > 0 && <span>📈 <b style={{ color: profitTone }}>{toFa(Math.round(kpi.totalProfit / 1_000_000))}M</b></span>}
    </div>
  );
}

interface FormState {
  name: string;
  type: FlockGroupType;
  description: string;
  color: string;
  parentGroupId: string;
}

const EMPTY_FORM: FormState = {
  name: '', type: 'custom', description: '', color: '', parentGroupId: '',
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

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);

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
      rule: undefined,
      archived: false,
      sortOrder: 0,
    };
    if (editingId) {
      updateGroup(editingId, data);
      toastMsg.saved(form.name);
    } else {
      addGroup(data);
      toastMsg.added(form.name, 'گروه');
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
        <GroupKpiRow group={node} />
      </div>
      {node.children.map(child => renderNode(child, depth + 1))}
    </div>
  );

  return (
    <Modal open={open} onClose={onClose} title="📁 مدیریت گروه‌های گله">
      {!showForm ? (
        <>
          <div style={{ marginBottom: 12 }}>
            <Btn variant="primary" onClick={handleNew} style={{ width: '100%' }}>+ گروه جدید</Btn>
          </div>

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
            <Input value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} placeholder="#3b82f6 یا خالی" />
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
    </Modal>
  );
}
