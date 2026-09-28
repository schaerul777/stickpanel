import { MapPin } from 'lucide-react';
import { SimpleMasterPage } from './SimpleMasterPage';

export function CityMaster() {
  return (
    <SimpleMasterPage
      core="core-4"
      collectionKey="cities"
      icon={MapPin}
      pageTitle="City"
      subtitle="Manage cities used across the platform"
      fieldLabel="Name"
      maxLength={100}
    />
  );
}
