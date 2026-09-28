import { Clock } from 'lucide-react';
import { SimpleMasterPage } from './SimpleMasterPage';

export function QuotationTermMomentMaster() {
  return (
    <SimpleMasterPage
      core="core-4"
      collectionKey="termMoments"
      icon={Clock}
      pageTitle="Quotation Term Moment"
      subtitle="Options for when payment is due, shown in quotations"
      fieldLabel="Text"
      maxLength={200}
    />
  );
}
