import { CalendarClock } from 'lucide-react';
import { SimpleMasterPage } from './SimpleMasterPage';

export function QuotationTermDueMaster() {
  return (
    <SimpleMasterPage
      core="core-4"
      collectionKey="termDues"
      icon={CalendarClock}
      pageTitle="Quotation Term Due"
      subtitle="Payment due periods shown in quotations"
      fieldLabel="Text"
      maxLength={200}
    />
  );
}
