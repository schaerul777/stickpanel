import { useState } from 'react';
import { Plus, Star, UserX, Pencil } from 'lucide-react';
import { MasterTable, type MasterColumn } from '../../../../components/master/MasterTable';
import { FormDrawer } from '../../../../components/master/FormDrawer';
import { StatusPill } from '../../../../components/master/StatusPill';
import { EmptyState } from '../../../../components/EmptyState';
import { inputStyle, selectStyle, labelStyle, errorTextStyle, primaryButtonStyle } from '../../../../components/master/styles';
import { Switch } from '../../../../components/master/Switch';
import { useClientProfileUI, hasPermission } from '../../../../core/clientProfileUI';
import {
  useClientProfileData, getContactsForClient, isContactEmailTaken, upsertContact,
  deactivateContact,
  type ClientRecord, type ClientContact,
} from '../../../../core/clientProfileStore';
import { UserSquare2 } from 'lucide-react';
import type { ToastType } from '../../../../components/Toast';
import { helperStyle } from '../../../../components/master/styles';

interface TabProps {
  client: ClientRecord;
  showToast: (type: ToastType, title: string, message?: string) => void;
}

export function ContactsTab({ client, showToast }: TabProps) {
  useClientProfileData();
  const { activeCompanyId: _activeCompanyId } = useClientProfileUI();
  const contacts = getContactsForClient(client.id).sort((a, b) => Number(b.primaryContact) - Number(a.primaryContact));

  const [drawerContact, setDrawerContact] = useState<ClientContact | null | undefined>(undefined);

  const columns: MasterColumn<ClientContact>[] = [
    { key: 'name', label: 'Name', render: r => (
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
        {r.primaryContact && <Star size={13} style={{ color: '#F59E0B', fill: '#F59E0B' }} />}
        {r.name}
      </span>
    ) },
    { key: 'salutation', label: 'Salutation', render: r => r.salutation },
    { key: 'position', label: 'Position', render: r => r.position || '—' },
    { key: 'email', label: 'Email', render: r => r.email },
    { key: 'mobileNumber', label: 'Mobile', render: r => r.mobileNumber || '—' },
    { key: 'phoneNumber', label: 'Phone', render: r => r.phoneNumber || '—' },
    { key: 'active', label: 'Active', render: r => r.active ? <StatusPill label="Active" tone="success" /> : <StatusPill label="Inactive" tone="neutral" /> },
    { key: 'actions', label: 'Actions', render: r => (
      <div style={{ display: 'flex', gap: 6 }}>
        {hasPermission('client-contact:write') && (
          <button onClick={() => setDrawerContact(r)} style={iconBtn} aria-label="Edit" title="Edit"><Pencil size={14} /></button>
        )}
        {hasPermission('client-contact:write') && r.active && (
          <button onClick={() => { deactivateContact(r.id); showToast('success', 'Contact deactivated'); }} style={{ ...iconBtn, color: '#EF4444' }} aria-label="Deactivate" title="Deactivate"><UserX size={14} /></button>
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
          <EmptyState icon={UserSquare2} title="No contacts yet" description="Add a contact for this client to get started." />
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

function ContactDrawer({ clientId, contact, onClose, onSaved }: {
  clientId: string; contact: ClientContact | null;
  onClose: () => void; onSaved: (isNew: boolean) => void;
}) {
  const [salutation, setSalutation] = useState<ClientContact['salutation']>(contact?.salutation ?? 'Mr');
  const [name, setName] = useState(contact?.name ?? '');
  const [position, setPosition] = useState(contact?.position ?? '');
  const [email, setEmail] = useState(contact?.email ?? '');
  const [mobileNumber, setMobileNumber] = useState(contact?.mobileNumber ?? '');
  const [phoneNumber, setPhoneNumber] = useState(contact?.phoneNumber ?? '');
  const [active, setActive] = useState(contact?.active ?? true);
  const [isPrimary, setIsPrimary] = useState(contact?.primaryContact ?? false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!email.trim()) e.email = 'Email is required';
    else if (isContactEmailTaken(email.trim(), contact?.id)) e.email = 'This email is already used by another contact';
    if (Object.keys(e).length) { setErrors(e); return; }

    setSaving(true);
    setTimeout(() => {
      upsertContact(clientId, {
        salutation, name: name.trim(), position: position.trim(), email: email.trim(),
        mobileNumber: mobileNumber.trim(), phoneNumber: phoneNumber.trim(),
        active, primaryContact: isPrimary,
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Mobile Number</label>
          <input value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} placeholder="08xx..." style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Phone Number</label>
          <input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} style={inputStyle} />
        </div>
      </div>

      <Switch checked={active} onChange={setActive} label="Active" />

      <div style={{ paddingTop: 12, borderTop: '1px solid var(--color-border)' }}>
        <Switch checked={isPrimary} onChange={setIsPrimary} label="Primary contact" />
        <div style={{ ...helperStyle, marginTop: 6 }}>Turning this on will unset any other primary contact for this client.</div>
      </div>
    </FormDrawer>
  );
}
