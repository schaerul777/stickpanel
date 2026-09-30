import { useState } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, ShieldAlert, Landmark } from 'lucide-react';
import { MasterTable, type MasterColumn } from '../../../../components/master/MasterTable';
import { FormDrawer } from '../../../../components/master/FormDrawer';
import { ConfirmDialog } from '../../../../components/master/ConfirmDialog';
import { EmptyState } from '../../../../components/EmptyState';
import { inputStyle, selectStyle, labelStyle, errorTextStyle, primaryButtonStyle } from '../../../../components/master/styles';
import { hasPermission } from '../../../../core/clientProfileUI';
import {
  useClientProfileData, getBankAccountsForClient, upsertBankAccount, deleteBankAccount,
  type ClientRecord, type ClientBankAccount, type BankAccountFormInput,
} from '../../../../core/clientProfileStore';
import { useMasterData } from '../../../../core/masterStore';
import type { ToastType } from '../../../../components/Toast';

interface TabProps {
  client: ClientRecord;
  showToast: (type: ToastType, title: string, message?: string) => void;
}

const iconBtn = {
  padding: 7, borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-card)', cursor: 'pointer', display: 'inline-flex',
} as const;

function mask(accountNumber: string): string {
  const last4 = accountNumber.slice(-4);
  return `•••• ${last4}`;
}

export function BankAccountsTab({ client, showToast }: TabProps) {
  useClientProfileData();
  const masterData = useMasterData();
  const accounts = getBankAccountsForClient(client.id);
  const [drawerRecord, setDrawerRecord] = useState<ClientBankAccount | null | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<ClientBankAccount | null>(null);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  if (!hasPermission('client-bank-account:read')) {
    return (
      <div style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
        <EmptyState icon={ShieldAlert} title="No access" description="You don't have access to Bank Accounts." />
      </div>
    );
  }

  const bankName = (id: string) => masterData.banks.find(b => b.id === id)?.name ?? '—';

  const columns: MasterColumn<ClientBankAccount>[] = [
    { key: 'bank', label: 'Bank', render: r => bankName(r.bankId) },
    { key: 'holder', label: 'Account Holder', render: r => r.accountHolder },
    { key: 'number', label: 'Account Number', render: r => (
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'monospace' }}>
        {revealed.has(r.id) ? r.accountNumber : mask(r.accountNumber)}
        <button
          onClick={() => setRevealed(s => { const n = new Set(s); n.has(r.id) ? n.delete(r.id) : n.add(r.id); return n; })}
          style={{ ...iconBtn, padding: 4 }} aria-label={revealed.has(r.id) ? 'Hide' : 'Reveal'}
        >
          {revealed.has(r.id) ? <EyeOff size={12} /> : <Eye size={12} />}
        </button>
      </span>
    ) },
    { key: 'branch', label: 'Branch', render: r => r.branch || '—' },
    { key: 'actions', label: 'Actions', render: r => (
      <div style={{ display: 'flex', gap: 6 }}>
        {hasPermission('client-bank-account:write') && <button onClick={() => setDrawerRecord(r)} style={iconBtn} aria-label="Edit"><Pencil size={14} /></button>}
        {hasPermission('client-bank-account:write') && <button onClick={() => setDeleteTarget(r)} style={{ ...iconBtn, color: '#EF4444' }} aria-label="Delete"><Trash2 size={14} /></button>}
      </div>
    ) },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        {hasPermission('client-bank-account:write') && (
          <button style={primaryButtonStyle} onClick={() => setDrawerRecord(null)}><Plus size={15} /> Add Bank Account</button>
        )}
      </div>

      {accounts.length === 0 ? (
        <div style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
          <EmptyState icon={Landmark} title="No bank accounts yet" description="Add a bank account for this client." />
        </div>
      ) : (
        <MasterTable columns={columns} rows={accounts} getRowId={r => r.id} page={1} pageSize={accounts.length} total={accounts.length} onPageChange={() => {}} />
      )}

      {drawerRecord !== undefined && (
        <BankAccountDrawer
          clientId={client.id}
          record={drawerRecord}
          onClose={() => setDrawerRecord(undefined)}
          onSaved={isNew => { setDrawerRecord(undefined); showToast('success', isNew ? 'Bank account added' : 'Bank account updated'); }}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Bank Account?"
          message={`Are you sure you want to delete this bank account for "${deleteTarget.accountHolder}"?`}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => { deleteBankAccount(deleteTarget.id); showToast('success', 'Deleted'); setDeleteTarget(null); }}
        />
      )}
    </div>
  );
}

