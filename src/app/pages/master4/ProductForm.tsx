import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Package } from 'lucide-react';
import { PageHeader } from '../../components/master/PageHeader';
import { ImageUpload } from '../../components/master/ImageUpload';
import { Switch } from '../../components/master/Switch';
import { inputStyle, selectStyle, labelStyle, errorTextStyle, primaryButtonStyle, secondaryButtonStyle } from '../../components/master/styles';
import { useToast, ToastContainer } from '../../components/Toast';
import {
  useMasterData, getProduct, isProductNameTaken, upsertProduct,
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

  const [name, setName] = useState(existing?.name ?? '');
  const [companyId, setCompanyId] = useState(existing?.companyId ?? '');
  const [categoryId, setCategoryId] = useState(existing?.categoryId ?? '');
  const [image, setImage] = useState<string | null>(existing?.image ?? null);
  const [isAvailable, setIsAvailable] = useState(existing?.isAvailable ?? true);
  const [quoteSuffix, setQuoteSuffix] = useState(existing?.quoteSuffix ?? '');
  const [availableQty, setAvailableQty] = useState(existing?.availableQty ?? 0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    const e: Record<string, string> = {};
    const trimmedName = name.trim();
    if (!trimmedName) e.name = 'Name is required';
    else if (isProductNameTaken(trimmedName, existing?.id)) e.name = 'This name already exists';
    if (!companyId) e.companyId = 'Company is required';
    if (!categoryId) e.categoryId = 'Product Category is required';
    if (Object.keys(e).length) { setErrors(e); return; }

    setSaving(true);
    setTimeout(() => {
      upsertProduct({
        name: trimmedName, companyId, categoryId, image, isAvailable,
        quoteSuffix: quoteSuffix.trim(), availableQty: Number(availableQty),
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
          subtitle="Manage product details"
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
            <select value={categoryId} onChange={e => { setCategoryId(e.target.value); if (errors.categoryId) setErrors(x => ({ ...x, categoryId: '' })); }} style={{ ...selectStyle, borderColor: errors.categoryId ? '#EF4444' : 'var(--color-border)' }}>
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
            <label style={labelStyle}>Quote Suffix</label>
            <input value={quoteSuffix} maxLength={20} onChange={e => setQuoteSuffix(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Available Qty</label>
            <input type="number" min={0} value={availableQty} onChange={e => setAvailableQty(Number(e.target.value))} style={inputStyle} />
          </div>
        </div>

        <Switch checked={isAvailable} onChange={setIsAvailable} label="Available" />
      </CardSection>
    </div>
  );
}
