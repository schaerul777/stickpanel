import {
  LayoutGrid, DollarSign, Database, ShieldCheck,
  Boxes, ClipboardCheck, FlaskConical, Handshake, Server,
  MapPin, Building2, MonitorPlay, BarChart2, Image as ImageIcon,
  Package, Tag, Grid3x3, Award, Clock, CalendarClock,
  Factory, Landmark, Contact,
} from 'lucide-react';

export type CoreId = 'core-2' | 'core-3' | 'core-4';

export const CORE_IDS: readonly CoreId[] = ['core-2', 'core-3', 'core-4'];

export interface SubItem {
  name: string;
  path?: string;
  icon?: any;
  disabled?: boolean;
  children?: SubItem[];
}

export interface MenuItem {
  name: string;
  icon: any;
  path?: string;
  subItems?: SubItem[];
}

export interface CoreMeta {
  id: CoreId;
  label: string;
  /** Short, easy-to-edit placeholder description shown in the switcher popover. */
  description: string;
  /** Landing page a user lands on right after selecting this core. */
  defaultPath: string;
}

export const CORE_META: Record<CoreId, CoreMeta> = {
  'core-2': {
    id: 'core-2',
    label: 'CORE 2',
    description: 'Operations & sales workspace',
    defaultPath: '/core-2',
  },
  'core-3': {
    id: 'core-3',
    label: 'CORE 3',
    description: 'Inventory, QC & deal testing workspace',
    defaultPath: '/core-3/inventory/display',
  },
  'core-4': {
    id: 'core-4',
    label: 'CORE 4',
    description: 'Master data workspace',
    defaultPath: '/core-4/master/company',
  },
};

// ─── Per-core menus — single source of truth for the sidebar ──────────────────
// CORE 2, CORE 3 and CORE 4 each get their own separate Master/Account entries;
// add new core-specific menus here to extend a core without touching the others.

export const coreMenus: Record<CoreId, MenuItem[]> = {
  'core-2': [
    {
      name: 'Operations',
      icon: LayoutGrid,
      subItems: [
        { name: 'Campaigns',           path: '/core-2/campaigns' },
        { name: 'Drivers',             path: '/core-2/drivers'   },
        { name: 'Redeem Transactions', path: '/core-2'           },
        { name: 'Reports',             path: '/core-2/reports'   },
      ],
    },
    {
      name: 'Sales',
      icon: DollarSign,
      subItems: [
        { name: 'Quotation', path: '/core-2/quotation' },
        { name: 'Clients',   path: '/core-2/clients'   },
      ],
    },
    {
      name: 'Master',
      icon: Database,
      subItems: [
        { name: 'Master', path: '/core-2/master' },
      ],
    },
    {
      name: 'Account',
      icon: ShieldCheck,
      subItems: [
        { name: 'Account', path: '/core-2/account' },
      ],
    },
  ],

  'core-3': [
    {
      name: 'Master',
      icon: Database,
      subItems: [
        { name: 'Geolocation Filter', path: '/core-3/master/geolocation-filter', icon: MapPin    },
        { name: 'Cities',             path: '/core-3/master/cities',             icon: Building2 },
      ],
    },
    {
      name: 'Inventory',
      icon: Boxes,
      subItems: [
        { name: 'Display', path: '/core-3/inventory/display', icon: MonitorPlay },
      ],
    },
    {
      name: 'QC',
      icon: ClipboardCheck,
      subItems: [
        { name: 'Campaign Report', path: '/core-3/qc/campaign-report', icon: BarChart2 },
      ],
    },
    {
      name: 'Deal Testing',
      icon: FlaskConical,
      subItems: [
        { name: 'Deal', path: '/core-3/deal-testing/deal', icon: Handshake },
        {
          name: 'DSP',
          icon: Server,
          children: [
            { name: 'Advertiser', path: '/core-3/deal-testing/dsp/advertiser', icon: Building2 },
          ],
        },
        { name: 'Creatives', path: '/core-3/deal-testing/creatives', icon: ImageIcon },
      ],
    },
    {
      name: 'Account',
      icon: ShieldCheck,
      subItems: [
        { name: 'Account', path: '/core-3/account' },
      ],
    },
  ],

  'core-4': [
    {
      name: 'Master',
      icon: Database,
      subItems: [
        { name: 'Company',                 path: '/core-4/master/company',                 icon: Building2     },
        { name: 'Product Category',        path: '/core-4/master/product-category',        icon: Boxes         },
        { name: 'Product',                 path: '/core-4/master/product',                 icon: Package       },
        { name: 'Industry',                path: '/core-4/master/industry',                icon: Factory       },
        { name: 'Bank',                    path: '/core-4/master/bank',                    icon: Landmark      },
        { name: 'Client Profile',          path: '/core-4/master/client-profile',          icon: Contact       },
        { name: 'Price',                   path: '/core-4/master/price',                   icon: Tag           },
        { name: 'Price Matrix',            path: '/core-4/master/price-matrix',            icon: Grid3x3       },
        { name: 'Brand',                   path: '/core-4/master/brand',                   icon: Award         },
        { name: 'City',                    path: '/core-4/master/city',                    icon: MapPin        },
        { name: 'Quotation Term Moment',   path: '/core-4/master/quotation-term-moment',   icon: Clock         },
        { name: 'Quotation Term Due',      path: '/core-4/master/quotation-term-due',      icon: CalendarClock },
      ],
    },
    {
      name: 'Account',
      icon: ShieldCheck,
      subItems: [
        { name: 'Account', path: '/core-4/account' },
      ],
    },
  ],
};

// ─── Breadcrumb trail lookup ────────────────────────────────────────────────

function findTrail(items: SubItem[], pathname: string): string[] | null {
  for (const item of items) {
    if (item.path && item.path === pathname) return [item.name];
    if (item.children) {
      const sub = findTrail(item.children, pathname);
      if (sub) return [item.name, ...sub];
    }
  }
  return null;
}

/** Returns e.g. ['Operations', 'Redeem Transactions'] for the given pathname, or [] if unmatched. */
export function getBreadcrumbTrail(groups: MenuItem[], pathname: string): string[] {
  for (const group of groups) {
    if (group.path && group.path === pathname) return [group.name];
    if (group.subItems) {
      const trail = findTrail(group.subItems, pathname);
      if (trail) return [group.name, ...trail];
    }
  }
  return [];
}