function BankAccountDrawer({ clientId, record, onClose, onSaved }: {
  clientId: string; record: ClientBankAccount | null; onClose: () => void; onSaved: (isNew: boolean) => void;
}) {
  const masterData = useMasterData();
  const [bankId, setBankId] = useState(record?.bankId ?? masterData.banks[0]?.id ?? '');
  const [accountHolder, setAccountHolder] = useState(record?.accountHolder ?? '');
  const [accountNumber, setAccountNumber] = useState(record?.accountNumber ?? '');
  const [branch, setBranch] = useState(record?.branch ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    const e: Record<string, string> = {};
    if (!bankId) e.bankId = 'Bank is required';
    if (!accountHolder.trim()) e.accountHolder = 'Account holder is required';
    if (!accountNumber.trim()) e.accountNumber = 'Account number is required';
    else if (!/^\d+$/.test(accountNumber.trim())) e.accountNumber = 'Account number must be numeric';
    if (Object.keys(e).length) { setErrors(e); return; }

    const data: BankAccountFormInput = { bankId, accountHolder: accountHolder.trim(), accountNumber: accountNumber.trim(), branch: branch.trim() };
    setSaving(true);
    setTimeout(() => { upsertBankAccount(clientId, data, record?.id); setSaving(false); onSaved(!record); }, 300);
  };

  return (
    <FormDrawer title={record ? 'Edit Bank Account' : 'Add Bank Account'} onClose={onClose} onSave={handleSave} saving={saving}>
      <div>
        <label style={labelStyle}>Bank <span style={{ color: '#EF4444' }}>*</span></label>
        <select value={bankId} onChange={e => setBankId(e.target.value)} style={{ ...selectStyle, borderColor: errors.bankId ? '#EF4444' : 'var(--color-border)' }}>
          {masterData.banks.filter(b => !b.deletedAt).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        {errors.bankId && <div style={errorTextStyle}>{errors.bankId}</div>}
      </div>
      <div>
        <label style={labelStyle}>Account Holder <span style={{ color: '#EF4444' }}>*</span></label>
        <input value={accountHolder} onChange={e => { setAccountHolder(e.target.value); if (errors.accountHolder) setErrors(x => ({ ...x, accountHolder: '' })); }} style={{ ...inputStyle, borderColor: errors.accountHolder ? '#EF4444' : 'var(--color-border)' }} />
        {errors.accountHolder && <div style={errorTextStyle}>{errors.accountHolder}</div>}
      </div>
      <div>
        <label style={labelStyle}>Account Number <span style={{ color: '#EF4444' }}>*</span></label>
        <input value={accountNumber} onChange={e => { setAccountNumber(e.target.value); if (errors.accountNumber) setErrors(x => ({ ...x, accountNumber: '' })); }} style={{ ...inputStyle, borderColor: errors.accountNumber ? '#EF4444' : 'var(--color-border)' }} />
        {errors.accountNumber && <div style={errorTextStyle}>{errors.accountNumber}</div>}
      </div>
      <div>
        <label style={labelStyle}>Branch</label>
        <input value={branch} onChange={e => setBranch(e.target.value)} style={inputStyle} />
      </div>
    </FormDrawer>
  );
}
