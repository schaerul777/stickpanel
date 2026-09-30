import { createBrowserRouter, Navigate, Outlet } from 'react-router';
import { MainLayout } from './layouts/MainLayout';
import { CoreProvider, getPersistedCore } from './core/CoreContext';
import { CORE_META } from './core/coreConfig';
import { RedeemTransactions } from './pages/RedeemTransactions';
import { Campaigns } from './pages/Campaigns';
import { Drivers } from './pages/Drivers';
import { Reports } from './pages/Reports';
import { Quotation } from './pages/Quotation';
import { Clients } from './pages/Clients';
import { GeolocationFilter } from './pages/GeolocationFilter';
import { Cities } from './pages/Cities';
import { CampaignReport } from './pages/CampaignReport';
import { InventoryDisplay } from './pages/InventoryDisplay';
import { CreateDisplay } from './pages/CreateDisplay';
import { Deal } from './pages/Deal';
import { Advertiser } from './pages/Advertiser';
import { Creatives } from './pages/Creatives';
import { CorePlaceholderPage } from './pages/CorePlaceholderPage';
import { CompanyList } from './pages/master4/CompanyList';
import { CompanyForm } from './pages/master4/CompanyForm';
import { ProductCategoryMaster } from './pages/master4/ProductCategory';
import { ProductList } from './pages/master4/ProductList';
import { ProductForm } from './pages/master4/ProductForm';
import { PriceMaster } from './pages/master4/Price';
import { PriceMatrix } from './pages/master4/PriceMatrix';
import { BrandMaster } from './pages/master4/Brand';
import { CityMaster } from './pages/master4/City';
import { QuotationTermMomentMaster } from './pages/master4/QuotationTermMoment';
import { QuotationTermDueMaster } from './pages/master4/QuotationTermDue';
import { IndustryMaster } from './pages/master4/Industry';
import { BankMaster } from './pages/master4/Bank';
import { ClientProfileList } from './pages/master4/clientProfile/ClientProfileList';
import { ClientProfileForm } from './pages/master4/clientProfile/ClientProfileForm';
import { ClientProfileDetail } from './pages/master4/clientProfile/ClientProfileDetail';

function RootLayout() {
  return (
    <CoreProvider>
      <Outlet />
    </CoreProvider>
  );
}

function RootRedirect() {
  const core = getPersistedCore();
  return <Navigate to={CORE_META[core].defaultPath} replace />;
}

export const router = createBrowserRouter([
  {
    Component: RootLayout,
    children: [
      { index: true, Component: RootRedirect },
      {
        path: 'core-2',
        Component: MainLayout,
        children: [
          { index: true,        Component: RedeemTransactions },
          { path: 'campaigns',  Component: Campaigns          },
          { path: 'drivers',    Component: Drivers            },
          { path: 'reports',    Component: Reports            },
          { path: 'quotation',  Component: Quotation          },
          { path: 'clients',    Component: Clients            },
          { path: 'master',     element: <CorePlaceholderPage core="core-2" section="Master"  /> },
          { path: 'account',    element: <CorePlaceholderPage core="core-2" section="Account" /> },
          { path: '*',          element: <Navigate to={CORE_META['core-2'].defaultPath} replace /> },
        ],
      },
      {
        path: 'core-3',
        Component: MainLayout,
        children: [
          { index: true,                          element: <Navigate to={CORE_META['core-3'].defaultPath} replace /> },
          { path: 'master/geolocation-filter',    Component: GeolocationFilter },
          { path: 'master/cities',                Component: Cities             },
          { path: 'inventory/display',            Component: InventoryDisplay   },
          { path: 'inventory/display/new',        Component: CreateDisplay      },
          { path: 'qc/campaign-report',           Component: CampaignReport     },
          { path: 'deal-testing/deal',            Component: Deal               },
          { path: 'deal-testing/dsp/advertiser',  Component: Advertiser         },
          { path: 'deal-testing/creatives',       Component: Creatives          },
          { path: 'account',                      element: <CorePlaceholderPage core="core-3" section="Account" /> },
          { path: '*',                            element: <Navigate to={CORE_META['core-3'].defaultPath} replace /> },
        ],
      },
      {
        path: 'core-4',
        Component: MainLayout,
        children: [
          { index: true,                              element: <Navigate to={CORE_META['core-4'].defaultPath} replace /> },
          { path: 'master/company',                   Component: CompanyList              },
          { path: 'master/company/new',                Component: CompanyForm             },
          { path: 'master/company/:id/edit',           Component: CompanyForm             },
          { path: 'master/product-category',           Component: ProductCategoryMaster   },
          { path: 'master/product',                    Component: ProductList             },
          { path: 'master/product/new',                Component: ProductForm             },
          { path: 'master/product/:id/edit',            Component: ProductForm            },
          { path: 'master/industry',                   Component: IndustryMaster          },
          { path: 'master/bank',                       Component: BankMaster              },
          { path: 'master/client-profile',             Component: ClientProfileList       },
          { path: 'master/client-profile/new',         Component: ClientProfileForm       },
          { path: 'master/client-profile/:id',         Component: ClientProfileDetail     },
          { path: 'master/client-profile/:id/edit',    Component: ClientProfileForm       },
          { path: 'master/price',                      Component: PriceMaster             },
          { path: 'master/price-matrix',                Component: PriceMatrix            },
          { path: 'master/brand',                      Component: BrandMaster             },
          { path: 'master/city',                       Component: CityMaster              },
          { path: 'master/quotation-term-moment',       Component: QuotationTermMomentMaster },
          { path: 'master/quotation-term-due',          Component: QuotationTermDueMaster  },
          { path: 'account', element: <CorePlaceholderPage core="core-4" section="Account" /> },
          { path: '*',       element: <Navigate to={CORE_META['core-4'].defaultPath} replace /> },
        ],
      },
      { path: '*', Component: RootRedirect },
    ],
  },
]);
