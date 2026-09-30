import { useState } from 'react';
import { Plus, Star, Pencil, Trash2, ShieldAlert, Receipt } from 'lucide-react';
import { MasterTable, type MasterColumn } from '../../../../components/master/MasterTable';
import { FormDrawer } from '../../../../components/master/FormDrawer';
import { ConfirmDialog } from '../../../../components/master/ConfirmDialog';
import { FileUpload } from '../../../../components/master/FileUpload';
import { EmptyState } from '../../../../components/EmptyState';
import { inputStyle, labelStyle, errorTextStyle, primaryButtonStyle } from '../../../../components/master/styles';
import { Switch } from '../../../../components/master/Switch';
import { hasPermission } from '../../../../core/clientProfileUI';
import {
  useClientProfileData, getBillingsForClient, upsertBilling, deleteBilling,
  type ClientRecord, type ClientBilling, type BillingFormInput,
} from '../../../../core/clientProfileStore';
import { formatDate } from '../../../../core/masterStore';
import type { ToastType } from '../../../../components/Toast';

interface TabProps {
  client: ClientRecord;
  showToast: (type: ToastType, title: string, message?: string) => void;
}

const textareaStyle = { ...inputStyle, minHeight: 70, resize: 'vertical' as const, fontFamily: 'var(--font-family-geist)' };
const iconBtn = {
  padding: 7, borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-card)', cursor: 'pointer', display: 'inline-flex',
} as const;

export function BillingsTab({ client, showToast }: TabProps) {
  useClientProfileData();
  const billings = getBillingsForClient(client.id).sort((a, b) => Number(b.primary) - Number(a.primary));
  const [drawerRecord, setDrawerRecord] = useState<ClientBilling | null | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<ClientBilling | null>(null);

  if (!hasPermission('client-billing:read')) {
    return (
      <div style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
        <EmptyState icon={ShieldAlert} title="No access" description="You don't have access to Billings." />
      </div>
    );
  }

  const columns: MasterColumn<ClientBilling>[] = [
    { key: 'name', label: 'Name', render: r => (
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
        {r.primary && <Star size={13} style={{ color: '#F59E0B', fill: '#F59E0B' }} />} {r.name}
      </span>
    ) },
    { key: 'email', label: 'Email', render: r => r.email },
    { key: 'address', label: 'Billing Address', render: r => <span title={r.billingAddress}>{r.billingAddress.length > 40 ? r.billingAddress.slice(0, 40) + '…' : r.billingAddress}</span> },
    { key: 'updatedAt', label: 'Updated at', render: r => <span style={{ color: 'var(--color-muted-foreground)' }}>{formatDate(r.updatedAt)}</span> },
    { key: 'actions', label: 'Actions', render: r => (
      <div style={{ display: 'flex', gap: 6 }}>
        {hasPermission('client-billing:write') && <button onClick={() => setDrawerRecord(r)} style={iconBtn} aria-label="Edit"><Pencil size={14} /></button>}
        {hasPermission('client-billing:write') && <button onClick={() => setDeleteTarget(r)} style={{ ...iconBtn, color: '#EF4444' }} aria-label="Delete"><Trash2 size={14} /></button>}
      </div>
    ) },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        {hasPermission('client-billing:write') && (
          <button style={primaryButtonStyle} onClick={() => setDrawerRecord(null)}><Plus size={15} /> Add Billing</button>
        )}
      </div>

      {billings.length === 0 ? (
        <div style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
          <EmptyState icon={Receipt} title="No billings yet" description="Add a billing record for this client." />
        </div>
      ) : (
        <MasterTable columns={columns} rows={billings} getRowId={r => r.id} page={1} pageSize={billings.length} total={billings.length} onPageChange={() => {}} />
      )}

      {drawerRecord !== undefined && (
        <BillingDrawer
          clientId={client.id}
          record={drawerRecord}
          onClose={() => setDrawerRecord(undefined)}
          onSaved={isNew => { setDrawerRecord(undefined); showToast('success', isNew ? 'Billing added' : 'Billing updated'); }}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Billing?"
          message={`Are you sure you want to delete "${deleteTarget.name}"?`}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => { deleteBilling(deleteTarget.id); showToast('success', 'Deleted'); setDeleteTarget(null); }}
        />
      )}
    </div>
  );
}

