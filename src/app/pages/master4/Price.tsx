import { Tag } from 'lucide-react';
import { SimpleMasterPage } from './SimpleMasterPage';
import { countProductsUsingPriceTier } from '../../core/masterStore';

export function PriceMaster() {
  return (
    <SimpleMasterPage
      core="core-4"
      collectionKey="priceTiers"
      icon={Tag}
      pageTitle="Price"
      subtitle="Price tiers applied to products"
      fieldLabel="Name"
      maxLength={100}
      extraColumn={{
        label: 'Products using it',
        render: r => <span>{countProductsUsingPriceTier(r.id)}</span>,
      }}
      getBlockReason={r => {
        const n = countProductsUsingPriceTier(r.id);
        return n > 0 ? `Can't delete: used by ${n} product${n === 1 ? '' : 's'}.` : undefined;
      }}
    />
  );
}
