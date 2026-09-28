import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Plus, Trash2, Package } from 'lucide-react';
import { PageHeader } from '../../components/master/PageHeader';
import { ImageUpload } from '../../components/master/ImageUpload';
import { Switch } from '../../components/master/Switch';
import { inputStyle, selectStyle, labelStyle, errorTextStyle, primaryButtonStyle, secondaryButtonStyle } from '../../components/master/styles';
import { useToast, ToastContainer } from '../../components/Toast';
import {
  useMasterData, getProduct, isProductNameTaken, upsertProduct, formatIDR,
  type ProductPriceEntry,
} from '../../core/masterStore';

function CardSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 16 }}>
      <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-16)', fontWeight: 700, color: 'var(--color-foreground)', marginBottom: 16 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>{children}</div>
    </div>
  );
}

export function ProductForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const data = useMasterData();
  const existing = id ? getProduct(id) : undefined;
  const { toasts, showToast, dismiss } = useToast();

  const activeCompanies = data.companies.filter(c => !c.deletedAt);
  const activeCategories = data.productCategories.filter(c => !c.deletedAt);
  const activePriceTiers = data.priceTiers.filter(p => !p.deletedAt);

  const [name, setName] = useState(existing?.name ?? '');
  const [companyId, setCompanyId] = useState(existing?.companyId ?? '');
  const [categoryId, setCategoryId] = useState(existing?.categoryId ?? '');
  const [image, setImage] = useState<string | null>(existing?.image ?? null);
  const [quantityUnit, setQuantityUnit] = useState(existing?.quantityUnit ?? '');
  const [durationUnit, setDurationUnit] = useState(existing?.durationUnit ?? '');
  const [active, setActive] = useState(existing?.active ?? true);
  const [prices, setPrices] = useState<ProductPriceEntry[]>(existing?.prices ?? []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleCategoryChange = (id: string) => {
    setCategoryId(id);
    const cat = data.productCategories.find(c => c.id === id);
    if (cat) {
      setQuantityUnit(prev => prev || cat.quantityUnit);
      setDurationUnit(prev => prev || cat.durationUnit);
    }
  };

  const addPriceRow = () => {
    const unused = activePriceTiers.find(t => !prices.some(p => p.priceTierId === t.id));
    if (!unused) return;
    setPrices(prev => [...prev, { priceTierId: unused.id, price: 0 }]);
  };

  const updatePriceRow = (index: number, patch: Partial<ProductPriceEntry>) => {
    setPrices(prev => prev.map((p, i) => i === index ? { ...p, ...patch } : p));
  };

  const removePriceRow = (index: number) => {
    setPrices(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const e: Record<string, string> = {};
    const trimmedName = name.trim();
    if (!trimmedName) e.name = 'Name is required';
    else if (isProductNameTaken(trimmedName, existing?.id)) e.name = 'This name already exists';
    if (!companyId) e.companyId = 'Company is required';
    if (!categoryId) e.categoryId = 'Product Category is required';
    if (prices.length === 0) e.prices = 'No prices yet. Add at least one price tier.';
    const tierIds = new Set<string>();
    for (const p of prices) {
      if (tierIds.has(p.priceTierId)) { e.prices = 'Each price tier can only be used once per product.'; break; }
      tierIds.add(p.priceTierId);
      if (p.price < 0) { e.prices = 'Prices must be 0 or more.'; break; }
    }
    if (Object.keys(e).length) { setErrors(e); return; }

    setSaving(true);
    setTimeout(() => {
      upsertProduct({
        name: trimmedName, companyId, categoryId, image, quantityUnit, durationUnit, active,
        prices: prices.map(p => ({ ...p, price: Number(p.price) })),
      }, existing?.id);
      setSaving(false);
      showToast('success', existing ? 'Product updated' : 'Product added', existing ? 'Changes have been saved.' : 'New product has been added.');
      navigate('/core-4/master/product');
    }, 350);
  };

  return (
    <div>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />

      <div style={{ position: 'sticky', top: 0, zIndex: 10, marginBottom: 20, backgroundColor: 'var(--color-secondary)', paddingBottom: 12 }}>
        <PageHeader
          core="core-4"
          trail={['Master', 'Product', existing ? existing.name : 'Add Product']}
          title={existing ? `Edit ${existing.name}` : 'Add Product'}
          subtitle="Manage product details and pricing"
          actions={
            <>
              <button style={secondaryButtonStyle} onClick={() => navigate('/core-4/master/product')}>Cancel</button>
              <button style={{ ...primaryButtonStyle, opacity: saving ? 0.75 : 1 }} disabled={saving} onClick={handleSave}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </>
          }
        />
      </div>

      <CardSection title="General">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>Company <span style={{ color: '#EF4444' }}>*</span></label>
            <select value={companyId} onChange={e => { setCompanyId(e.target.value); if (errors.companyId) setErrors(x => ({ ...x, companyId: '' })); }} style={{ ...selectStyle, borderColor: errors.companyId ? '#EF4444' : 'var(--color-border)' }}>
              <option value="">Select company…</option>
              {activeCompanies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.companyId && <div style={errorTextStyle}>{errors.companyId}</div>}
          </div>
          <div>
            <label style={labelStyle}>Product Category <span style={{ color: '#EF4444' }}>*</span></label>
            <select value={categoryId} onChange={e => { handleCategoryChange(e.target.value); if (errors.categoryId) setErrors(x => ({ ...x, categoryId: '' })); }} style={{ ...selectStyle, borderColor: errors.categoryId ? '#EF4444' : 'var(--color-border)' }}>
              <option value="">Select category…</option>
              {activeCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.categoryId && <div style={errorTextStyle}>{errors.categoryId}</div>}
          </div>
        </div>

        <div>
          <label style={labelStyle}>Name <span style={{ color: '#EF4444' }}>*</span></label>
          <input value={name} onChange={e => { setName(e.target.value); if (errors.name) setErrors(x => ({ ...x, name: '' })); }} style={{ ...inputStyle, borderColor: errors.name ? '#EF4444' : 'var(--color-border)' }} />
          {errors.name && <div style={errorTextStyle}>{errors.name}</div>}
        </div>

        <ImageUpload label="Image" value={image} onChange={setImage} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>Quantity Unit</label>
            <input value={quantityUnit} onChange={e => setQuantityUnit(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Duration Unit</label>
            <input value={durationUnit} onChange={e => setDurationUnit(e.target.value)} style={inputStyle} />
          </div>
        </div>

        <Switch checked={active} onChange={setActive} label="Active" />
      </CardSection>

      <CardSection title="Pricing">
        {prices.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center' }}>
            <Package size={28} style={{ color: 'var(--color-muted-foreground)', marginBottom: 8 }} />
            <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: 'var(--text-14)', color: 'var(--color-muted-foreground)' }}>
              No prices yet. Add at least one price tier.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {prices.map((p, i) => {
              const usedElsewhere = new Set(prices.filter((_, j) => j !== i).map(pp => pp.priceTierId));
              return (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 200px 36px', gap: 10, alignItems: 'center' }}>
                  <select value={p.priceTierId} onChange={e => updatePriceRow(i, { priceTierId: e.target.value })} style={selectStyle}>
                    {activePriceTiers.map(t => (
                      <option key={t.id} value={t.id} disabled={usedElsewhere.has(t.id)}>{t.name}</option>
                    ))}
                  </select>
                  <input
                    type="number" min={0} step="0.01" value={p.price}
                    onChange={e => updatePriceRow(i, { price: Number(e.target.value) })}
                    style={inputStyle}
                    placeholder="0.00"
                  />
                  <button onClick={() => removePriceRow(i)} style={{ padding: 8, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-card)', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label="Remove price tier">
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
            {prices.some(p => p.price > 0) && (
              <div style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)' }}>
                Preview: {prices.map(p => `${activePriceTiers.find(t => t.id === p.priceTierId)?.name ?? '—'} ${formatIDR(p.price)}`).join(' · ')}
              </div>
            )}
          </div>
        )}
        {errors.prices && <div style={errorTextStyle}>{errors.prices}</div>}
        <div>
          <button
            onClick={addPriceRow}
            disabled={prices.length >= activePriceTiers.length}
            style={{ ...secondaryButtonStyle, opacity: prices.length >= activePriceTiers.length ? 0.5 : 1, cursor: prices.length >= activePriceTiers.length ? 'not-allowed' : 'pointer' }}
          >
            <Plus size={14} /> Add price tier
          </button>
        </div>
      </CardSection>
    </div>
  );
}
