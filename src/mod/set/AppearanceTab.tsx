import { useSet, MODULE_LABELS } from './store';
import { Btn, Field, Grid2, Select } from '../../shr/components/ui';
import { toFa } from '../../shr/utils/fa';
import SettingsGroup from './SettingsGroup';
import { ToggleRow, ColorBtn } from './helpers';
import { showToast } from '../../cor/store/toast';

export default function AppearanceTab() {
  const s = useSet();
  const themes: [string, string, string][] = [['light', '☀', 'روشن'], ['dark', '🌙', 'تیره']];
  const fontSizes: [string, string][] = [['small', 'کوچک'], ['medium', 'متوسط'], ['large', 'بزرگ'], ['xlarge', 'خیلی بزرگ']];
  const densities: [string, string][] = [['compact', 'فشرده'], ['comfortable', 'راحت']];
  const papers: [string, string][] = [['A4', 'A4'], ['A5', 'A5']];

  const activeNavCount = s.bottomNav.filter(x => x).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>

      <SettingsGroup icon="🎨" title="تم و رنگ" subtitle={s.theme === 'light' ? 'روشن · سبز' : 'تیره · سبز'} tone="accent" defaultOpen>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {themes.map(([v, ic, l]) => (
            <button key={v} type="button" onClick={() => s.update({ theme: v as any })} style={{
              padding: '14px 12px',
              background: s.theme === v ? 'var(--accent-soft)' : 'var(--btn-bg)',
              border: '2px solid ' + (s.theme === v ? 'var(--accent-border)' : 'var(--border)'),
              borderRadius: 'var(--r-md)', cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--gap-sm)',
              color: s.theme === v ? 'var(--accent)' : 'var(--muted)',
              fontWeight: 600, fontSize: 'var(--fs-base)'
            }}>
              <span style={{ fontSize: 'var(--fs-xl)' }}>{ic}</span>
              <span>{l}</span>
            </button>
          ))}
        </div>
        <Field label="رنگ اصلی">
          <div style={{ display: 'flex', gap: 8 }}>
            <ColorBtn color="green" active={s.accentColor === 'green'} onClick={() => s.update({ accentColor: 'green' })} />
            <ColorBtn color="blue" active={s.accentColor === 'blue'} onClick={() => s.update({ accentColor: 'blue' })} />
            <ColorBtn color="orange" active={s.accentColor === 'orange'} onClick={() => s.update({ accentColor: 'orange' })} />
            <ColorBtn color="purple" active={s.accentColor === 'purple'} onClick={() => s.update({ accentColor: 'purple' })} />
          </div>
        </Field>
      </SettingsGroup>

      <SettingsGroup icon="🔤" title="فونت و چیدمان" subtitle={`اندازه ${fontSizes.find(f => f[0] === s.fontSize)?.[1] || 'متوسط'}`} tone="info">
        <Field label="اندازه فونت">
          <Select value={s.fontSize} onChange={e => s.update({ fontSize: e.target.value as any })}>
            {fontSizes.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
        </Field>
        <Field label="حالت نمایش">
          <Select value={s.density} onChange={e => s.update({ density: e.target.value as any })}>
            {densities.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
        </Field>
        <ToggleRow
          label="انیمیشن‌ها"
          sub="باز/بسته شدن کارت‌ها و مودال‌ها"
          value={s.animations}
          onChange={() => s.update({ animations: !s.animations })}
        />
        <ToggleRow
          label="حالت کم‌مصرف"
          sub="برای گوشی‌های ضعیف یا باتری کم"
          value={s.lowPowerMode}
          onChange={() => s.update({ lowPowerMode: !s.lowPowerMode })}
        />
        <ToggleRow
          label="کنتراست بالا"
          sub="کادرها ضخیم‌تر، متن واضح‌تر"
          value={s.highContrast}
          onChange={() => s.update({ highContrast: !s.highContrast })}
        />
      </SettingsGroup>

      <SettingsGroup icon="📱" title="منوی پایین" subtitle={`${toFa(activeNavCount)} از ۵ جای خالی`} tone="purple">
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', lineHeight: 1.7 }}>
          نوار پایین را دلخواه تنظیم کنید
        </div>

        {/* پیش‌نمایش */}
        <div style={{ display: 'flex', background: 'var(--card-solid)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '6px 4px', gap: 4 }}>
          {s.bottomNav.map((id, i) => {
            const m = MODULE_LABELS[id];
            return (
              <div key={i} style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 'var(--gap-xs)', padding: '4px 0',
                fontSize: 'var(--fs-xs)',
                color: i === 0 ? 'var(--accent)' : 'var(--dim)',
                fontWeight: i === 0 ? 600 : 400
              }}>
                <span style={{ fontSize: 'var(--fs-md)' }}>{m ? m.icon : '❓'}</span>
                <span style={{ fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                  {m ? m.name : '—'}
                </span>
              </div>
            );
          })}
        </div>

        {[0, 1, 2, 3, 4].map(slot => {
          const currentId = s.bottomNav[slot] || '';
          const usedIds = s.bottomNav.filter((x, i) => i !== slot && x);
          return (
            <Field key={slot} label={`جای ${toFa(slot + 1)}${slot === 0 ? ' (قفل)' : ''}`}>
              <Select
                value={currentId}
                disabled={slot === 0}
                onChange={e => {
                  const newNav = [...s.bottomNav];
                  newNav[slot] = e.target.value;
                  s.update({ bottomNav: newNav });
                }}
              >
                {slot === 0 ? (
                  <option value="dsh">🏠 داشبورد</option>
                ) : (
                  <>
                    <option value="">— خالی —</option>
                    {Object.entries(MODULE_LABELS).map(([id, m]) => {
                      if (id === 'dsh') return null;
                      if (usedIds.includes(id)) return null;
                      return <option key={id} value={id}>{m.icon} {m.name}</option>;
                    })}
                  </>
                )}
              </Select>
            </Field>
          );
        })}

        <Btn size="sm" full onClick={() => s.update({ bottomNav: ['dsh', 'dlg', 'inc', 'rep', 'set'] })}>
          🔄 بازنشانی به پیش‌فرض
        </Btn>
      </SettingsGroup>

      <SettingsGroup icon="🖨" title="چاپ" subtitle={`کاغذ ${s.printPaper}`} tone="warn">
        <Field label="اندازه‌ی کاغذ پیش‌فرض">
          <Select value={s.printPaper} onChange={e => s.update({ printPaper: e.target.value as any })}>
            {papers.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
        </Field>
      </SettingsGroup>

    </div>
  );
}