function BillingDrawer({ clientId, record, onClose, onSaved }: {
  clientId: string; record: ClientBilling | null; onClose: () => void; onSaved: (isNew: boolean) => void;
}) {
  const [name, setName] = useState(record?.name ?? '');
  const [email, setEmail] = useState(record?.email ?? '');
  const [phoneNumber, setPhoneNumber] = useState(record?.phoneNumber ?? '');
  const [mobileNumber, setMobileNumber] = useState(record?.mobileNumber ?? '');
  const [faxNumber, setFaxNumber] = useState(record?.faxNumber ?? '');
  const [billingAddress, setBillingAddress] = useState(record?.billingAddress ?? '');
  const [shippingAddress, setShippingAddress] = useState(record?.shippingAddress ?? '');
  const [primary, setPrimary] = useState(record?.primary ?? false);
  const [npwp, setNpwp] = useState(record?.npwp ?? '');
  const [ktp, setKtp] = useState(record?.ktp ?? '');
  const [npwpImage, setNpwpImage] = useState<string | null>(record?.npwpImage ?? null);
  const [ktpImage, setKtpImage] = useState<string | null>(record?.ktpImage ?? null);
  const [extraNotes, setExtraNotes] = useState(record?.extraNotes ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!email.trim()) e.email = 'Email is required';
    if (!billingAddress.trim()) e.billingAddress = 'Billing address is required';
    if (Object.keys(e).length) { setErrors(e); return; }

    const data: BillingFormInput = {
      name: name.trim(), email: email.trim(), phoneNumber, mobileNumber, faxNumber,
      billingAddress: billingAddress.trim(), shippingAddress, primary, npwp, ktp, npwpImage, ktpImage, extraNotes,
    };
    setSaving(true);
    setTimeout(() => { upsertBilling(clientId, data, record?.id); setSaving(false); onSaved(!record); }, 300);
  };

  return (
    <FormDrawer title={record ? 'Edit Billing' : 'Add Billing'} onClose={onClose} onSave={handleSave} saving={saving}>
      <div>
        <label style={labelStyle}>Name <span style={{ color: '#EF4444' }}>*</span></label>
        <input value={name} onChange={e => { setName(e.target.value); if (errors.name) setErrors(x => ({ ...x, name: '' })); }} style={{ ...inputStyle, borderColor: errors.name ? '#EF4444' : 'var(--color-border)' }} />
        {errors.name && <div style={errorTextStyle}>{errors.name}</div>}
      </div>
      <div>
        <label style={labelStyle}>Email <span style={{ color: '#EF4444' }}>*</span></label>
        <input value={email} onChange={e => { setEmail(e.target.value); if (errors.email) setErrors(x => ({ ...x, email: '' })); }} style={{ ...inputStyle, borderColor: errors.email ? '#EF4444' : 'var(--color-border)' }} />
        {errors.email && <div style={errorTextStyle}>{errors.email}</div>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div><label style={labelStyle}>Phone Number</label><input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} style={inputStyle} /></div>
        <div><label style={labelStyle}>Mobile Number</label><input value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} style={inputStyle} /></div>
      </div>
      <div><label style={labelStyle}>Fax Number</label><input value={faxNumber} onChange={e => setFaxNumber(e.target.value)} style={inputStyle} /></div>
      <div>
        <label style={labelStyle}>Billing Address <span style={{ color: '#EF4444' }}>*</span></label>
        <textarea value={billingAddress} onChange={e => { setBillingAddress(e.target.value); if (errors.billingAddress) setErrors(x => ({ ...x, billingAddress: '' })); }} style={{ ...textareaStyle, borderColor: errors.billingAddress ? '#EF4444' : 'var(--color-border)' }} />
        {errors.billingAddress && <div style={errorTextStyle}>{errors.billingAddress}</div>}
      </div>
      <div><label style={labelStyle}>Shipping Address</label><textarea value={shippingAddress} onChange={e => setShippingAddress(e.target.value)} style={textareaStyle} /></div>
      <Switch checked={primary} onChange={setPrimary} label="Primary" helperText="Turning this on unsets any other primary billing for this client." />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div><label style={labelStyle}>NPWP</label><input value={npwp} onChange={e => setNpwp(e.target.value)} style={inputStyle} /></div>
        <div><label style={labelStyle}>KTP</label><input value={ktp} onChange={e => setKtp(e.target.value)} style={inputStyle} /></div>
      </div>
      <FileUpload label="NPWP Image" value={npwpImage} onChange={(v) => setNpwpImage(v)} />
      <FileUpload label="KTP Image" value={ktpImage} onChange={(v) => setKtpImage(v)} />
      <div><label style={labelStyle}>Extra Notes</label><textarea value={extraNotes} onChange={e => setExtraNotes(e.target.value)} style={textareaStyle} /></div>
    </FormDrawer>
  );
}
