import { Landmark } from 'lucide-react';
import { SimpleMasterPage } from './SimpleMasterPage';
import { countBankAccountsUsingBank } from '../../core/clientProfileStore';

export function BankMaster() {
  return (
    <SimpleMasterPage
      core="core-4"
      collectionKey="banks"
      icon={Landmark}
      pageTitle="Bank"
      subtitle="Manage banks used for client bank accounts"
      fieldLabel="Name"
      maxLength={150}
      getBlockReason={row => {
        const n = countBankAccountsUsingBank(row.id);
        return n > 0 ? `Can't delete: used by ${n} bank account${n === 1 ? '' : 's'}.` : undefined;
      }}
    />
  );
}
