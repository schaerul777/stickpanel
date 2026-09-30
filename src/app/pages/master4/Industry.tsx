import { Factory } from 'lucide-react';
import { SimpleMasterPage } from './SimpleMasterPage';
import { countClientsUsingIndustry } from '../../core/clientProfileStore';

export function IndustryMaster() {
  return (
    <SimpleMasterPage
      core="core-4"
      collectionKey="industries"
      icon={Factory}
      pageTitle="Industry"
      subtitle="Manage client industries"
      fieldLabel="Name"
      maxLength={100}
      getBlockReason={row => {
        const n = countClientsUsingIndustry(row.id);
        return n > 0 ? `Can't delete: used by ${n} client${n === 1 ? '' : 's'}.` : undefined;
      }}
    />
  );
}
