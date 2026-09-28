import { useMemo, useState } from 'react';
import { Grid3x3 } from 'lucide-react';
import { PageHeader } from '../../components/master/PageHeader';
import { EmptyState } from '../../components/EmptyState';
import { inputStyle, selectStyle, primaryButtonStyle, secondaryButtonStyle } from '../../components/master/styles';
import { useToast, ToastContainer } from '../../components/Toast';
import { useMasterData, setProductPrice, formatIDR } from '../../core/masterStore';

function cellKey(productId: string, tierId: string) {
  return `${productId}::${tierId}`;
}

export function PriceMatrix() {
  const data = useMasterData();
  const { toasts, showToast, dismiss } = useToast();

  const [companyFilter, setCompanyFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [pending, setPending] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pct, setPct] = useState('10');

  const activeTiers = data.priceTiers.filter(t => !t.deletedAt);
  const companyById = useMemo(() => new Map(data.companies.map(c => [c.id, c])), [data.companies]);
  const categoryById = useMemo(() => new Map(data.productCategories.map(c => [c.id, c])), [data.productCategories]);

  const products = useMemo(() => data.products
    .filter(p => !p.deletedAt)
    .filter(p => companyFilter === 'all' ? true : p.companyId === companyFilter)
    .filter(p => categoryFilter === 'all' ? true : p.categoryId === categoryFilter)
    .sort((a, b) => a.name.localeCompare(b.name)),
  [data.products, companyFilter, categoryFilter]);

  const getValue = (productId: string, tierId: string): number | null => {
    const key = cellKey(productId, tierId);
    if (key in pending) return pending[key];
    const product = data.products.find(p => p.id === productId);
    const entry = product?.prices.find(pr => pr.priceTierId === tierId);
    return entry ? entry.price : null;
  };

  const setPendingValue = (productId: string, tierId: string, value: number | null) => {
    const key = cellKey(productId, tierId);
    setPending(prev => ({ ...prev, [key]: value ?? 0 }));
  };

  const toggleSelect = (productId: string, tierId: string) => {
    const key = cellKey(productId, tierId);
    setSelected(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const changeCount = Object.keys(pending).length;

  const handleSave = () => {
    Object.entries(pending).forEach(([key, value]) => {
      const [productId, tierId] = key.split('::');
      setProductPrice(productId, tierId, value);
    });
    showToast('success', 'Prices saved', `${changeCount} price${changeCount === 1 ? '' : 's'} updated.`);
    setPending({});
    setSelected(new Set());
  };

  const handleDiscard = () => {
    setPending({});
    setSelected(new Set());
  };

  const handleApplyPct = () => {
    const p = Number(pct);
    if (isNaN(p) || selected.size === 0) return;
    const updates: Record<string, number> = {};
    selected.forEach(key => {
      const [productId, tierId] = key.split('::');
      const current = getValue(productId, tierId) ?? 0;
      updates[key] = Math.max(0, current * (1 + p / 100));
    });
    setPending(prev => ({ ...prev, ...updates }));
  };

  return (
    <div>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <PageHeader
        core="core-4"
        trail={['Master', 'Price Matrix']}
        title="Price Matrix"
        subtitle="Bulk-edit product prices across every price tier"
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: 16, backgroundColor: 'var(--color-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', marginBottom: 16 }}>
        <select value={companyFilter} onChange={e => setCompanyFilter(e.target.value)} style={{ ...selectStyle, width: 'auto' }}>
          <option value="all">Company: All</option>
          {data.companies.filter(c => !c.deletedAt).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ ...selectStyle, width: 'auto' }}>
          <option value="all">Category: All</option>
          {data.productCategories.filter(c => !c.deletedAt).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '13px', color: 'var(--color-muted-foreground)' }}>
            {selected.size} cell{selected.size === 1 ? '' : 's'} selected
          </span>
          <input
            type="number" value={pct} onChange={e => setPct(e.target.value)}
            style={{ ...inputStyle, width: 80 }} placeholder="%"
          />
          <button
            onClick={handleApplyPct}
            disabled={selected.size === 0}
            style={{ ...secondaryButtonStyle, opacity: selected.size === 0 ? 0.5 : 1, cursor: selected.size === 0 ? 'not-allowed' : 'pointer' }}
          >
            Apply % change
          </button>
        </div>
      </div>

      {products.length === 0 ? (
        <div style={{ backgroundColor: 'var(--color-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
          <EmptyState icon={Grid3x3} title="No products to price" description="Add products first, then set their prices here." />
        </div>
      ) : (
        <div style={{ backgroundColor: 'var(--color-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-secondary)' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', position: 'sticky', left: 0, backgroundColor: 'var(--color-secondary)', fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 600, color: 'var(--color-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Product
                </th>
                {activeTiers.map(t => (
                  <th key={t.id} style={{ padding: '12px 16px', textAlign: 'left', fontFamily: 'var(--font-family-geist)', fontSize: '12px', fontWeight: 600, color: 'var(--color-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                    {t.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id}>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', position: 'sticky', left: 0, backgroundColor: 'var(--color-card)' }}>
                    <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 500, color: 'var(--color-foreground)' }}>{product.name}</div>
                    <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)' }}>
                      {companyById.get(product.companyId)?.name} · {categoryById.get(product.categoryId)?.name}
                    </div>
                  </td>
                  {activeTiers.map(tier => {
                    const key = cellKey(product.id, tier.id);
                    const isPending = key in pending;
                    const isSelected = selected.has(key);
                    const value = getValue(product.id, tier.id);
                    return (
                      <td key={tier.id}
                        style={{
                          padding: '6px 8px', borderBottom: '1px solid var(--color-border)',
                          backgroundColor: isSelected ? 'rgba(124,58,237,0.08)' : isPending ? 'rgba(245,158,11,0.08)' : 'transparent',
                        }}
                        onClick={e => { if (e.metaKey || e.ctrlKey) toggleSelect(product.id, tier.id); }}
                      >
                        <input
                          type="number" min={0} step="0.01"
                          value={value ?? ''}
                          placeholder="—"
                          onChange={e => setPendingValue(product.id, tier.id, e.target.value === '' ? null : Number(e.target.value))}
                          style={{
                            ...inputStyle, padding: '7px 8px', width: 130,
                            borderColor: isPending ? '#F59E0B' : 'var(--color-border)',
                          }}
                        />
                        {value != null && <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '11px', color: 'var(--color-muted-foreground)', marginTop: 2 }}>{formatIDR(value)}</div>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {changeCount > 0 && (
        <div style={{
          position: 'sticky', bottom: 16, marginTop: 16, padding: '14px 20px', borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--color-foreground)', color: 'var(--color-background, white)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        }}>
          <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', fontWeight: 600 }}>
            {changeCount} unsaved change{changeCount === 1 ? '' : 's'}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleDiscard} style={{ ...secondaryButtonStyle, backgroundColor: 'transparent', color: 'inherit', borderColor: 'rgba(255,255,255,0.3)' }}>Discard</button>
            <button onClick={handleSave} style={primaryButtonStyle}>Save</button>
          </div>
        </div>
      )}
    </div>
  );
}
