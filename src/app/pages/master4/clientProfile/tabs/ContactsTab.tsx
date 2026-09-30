import { useState } from 'react';
import { Plus, Star, ShieldCheck, ShieldOff, UserX, Pencil, X as XIcon } from 'lucide-react';
import { MasterTable, type MasterColumn } from '../../../../components/master/MasterTable';
import { FormDrawer } from '../../../../components/master/FormDrawer';
import { StatusPill } from '../../../../components/master/StatusPill';
import { EmptyState } from '../../../../components/EmptyState';
import { inputStyle, selectStyle, labelStyle, helperStyle, errorTextStyle, primaryButtonStyle, secondaryButtonStyle } from '../../../../components/master/styles';
import { Switch } from '../../../../components/master/Switch';
import { useClientProfileUI, hasPermission } from '../../../../core/clientProfileUI';
import {
  useClientProfileData, getContactsForClientCompany, isContactEmailTaken, upsertContact,
  deactivateContact, setContactVerified, adminUsers,
  type ClientRecord, type ClientContact, type ContactPhone,
} from '../../../../core/clientProfileStore';
import { UserSquare2 } from 'lucide-react';
import type { ToastType } from '../../../../components/Toast';

interface TabProps {
  client: ClientRecord;
  showToast: (type: ToastType, title: string, message?: string) => void;
}

const CURRENT_ADMIN_NAME = adminUsers[0]?.name ?? 'Admin';

export function ContactsTab({ client, showToast }: TabProps) {
  useClientProfileData();
  const { activeCompanyId } = useClientProfileUI();
  const contacts = getContactsForClientCompany(client.id, activeCompanyId).sort((a, b) => Number(b.isPrimaryForCompany) - Number(a.isPrimaryForCompany));

  const [drawerContact, setDrawerContact] = useState<ClientContact | null | undefined>(undefined);

  const columns: MasterColumn<ClientContact>[] = [
    { key: 'name', label: 'Name', render: r => (
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
        {r.isPrimaryForCompany && <Star size={13} style={{ color: '#F59E0B', fill: '#F59E0B' }} />}
        {r.name}
      </span>
    ) },
    { key: 'salutation', label: 'Salutation', render: r => r.salutation },
    { key: 'position', label: 'Position', render: r => r.position || '—' },
    { key: 'email', label: 'Email', render: r => r.email },
    { key: 'phone', label: 'Phone', render: r => (
      <span>{r.phones[0]?.number ?? '—'}{r.phones.length > 1 && <span style={{ color: 'var(--color-muted-foreground)' }}> +{r.phones.length - 1} more</span>}</span>
    ) },
    { key: 'active', label: 'Active', render: r => r.active ? <StatusPill label="Active" tone="success" /> : <StatusPill label="Inactive" tone="neutral" /> },
    { key: 'verified', label: 'Verified', render: r => r.verified ? <StatusPill label="Verified" tone="success" /> : <StatusPill label="Not verified" tone="neutral" /> },
    { key: 'actions', label: 'Actions', render: r => (
      <div style={{ display: 'flex', gap: 6 }}>
        {hasPermission('client-contact:write') && (
          <button onClick={() => setDrawerContact(r)} style={iconBtn} aria-label="Edit" title="Edit"><Pencil size={14} /></button>
        )}
        {hasPermission('client-contact:write') && r.active && (
          <button onClick={() => { deactivateContact(r.id); showToast('success', 'Contact deactivated'); }} style={{ ...iconBtn, color: '#EF4444' }} aria-label="Deactivate" title="Deactivate"><UserX size={14} /></button>
        )}
        {hasPermission('client-contact:verify') && (
          <button
            onClick={() => { setContactVerified(r.id, !r.verified, r.verified ? null : CURRENT_ADMIN_NAME); showToast('success', r.verified ? 'Verification removed' : 'Contact verified'); }}
            style={{ ...iconBtn, color: r.verified ? 'var(--color-muted-foreground)' : '#10B981' }}
            aria-label={r.verified ? 'Unverify' : 'Verify'} title={r.verified ? 'Unverify' : 'Verify'}
          >
            {r.verified ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}
          </button>
        )}
      </div>
    ) },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        {hasPermission('client-contact:write') && (
          <button style={primaryButtonStyle} onClick={() => setDrawerContact(null)}><Plus size={15} /> Add Contact</button>
        )}
      </div>

      {contacts.length === 0 ? (
        <div style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
          <EmptyState icon={UserSquare2} title="No contacts yet" description="Add a contact for this company to get started." />
        </div>
      ) : (
        <MasterTable
          columns={columns}
          rows={contacts}
          getRowId={r => r.id}
          page={1}
          pageSize={contacts.length}
          total={contacts.length}
          onPageChange={() => {}}
        />
      )}

      {drawerContact !== undefined && (
        <ContactDrawer
          clientId={client.id}
          companyId={activeCompanyId}
          contact={drawerContact}
          onClose={() => setDrawerContact(undefined)}
          onSaved={isNew => { setDrawerContact(undefined); showToast('success', isNew ? 'Contact added' : 'Contact updated'); }}
        />
      )}
    </div>
  );
}

