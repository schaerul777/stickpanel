import { createBrowserRouter } from 'react-router';
import { MainLayout } from './layouts/MainLayout';
import { RedeemTransactions } from './pages/RedeemTransactions';
import { Campaigns } from './pages/Campaigns';
import { Drivers } from './pages/Drivers';
import { Reports } from './pages/Reports';
import { Quotation } from './pages/Quotation';
import { Clients } from './pages/Clients';
import { Users } from './pages/Users';
import { GeolocationFilter } from './pages/GeolocationFilter';
import { Cities } from './pages/Cities';
import { CampaignReport } from './pages/CampaignReport';
import { InventoryDisplay } from './pages/InventoryDisplay';
import { CreateDisplay } from './pages/CreateDisplay';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: MainLayout,
    children: [
      { index: true,                          Component: RedeemTransactions },
      { path: 'campaigns',                    Component: Campaigns          },
      { path: 'drivers',                      Component: Drivers            },
      { path: 'reports',                      Component: Reports            },
      { path: 'quotation',                    Component: Quotation          },
      { path: 'clients',                      Component: Clients            },
      { path: 'users',                        Component: Users              },
      { path: 'master/geolocation-filter',    Component: GeolocationFilter  },
      { path: 'master/cities',                Component: Cities             },
      { path: 'inventory/display',            Component: InventoryDisplay   },
      { path: 'inventory/display/new',        Component: CreateDisplay      },
      { path: 'qc/campaign-report',           Component: CampaignReport     },
    ],
  },
]);