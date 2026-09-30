import { useState } from 'react';
import { Settings2, FlaskConical } from 'lucide-react';
import { useMasterData } from '../../core/masterStore';
import {
  useClientProfileUI, setActiveCompany, setPermission,
  PERMISSION_KEYS, PERMISSION_LABELS,
} from '../../core/clientProfileUI';
import { selectStyle } from './styles';
import { Switch } from './Switch';

/**
 * "Viewing as: <Company>" selector + a dev-only permission simulator, scoped to
 * Client Profile pages only. Sits at the top of every Client Profile page,
 * next to the breadcrumb.
 */
export function ActiveCompanyBar() {
  const data = useMasterData();
  const { activeCompanyId, permissions } = useClientProfileUI();
  const [panelOpen, setPanelOpen] = useState(false);
  const companies = data.companies.filter(c => c.deletedAt === null);
  const activeCompany = companies.find(c => c.id === activeCompanyId);

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: 'var(--color-muted-foreground)' }}>
          Viewing as:
        </span>
        <select
          value={activeCompanyId}
          onChange={e => setActiveCompany(e.target.value)}
          style={{ ...selectStyle, width: 'auto', minWidth: 200, padding: '6px 34px 6px 10px', fontSize: '13px' }}
          aria-label="Active company"
        >
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button
          onClick={() => setPanelOpen(v => !v)}
          aria-label="Simulate permissions"
          aria-expanded={panelOpen}
          title="Simulate permissions"
          style={{
            padding: 7, borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)',
            backgroundColor: panelOpen ? 'var(--color-secondary)' : 'var(--color-card)', cursor: 'pointer',
            display: 'inline-flex', color: 'var(--color-muted-foreground)',
          }}
        >
          <Settings2 size={14} />
        </button>
        {!activeCompany && (
          <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: '#EF4444' }}>
            No company selected
          </span>
        )}
      </div>

      {panelOpen && (
        <div style={{
          marginTop: 10, padding: 16, borderRadius: 'var(--radius-lg)',
          border: '1px dashed var(--color-border)', backgroundColor: 'var(--color-card)', maxWidth: 520,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <FlaskConical size={14} style={{ color: '#7C3AED' }} />
            <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 700, color: 'var(--color-foreground)' }}>
              Simulate permissions
            </span>
            <span style={{
              fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
              padding: '2px 7px', borderRadius: 999, backgroundColor: 'rgba(124,58,237,0.1)', color: '#7C3AED',
            }}>
              Prototype only
            </span>
          </div>
          <p style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)', margin: '4px 0 14px' }}>
            Toggle these off to demo how access rules hide or disable actions. Not real permissions.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {PERMISSION_KEYS.map(key => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: 'var(--color-foreground)' }}>
                    {PERMISSION_LABELS[key]}
                  </div>
                  <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', color: 'var(--color-muted-foreground)' }}>
                    {key}
                  </div>
                </div>
                <Switch checked={permissions[key]} onChange={v => setPermission(key, v)} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