const iconBtn = {
  padding: 7, borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-card)', cursor: 'pointer', display: 'inline-flex',
} as const;

function ContactDrawer({ clientId, companyId, contact, onClose, onSaved }: {
  clientId: string; companyId: string; contact: ClientContact | null;
  onClose: () => void; onSaved: (isNew: boolean) => void;
}) {
  const [salutation, setSalutation] = useState<ClientContact['salutation']>(contact?.salutation ?? 'Mr');
  const [name, setName] = useState(contact?.name ?? '');
  const [position, setPosition] = useState(contact?.position ?? '');
  const [email, setEmail] = useState(contact?.email ?? '');
  const [officeEmail, setOfficeEmail] = useState(contact?.officeEmail ?? '');
  const [phones, setPhones] = useState<ContactPhone[]>(contact?.phones?.length ? contact.phones : [{ number: '', type: 'Mobile' }]);
  const [active, setActive] = useState(contact?.active ?? true);
  const [isPrimary, setIsPrimary] = useState(contact?.isPrimaryForCompany ?? false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const updatePhone = (i: number, patch: Partial<ContactPhone>) => setPhones(p => p.map((ph, idx) => idx === i ? { ...ph, ...patch } : ph));
  const addPhone = () => setPhones(p => [...p, { number: '', type: 'Mobile' }]);
  const removePhone = (i: number) => setPhones(p => p.filter((_, idx) => idx !== i));

  const handleSave = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!email.trim()) e.email = 'Email is required';
    else if (isContactEmailTaken(email.trim(), contact?.id)) e.email = 'This email is already used by another contact';
    if (Object.keys(e).length) { setErrors(e); return; }

    setSaving(true);
    setTimeout(() => {
      upsertContact(clientId, companyId, {
        salutation, name: name.trim(), position: position.trim(), email: email.trim(), officeEmail: officeEmail.trim(),
        phones: phones.filter(p => p.number.trim()), active, isPrimaryForCompany: isPrimary,
      }, contact?.id);
      setSaving(false);
      onSaved(!contact);
    }, 300);
  };

  return (
    <FormDrawer title={contact ? 'Edit Contact' : 'Add Contact'} onClose={onClose} onSave={handleSave} saving={saving}>
      <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Salutation</label>
          <select value={salutation} onChange={e => setSalutation(e.target.value as any)} style={selectStyle}>
            <option value="Mr">Mr</option>
            <option value="Mrs">Mrs</option>
            <option value="Ms">Ms</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Name <span style={{ color: '#EF4444' }}>*</span></label>
          <input value={name} onChange={e => { setName(e.target.value); if (errors.name) setErrors(x => ({ ...x, name: '' })); }} style={{ ...inputStyle, borderColor: errors.name ? '#EF4444' : 'var(--color-border)' }} />
          {errors.name && <div style={errorTextStyle}>{errors.name}</div>}
        </div>
      </div>

      <div>
        <label style={labelStyle}>Position</label>
        <input value={position} onChange={e => setPosition(e.target.value)} style={inputStyle} />
      </div>

      <div>
        <label style={labelStyle}>Email <span style={{ color: '#EF4444' }}>*</span></label>
        <input value={email} onChange={e => { setEmail(e.target.value); if (errors.email) setErrors(x => ({ ...x, email: '' })); }} style={{ ...inputStyle, borderColor: errors.email ? '#EF4444' : 'var(--color-border)' }} />
        {errors.email && <div style={errorTextStyle}>{errors.email}</div>}
      </div>

      <div>
        <label style={labelStyle}>Office Email</label>
        <input value={officeEmail} onChange={e => setOfficeEmail(e.target.value)} style={inputStyle} />
      </div>

      <div>
        <label style={labelStyle}>Phone Numbers</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {phones.map((p, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 110px 32px', gap: 8 }}>
              <input value={p.number} onChange={e => updatePhone(i, { number: e.target.value })} placeholder="08xx..." style={inputStyle} />
              <select value={p.type} onChange={e => updatePhone(i, { type: e.target.value as any })} style={selectStyle}>
                <option value="Mobile">Mobile</option>
                <option value="Office">Office</option>
              </select>
              <button type="button" onClick={() => removePhone(i)} style={{ ...iconBtn, color: '#EF4444' }} aria-label="Remove phone"><XIcon size={14} /></button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addPhone} style={{ ...secondaryButtonStyle, marginTop: 8, padding: '6px 12px', fontSize: '12px' }}>+ Add phone</button>
      </div>

      <Switch checked={active} onChange={setActive} label="Active" />

      <div style={{ paddingTop: 12, borderTop: '1px solid var(--color-border)' }}>
        <Switch checked={isPrimary} onChange={setIsPrimary} label="Primary contact for this company" />
        <div style={{ ...helperStyle, marginTop: 6 }}>Turning this on will unset any other primary contact for this client at this company.</div>
      </div>
    </FormDrawer>
  );
}
