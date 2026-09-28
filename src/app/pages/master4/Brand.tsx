import { Award } from 'lucide-react';
import { SimpleMasterPage } from './SimpleMasterPage';

export function BrandMaster() {
  return (
    <SimpleMasterPage
      core="core-4"
      collectionKey="brands"
      icon={Award}
      pageTitle="Brand"
      subtitle="Manage advertiser brands"
      fieldLabel="Name"
      maxLength={150}
    />
  );
}
