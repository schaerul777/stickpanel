import { useState, useEffect } from 'react';
import { Plus, Download } from 'lucide-react';
import { DriversTable, type Driver } from '../components/DriversTable';
import { DriverDetailDrawer } from '../components/DriverDetailDrawer';
import { BulkActionsModal } from '../components/BulkActionsModal';
import { AddEditDriverModal } from '../components/AddEditDriverModal';
import { DocumentVerificationModal } from '../components/DocumentVerificationModal';
import { useToast, ToastContainer } from '../components/Toast';

// ── Mock Data ────────────────────────────────────────────────────────────────

const mockDrivers: Driver[] = [
  {
    id: 'DRV-10001',
    name: 'Budi Santoso',
    email: 'budi.santoso@gmail.com',
    mobile: '0812-3456-7890',
    whatsappVerified: true,
    channel: 'GTI',
    city: 'Jakarta',
    status: 'active',
    nationalId: '3201010101850001',
    driverLicense: 'A1234567890',
    profileCompletion: 95,
    bankAccountName: 'Budi Santoso',
    bankAccountNumber: '1234567890',
    accountRelation: 'Self',
    vehicleType: 'Toyota Calya',
    plateNumber: 'B 1234 XYZ',
    vehicleOwner: 'budi.santoso@gmail.com',
    vehicleColor: 'White',
    manufacturedYear: 2021,
    odometerSticker: 'ODO-A3F8K2M9',
    licenseNumberType: 'Black',
    stnkImage: true,
    vehicles: [
      { id: 'VEH-001-1', vehicleType: 'Toyota Calya', plateNumber: 'B 1234 XYZ', vehicleOwner: 'budi.santoso@gmail.com', vehicleColor: 'White', manufacturedYear: 2021, odometerSticker: 'ODO-A3F8K2M9', licenseNumberType: 'Black', stnkImage: true, isActive: true },
      { id: 'VEH-001-2', vehicleType: 'Toyota Agya', plateNumber: 'B 5588 ZZ', vehicleOwner: 'budi.santoso@gmail.com', vehicleColor: 'Gray', manufacturedYear: 2018, odometerSticker: 'ODO-X9B2T7R4', licenseNumberType: 'Black', stnkImage: true, isActive: false },
    ],
    totalPoints: 15420,
    lastCampaign: { name: 'Gojek Ramadan Q1', date: 'Jan 15, 2025' },
    community: 'Komunitas Jakarta Selatan',
    driverType: 'Normal',
    isVIP: true,
    religion: 'Islam',
    birthDate: '1985-03-15',
    domicile: 'Kebayoran Baru',
  },
  {
    id: 'DRV-10002',
    name: 'Dewi Kusuma',
    email: 'dewi.kusuma@email.co.id',
    mobile: '0856-1234-5678',
    whatsappVerified: true,
    channel: 'TPI',
    city: 'Bandung',
    status: 'active',
    nationalId: '3273025504920002',
    driverLicense: 'B9876543210',
    profileCompletion: 87,
    bankAccountName: 'Dewi Kusuma',
    bankAccountNumber: '2345678901',
    accountRelation: 'Self',
    vehicleType: 'Honda Brio',
    plateNumber: 'D 5678 ABC',
    vehicleOwner: 'dewi.kusuma@email.co.id',
    vehicleColor: 'Silver',
    manufacturedYear: 2019,
    odometerSticker: 'ODO-B4G9L3N0',
    licenseNumberType: 'Black',
    stnkImage: true,
    totalPoints: 12350,
    lastCampaign: { name: 'Tokopedia Summer', date: 'Feb 3, 2025' },
    community: 'Bandung Raya Drivers',
    driverType: 'Normal',
    isVIP: false,
    religion: 'Islam',
    birthDate: '1992-04-25',
    domicile: 'Buah Batu',
  },
  {
    id: 'DRV-10003',
    name: 'Agus Prasetyo',
    email: 'agus.prasetyo@gmail.com',
    mobile: '0821-9876-5432',
    whatsappVerified: false,
    channel: 'GTI',
    city: 'Surabaya',
    status: 'suspended',
    nationalId: '3578010309880003',
    driverLicense: 'C1928374650',
    profileCompletion: 72,
    bankAccountName: 'Agus Prasetyo',
    bankAccountNumber: '3456789012',
    accountRelation: 'Self',
    vehicleType: 'Toyota Agya',
    plateNumber: 'L 9012 DEF',
    vehicleOwner: 'agus.prasetyo@gmail.com',
    vehicleColor: 'Red',
    manufacturedYear: 2018,
    odometerSticker: 'ODO-C5H0M4P1',
    licenseNumberType: 'Black',
    stnkImage: false,
    totalPoints: 8920,
    lastCampaign: { name: 'Shopee 9.9 Campaign', date: 'Sep 9, 2024' },
    community: 'Surabaya Barat',
    driverType: 'Normal',
    isVIP: false,
    religion: 'Islam',
    birthDate: '1988-09-03',
    domicile: 'Wonokromo',
    suspendedReason: 'Repeated complaints from passengers about unsafe driving behavior.',
  },
  {
    id: 'DRV-10004',
    name: 'Siti Nurhaliza',
    email: 'siti.nurhaliza@yahoo.com',
    mobile: '0813-2468-1357',
    whatsappVerified: true,
    channel: 'NON GRAB',
    city: 'Jakarta',
    status: 'active',
    nationalId: '3171034504910004',
    driverLicense: 'D2837465019',
    profileCompletion: 65,
    bankAccountName: 'Siti Nurhaliza',
    bankAccountNumber: '4567890123',
    accountRelation: 'Self',
    vehicleType: 'Daihatsu Ayla',
    plateNumber: 'B 3456 GHI',
    vehicleOwner: 'siti.nurhaliza@yahoo.com',
    vehicleColor: 'Black',
    manufacturedYear: 2020,
    odometerSticker: 'ODO-D6J1N5Q2',
    licenseNumberType: 'Yellow',
    stnkImage: true,
    totalPoints: 6540,
    community: 'Komunitas Tangerang',
    driverType: 'Replacement',
    isVIP: false,
    religion: 'Islam',
    birthDate: '1991-04-05',
    domicile: 'Kebon Jeruk',
  },
  {
    id: 'DRV-10005',
    name: 'Rudi Hartono',
    email: 'rudi.hartono@outlook.com',
    mobile: '0878-5432-1098',
    whatsappVerified: false,
    channel: 'TPI',
    city: 'Semarang',
    status: 'blacklisted',
    nationalId: '3374010512870005',
    driverLicense: 'E3746501928',
    profileCompletion: 45,
    bankAccountName: 'Rudi Hartono',
    bankAccountNumber: '5678901234',
    accountRelation: 'Self',
    vehicleType: 'Suzuki Ertiga',
    plateNumber: 'H 7890 JKL',
    vehicleOwner: 'rudi.hartono@outlook.com',
    vehicleColor: 'Blue',
    manufacturedYear: 2017,
    odometerSticker: 'ODO-E7K2P6R3',
    licenseNumberType: 'Black',
    stnkImage: false,
    totalPoints: 3210,
    lastCampaign: { name: 'Bukalapak Deals', date: 'Jul 20, 2024' },
    driverType: 'Normal',
    isVIP: false,
    religion: 'Kristen',
    birthDate: '1987-12-05',
    domicile: 'Banyumanik',
    blacklistReason: 'Fraud — submitted falsified trip data across multiple campaigns for points manipulation.',
  },
  {
    id: 'DRV-10006',
    name: 'Ahmad Yani',
    email: 'ahmad.yani@gmail.com',
    mobile: '0819-7654-3210',
    whatsappVerified: true,
    channel: 'GTI',
    city: 'Jakarta',
    status: 'active',
    nationalId: '3175020108820006',
    driverLicense: 'F4657382910',
    profileCompletion: 92,
    bankAccountName: 'Ahmad Yani',
    bankAccountNumber: '6789012345',
    accountRelation: 'Self',
    vehicleType: 'Toyota Calya',
    plateNumber: 'B 2345 MNO',
    vehicleOwner: 'ahmad.yani@gmail.com',
    vehicleColor: 'Gray',
    manufacturedYear: 2022,
    odometerSticker: 'ODO-F8L3Q7S4',
    licenseNumberType: 'Black',
    stnkImage: true,
    vehicles: [
      { id: 'VEH-006-1', vehicleType: 'Toyota Calya', plateNumber: 'B 2345 MNO', vehicleOwner: 'ahmad.yani@gmail.com', vehicleColor: 'Gray', manufacturedYear: 2022, odometerSticker: 'ODO-F8L3Q7S4', licenseNumberType: 'Black', stnkImage: true, isActive: true },
      { id: 'VEH-006-2', vehicleType: 'Honda Brio', plateNumber: 'B 8877 RR', vehicleOwner: 'ahmad.yani@gmail.com', vehicleColor: 'Silver', manufacturedYear: 2019, odometerSticker: 'ODO-P2C7K1H5', licenseNumberType: 'Black', stnkImage: false, isActive: false },
    ],
    totalPoints: 18750,
    lastCampaign: { name: 'Grab Eid Campaign', date: 'Mar 29, 2025' },
    community: 'Jakarta Timur',
    driverType: 'Normal',
    isVIP: true,
    religion: 'Islam',
    birthDate: '1982-08-01',
    domicile: 'Cakung',
  },
  {
    id: 'DRV-10007',
    name: 'Linda Wijaya',
    email: 'linda.wijaya@gmail.com',
    mobile: '0852-1357-2468',
    whatsappVerified: true,
    channel: 'TPI',
    city: 'Bandung',
    status: 'active',
    nationalId: '3273025101930007',
    driverLicense: 'G5768493021',
    profileCompletion: 38,
    bankAccountName: 'Hendrawan Wijaya',
    bankAccountNumber: '7890123456',
    accountRelation: 'Wife/Husband',
    vehicleType: 'Honda Brio',
    plateNumber: 'D 6789 PQR',
    vehicleOwner: 'linda.wijaya@gmail.com',
    vehicleColor: 'Silver',
    manufacturedYear: 2019,
    odometerSticker: 'ODO-G9M4R8T5',
    licenseNumberType: 'Black',
    stnkImage: true,
    totalPoints: 2850,
    driverType: 'Normal',
    isVIP: false,
    religion: 'Kristen',
    birthDate: '1993-01-21',
    domicile: 'Cimahi',
  },
  {
    id: 'DRV-10008',
    name: 'Yusuf Rahman',
    email: 'yusuf.rahman@email.co.id',
    mobile: '0823-8642-9753',
    whatsappVerified: true,
    channel: 'GTI',
    city: 'Medan',
    status: 'suspended',
    nationalId: '1271010408900008',
    driverLicense: 'H6879504132',
    profileCompletion: 55,
    bankAccountName: 'Yusuf Rahman',
    bankAccountNumber: '8901234567',
    accountRelation: 'Self',
    vehicleType: 'Toyota Agya',
    plateNumber: 'BK 8901 STU',
    vehicleOwner: 'yusuf.rahman@email.co.id',
    vehicleColor: 'Blue',
    manufacturedYear: 2016,
    odometerSticker: 'ODO-H0N5S9U6',
    licenseNumberType: 'Yellow',
    stnkImage: false,
    totalPoints: 4620,
    lastCampaign: { name: 'Tokopedia Flash Sale', date: 'Nov 11, 2024' },
    community: 'Komunitas Medan Kota',
    driverType: 'Vendor',
    isVIP: false,
    religion: 'Islam',
    birthDate: '1990-08-04',
    domicile: 'Medan Amplas',
    suspendedReason: 'Account under review due to disputed transaction records from Q4 2024.',
  },
  {
    id: 'DRV-10009',
    name: 'Fitri Handayani',
    email: 'fitri.handayani@gmail.com',
    mobile: '0824-8901-2345',
    whatsappVerified: true,
    channel: 'NON GRAB',
    city: 'Jakarta',
    status: 'active',
    nationalId: '3171034507870009',
    driverLicense: 'I7980615243',
    profileCompletion: 88,
    bankAccountName: 'Fitri Handayani',
    bankAccountNumber: '9012345678',
    accountRelation: 'Self',
    vehicleType: 'Toyota Calya',
    plateNumber: 'B 4567 VWX',
    vehicleOwner: 'fitri.handayani@gmail.com',
    vehicleColor: 'White',
    manufacturedYear: 2021,
    odometerSticker: 'ODO-J1P6T0V7',
    licenseNumberType: 'Black',
    stnkImage: true,
    vehicles: [
      { id: 'VEH-009-1', vehicleType: 'Toyota Calya', plateNumber: 'B 4567 VWX', vehicleOwner: 'fitri.handayani@gmail.com', vehicleColor: 'White', manufacturedYear: 2021, odometerSticker: 'ODO-J1P6T0V7', licenseNumberType: 'Black', stnkImage: true, isActive: true },
      { id: 'VEH-009-2', vehicleType: 'Daihatsu Ayla', plateNumber: 'B 3391 FH', vehicleOwner: 'fitri.handayani@gmail.com', vehicleColor: 'Silver', manufacturedYear: 2017, odometerSticker: 'ODO-K5M8N2Q1', licenseNumberType: 'Black', stnkImage: true, isActive: false },
      { id: 'VEH-009-3', vehicleType: 'Honda Brio', plateNumber: 'F 1122 AB', vehicleOwner: 'budi.santoso@gmail.com', vehicleColor: 'Red', manufacturedYear: 2020, odometerSticker: 'ODO-R4T9V3W7', licenseNumberType: 'Black', stnkImage: false, isActive: false },
    ],
    totalPoints: 11200,
    lastCampaign: { name: 'Lazada 12.12 Mega', date: 'Dec 12, 2024' },
    community: 'Jakarta Pusat',
    driverType: 'Normal',
    isVIP: true,
    religion: 'Islam',
    birthDate: '1987-07-05',
    domicile: 'Menteng',
  },
  {
    id: 'DRV-10010',
    name: 'Gunawan Tan',
    email: 'gunawan.tan@email.co.id',
    mobile: '0825-9012-3456',
    whatsappVerified: false,
    channel: 'GTI',
    city: 'Surabaya',
    status: 'active',
    nationalId: '3578010601900010',
    driverLicense: 'J8091726354',
    profileCompletion: 78,
    bankAccountName: 'Gunawan Tan',
    bankAccountNumber: '0123456789',
    accountRelation: 'Self',
    vehicleType: 'Honda Brio',
    plateNumber: 'L 5678 YZA',
    vehicleOwner: 'gunawan.tan@email.co.id',
    vehicleColor: 'Black',
    manufacturedYear: 2020,
    odometerSticker: 'ODO-K2Q7U1W8',
    licenseNumberType: 'Black',
    stnkImage: true,
    totalPoints: 7890,
    lastCampaign: { name: 'Shopee Year-End', date: 'Dec 31, 2024' },
    community: 'Surabaya Timur',
    driverType: 'Normal',
    isVIP: false,
    religion: 'Buddha',
    birthDate: '1990-06-01',
    domicile: 'Gubeng',
  },
  {
    id: 'DRV-10011',
    name: 'Hendra Kusuma',
    email: 'hendra.kusuma@yahoo.com',
    mobile: '0815-3210-9876',
    whatsappVerified: true,
    channel: 'TPI',
    city: 'Yogyakarta',
    status: 'inactive',
    nationalId: '3404010107800011',
    driverLicense: 'K9102837465',
    profileCompletion: 30,
    bankAccountName: 'Sri Murni Kusuma',
    bankAccountNumber: '1122334455',
    accountRelation: 'Parents',
    vehicleType: 'Daihatsu Sigra',
    plateNumber: 'AB 1234 CD',
    vehicleOwner: 'hendra.kusuma@yahoo.com',
    vehicleColor: 'Brown',
    manufacturedYear: 2015,
    odometerSticker: 'ODO-L3R8V2X9',
    licenseNumberType: 'Yellow',
    stnkImage: false,
    totalPoints: 1650,
    driverType: 'Normal',
    isVIP: false,
    religion: 'Islam',
    birthDate: '1980-07-01',
    domicile: 'Sleman',
  },
  {
    id: 'DRV-10012',
    name: 'Rika Pertiwi',
    email: 'rika.pertiwi@gmail.com',
    mobile: '0857-4321-8765',
    whatsappVerified: true,
    channel: 'GTI',
    city: 'Bandung',
    status: 'active',
    nationalId: '3273025608940012',
    driverLicense: 'L0213948576',
    profileCompletion: 82,
    bankAccountName: 'Rika Pertiwi',
    bankAccountNumber: '2233445566',
    accountRelation: 'Self',
    vehicleType: 'Toyota Calya',
    plateNumber: 'D 9101 EFG',
    vehicleOwner: 'rika.pertiwi@gmail.com',
    vehicleColor: 'White',
    manufacturedYear: 2022,
    odometerSticker: 'ODO-M4S9W3Y0',
    licenseNumberType: 'Black',
    stnkImage: true,
    totalPoints: 9870,
    lastCampaign: { name: 'OVO Cashback Run', date: 'Jan 20, 2025' },
    community: 'Bandung Utara',
    driverType: 'Replacement',
    isVIP: false,
    religion: 'Islam',
    birthDate: '1994-08-06',
    domicile: 'Sukasari',
  },
  {
    id: 'DRV-10013',
    name: 'Bambang Wicaksono',
    email: 'bambang.w@email.co.id',
    mobile: '0811-6789-4321',
    whatsappVerified: false,
    channel: 'NON GRAB',
    city: 'Surabaya',
    status: 'blacklisted',
    nationalId: '3578030103830013',
    driverLicense: 'M1324057689',
    profileCompletion: 60,
    bankAccountName: 'Bambang Wicaksono',
    bankAccountNumber: '3344556677',
    accountRelation: 'Self',
    vehicleType: 'Mitsubishi Xpander',
    plateNumber: 'W 3456 HIJ',
    vehicleOwner: 'bambang.w@email.co.id',
    vehicleColor: 'Dark Blue',
    manufacturedYear: 2018,
    odometerSticker: 'ODO-N5T0X4Z1',
    licenseNumberType: 'Black',
    stnkImage: true,
    totalPoints: 5200,
    lastCampaign: { name: 'Dana Promo Nov', date: 'Nov 3, 2024' },
    driverType: 'Normal',
    isVIP: false,
    religion: 'Islam',
    birthDate: '1983-03-01',
    domicile: 'Rungkut',
    blacklistReason: 'Identity fraud — National ID does not match physical documents presented at verification.',
  },
  {
    id: 'DRV-10014',
    name: 'Nita Ariani',
    email: 'nita.ariani@gmail.com',
    mobile: '0831-1234-5678',
    whatsappVerified: true,
    channel: 'TPI',
    city: 'Jakarta',
    status: 'active',
    nationalId: '3175024304960014',
    driverLicense: 'N2435168790',
    profileCompletion: 91,
    bankAccountName: 'Nita Ariani',
    bankAccountNumber: '4455667788',
    accountRelation: 'Self',
    vehicleType: 'Honda Brio',
    plateNumber: 'B 7890 KLM',
    vehicleOwner: 'nita.ariani@gmail.com',
    vehicleColor: 'Red',
    manufacturedYear: 2023,
    odometerSticker: 'ODO-P6U1Y5A2',
    licenseNumberType: 'Black',
    stnkImage: true,
    vehicles: [
      { id: 'VEH-014-1', vehicleType: 'Honda Brio', plateNumber: 'B 7890 KLM', vehicleOwner: 'nita.ariani@gmail.com', vehicleColor: 'Red', manufacturedYear: 2023, odometerSticker: 'ODO-P6U1Y5A2', licenseNumberType: 'Black', stnkImage: true, isActive: true },
      { id: 'VEH-014-2', vehicleType: 'Toyota Agya', plateNumber: 'B 4455 NA', vehicleOwner: 'nita.ariani@gmail.com', vehicleColor: 'Yellow', manufacturedYear: 2018, odometerSticker: 'ODO-S1U6X2Z8', licenseNumberType: 'Yellow', stnkImage: true, isActive: false },
    ],
    totalPoints: 13680,
    lastCampaign: { name: 'GoPay Loyalty Q1', date: 'Feb 12, 2025' },
    community: 'Jakarta Barat',
    driverType: 'Normal',
    isVIP: true,
    religion: 'Katolik',
    birthDate: '1996-04-23',
    domicile: 'Grogol',
  },
  {
    id: 'DRV-10015',
    name: 'Dimas Pratama',
    email: 'dimas.pratama@gmail.com',
    mobile: '0844-9876-5432',
    whatsappVerified: true,
    channel: 'GTI',
    city: 'Semarang',
    status: 'suspended',
    nationalId: '3374021609910015',
    driverLicense: 'O3546279801',
    profileCompletion: 68,
    bankAccountName: 'Sari Pratama',
    bankAccountNumber: '5566778899',
    accountRelation: 'Brother/Sister',
    vehicleType: 'Toyota Agya',
    plateNumber: 'H 2345 NOP',
    vehicleOwner: 'dimas.pratama@gmail.com',
    vehicleColor: 'Gold',
    manufacturedYear: 2019,
    odometerSticker: 'ODO-Q7V2Z6B3',
    licenseNumberType: 'Yellow',
    stnkImage: false,
    totalPoints: 6100,
    lastCampaign: { name: 'Blibli Harbolnas', date: 'Oct 10, 2024' },
    community: 'Semarang Selatan',
    driverType: 'Vendor',
    isVIP: false,
    religion: 'Islam',
    birthDate: '1991-09-16',
    domicile: 'Tembalang',
    suspendedReason: 'No-show for mandatory document re-verification appointment. 2nd offense.',
  },
];

// ── Page Component ────────────────────────────────────────────────────────────

export function Drivers() {
  const [drivers, setDrivers] = useState<Driver[]>(mockDrivers);
  const { toasts, showToast, dismiss } = useToast();

  // ── Modal / Drawer state ──
  const [drawerDriver,  setDrawerDriver]  = useState<Driver | null>(null);
  const [drawerOpen,    setDrawerOpen]    = useState(false);
  const [editDriver,    setEditDriver]    = useState<Driver | null>(null);
  const [editOpen,      setEditOpen]      = useState(false);
  const [addOpen,       setAddOpen]       = useState(false);
  const [bulkDrivers,   setBulkDrivers]   = useState<Driver[]>([]);
  const [bulkOpen,      setBulkOpen]      = useState(false);
  const [docDriver,     setDocDriver]     = useState<Driver | null>(null);
  const [docType,       setDocType]       = useState<'id' | 'license' | null>(null);
  const [docOpen,       setDocOpen]       = useState(false);

  // Keep drawer in sync when driver data changes (status, VIP, etc.)
  useEffect(() => {
    if (drawerDriver) {
      const updated = drivers.find(d => d.id === drawerDriver.id);
      if (updated) setDrawerDriver(updated);
    }
  }, [drivers]);

  // ── Row click → open drawer ──
  const handleRowClick = (driver: Driver) => {
    setDrawerDriver(driver);
    setDrawerOpen(true);
  };

  // ── Helper: mutate one driver + keep drawer in sync ──
  const mutateDriver = (id: string, patch: Partial<Driver>) => {
    setDrivers(prev => prev.map(d => d.id === id ? { ...d, ...patch } : d));
  };

  const handleDriverAction = (action: string, driverId: string) => {
    const driver = drivers.find(d => d.id === driverId);
    switch (action) {
      case 'view':
        handleRowClick(drivers.find(d => d.id === driverId)!);
        break;
      case 'edit': {
        const d = drivers.find(dr => dr.id === driverId);
        if (d) { setEditDriver(d); setEditOpen(true); }
        break;
      }
      case 'verify': {
        const d = drivers.find(dr => dr.id === driverId);
        if (d) { setDocDriver(d); setDocType('id'); setDocOpen(true); }
        break;
      }
      case 'suspend':
        mutateDriver(driverId, { status: 'suspended', suspendedReason: 'Manually suspended by admin.' });
        showToast('warning', 'Driver Suspended', `${driver?.name ?? driverId} has been suspended.`);
        break;
      case 'activate':
        mutateDriver(driverId, { status: 'active', suspendedReason: undefined });
        showToast('success', 'Driver Activated', `${driver?.name ?? driverId} is now active.`);
        break;
      case 'blacklist':
        mutateDriver(driverId, { status: 'blacklisted', blacklistReason: 'Manually blacklisted by admin.' });
        showToast('error', 'Driver Blacklisted', `${driver?.name ?? driverId} has been blacklisted.`);
        break;
      case 'unblacklist':
        mutateDriver(driverId, { status: 'active', blacklistReason: undefined });
        showToast('success', 'Blacklist Removed', `${driver?.name ?? driverId} status has been restored.`);
        break;
      case 'vip':
        mutateDriver(driverId, { isVIP: true });
        showToast('success', 'VIP Status Added', `${driver?.name ?? driverId} is now a VIP driver.`);
        break;
      case 'unvip':
        mutateDriver(driverId, { isVIP: false });
        showToast('info', 'VIP Status Removed', `${driver?.name ?? driverId} VIP status has been removed.`);
        break;
      case 'message':
        console.log('Send message to:', driverId);
        break;
      case 'export':
        console.log('Export driver data:', driverId);
        break;
      case 'bulk-export':
        console.log('Bulk export drivers:', driverId.split(','));
        break;
      case 'bulk-suspend':
      case 'bulk-activate':
      case 'bulk-vip':
      case 'bulk-unvip':
      case 'bulk-blacklist': {
        const ids = driverId.split(',');
        setBulkDrivers(drivers.filter(d => ids.includes(d.id)));
        setBulkOpen(true);
        break;
      }
      default:
        console.log(action, driverId);
    }
  };

  // ── Bulk apply ──
  const handleBulkApply = (action: string, driverIds: string[], reason: string) => {
    const n = driverIds.length;
    const plural = n > 1 ? 's' : '';
    setDrivers(prev => prev.map(d => {
      if (!driverIds.includes(d.id)) return d;
      switch (action) {
        case 'suspend':     return { ...d, status: 'suspended'   as const, suspendedReason:  reason || 'Bulk suspended by admin.' };
        case 'activate':    return { ...d, status: 'active'      as const, suspendedReason: undefined };
        case 'blacklist':   return { ...d, status: 'blacklisted' as const, blacklistReason:  reason || 'Bulk blacklisted by admin.' };
        case 'unblacklist': return { ...d, status: 'active'      as const, blacklistReason: undefined };
        case 'vip':         return { ...d, isVIP: true };
        case 'unvip':       return { ...d, isVIP: false };
        default: return d;
      }
    }));
    const messages: Record<string, [string, string]> = {
      suspend:     ['warning', `${n} driver${plural} suspended.`],
      activate:    ['success', `${n} driver${plural} activated.`],
      blacklist:   ['error',   `${n} driver${plural} blacklisted.`],
      unblacklist: ['success', `${n} driver${plural} restored to active.`],
      vip:         ['success', `${n} driver${plural} marked as VIP.`],
      unvip:       ['info',    `VIP status removed from ${n} driver${plural}.`],
    };
    const [type, msg] = messages[action] ?? ['info', 'Bulk action applied.'];
    showToast(type as any, 'Bulk Update', msg);
    setBulkOpen(false);
  };

  // ── Add/Edit save ──
  const handleSaveDriver = (data: Partial<Driver>) => {
    if (editDriver) {
      setDrivers(prev => prev.map(d => d.id === editDriver.id ? { ...d, ...data } : d));
      showToast('success', 'Driver Updated', `${data.name ?? editDriver.name} has been updated.`);
    } else {
      const newDriver: Driver = {
        id: `DRV-${10000 + drivers.length + 1}`,
        name: data.name ?? '',
        email: data.email ?? '',
        mobile: data.mobile ?? '',
        whatsappVerified: false,
        channel: data.channel ?? 'GTI',
        city: data.city ?? '',
        status: data.status ?? 'active',
        nationalId: data.nationalId ?? '',
        driverLicense: data.driverLicense ?? '',
        profileCompletion: 0,
        bankAccountName: data.bankAccountName ?? '',
        bankAccountNumber: data.bankAccountNumber ?? '',
        accountRelation: data.accountRelation ?? 'Self',
        vehicleType: data.vehicleType ?? '',
        plateNumber: data.plateNumber ?? '',
        totalPoints: 0,
        driverType: data.driverType ?? 'Normal',
        isVIP: data.isVIP ?? false,
        religion: data.religion,
        birthDate: data.birthDate ?? new Date().toISOString().split('T')[0],
        domicile: data.domicile ?? '',
        community: data.community,
      };
      setDrivers(prev => [newDriver, ...prev]);
      showToast('success', 'Driver Added', `${newDriver.name} has been added successfully.`);
    }
    setEditDriver(null);
  };

  // ── Document verification ──
  const handleVerifyDocument = (driver: Driver, type: 'id' | 'license') => {
    setDocDriver(driver);
    setDocType(type);
    setDocOpen(true);
  };
  const handleApproveDoc = (driver: Driver, docType: 'id' | 'license') => {
    console.log(`Document ${docType} approved for`, driver.id);
  };
  const handleRejectDoc = (driver: Driver, docType: 'id' | 'license', reason: string) => {
    console.log(`Document ${docType} rejected for`, driver.id, 'reason:', reason);
  };

  const handleExport = () => {
    const headers = ['Driver ID', 'Name', 'Email', 'Mobile', 'Channel', 'City', 'Status', 'Points', 'Vehicle', 'Plate', 'Profile%', 'Driver Type', 'VIP'];
    const rows = drivers.map(d => [
      d.id, d.name, d.email, d.mobile, d.channel, d.city, d.status,
      d.totalPoints.toString(), d.vehicleType, d.plateNumber,
      d.profileCompletion.toString() + '%', d.driverType, d.isVIP ? 'Yes' : 'No',
    ]);
    const csv = [headers, ...rows].map(row => row.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `drivers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      {/* ── Page Header ── */}
      <div style={{ marginBottom: '24px' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <span style={{
            fontFamily: 'var(--font-family-geist)', fontSize: '12px',
            color: 'var(--color-muted-foreground)', cursor: 'default',
          }}>Operations</span>
          <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-muted-foreground)' }}>/</span>
          <span style={{ fontFamily: 'var(--font-family-geist)', fontSize: '12px', color: 'var(--color-foreground)', fontWeight: 500 }}>Drivers</span>
        </div>

        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{
              margin: 0,
              fontFamily: 'var(--font-family-geist)',
              fontSize: 'var(--text-24)',
              fontWeight: 700,
              color: 'var(--color-foreground)',
              lineHeight: 1.2,
            }}>
              Drivers
            </h1>
            <p style={{
              margin: '4px 0 0',
              fontFamily: 'var(--font-family-geist)',
              fontSize: 'var(--text-14)',
              fontWeight: 400,
              color: 'var(--color-muted-foreground)',
            }}>
              Manage driver accounts, verify documents, and track campaign activity
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
            <button
              onClick={handleExport}
              style={{
                padding: '9px 16px',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-card)',
                color: 'var(--color-foreground)',
                fontFamily: 'var(--font-family-geist)',
                fontSize: 'var(--text-14)',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-secondary)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--color-card)'; }}
            >
              <Download size={15} />
              Export List
            </button>
            <button
              onClick={() => { setEditDriver(null); setAddOpen(true); }}
              style={{
                padding: '9px 16px',
                borderRadius: 'var(--radius)',
                border: 'none',
                backgroundColor: '#7C3AED',
                color: 'white',
                fontFamily: 'var(--font-family-geist)',
                fontSize: 'var(--text-14)',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#6D28D9'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#7C3AED'; }}
            >
              <Plus size={15} />
              Add Driver
            </button>
          </div>
        </div>
      </div>

      {/* ── Drivers Table ── */}
      <DriversTable
        drivers={drivers}
        onDriverAction={handleDriverAction}
        onRowClick={handleRowClick}
      />

      {/* ── Detail Drawer ── */}
      <DriverDetailDrawer
        driver={drawerDriver}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onEdit={d => { setDrawerOpen(false); setEditDriver(d); setEditOpen(true); }}
        onVerifyDocument={handleVerifyDocument}
        onAction={handleDriverAction}
      />

      {/* ── Add Driver Modal ── */}
      <AddEditDriverModal
        open={addOpen}
        driver={null}
        onClose={() => setAddOpen(false)}
        onSave={handleSaveDriver}
      />

      {/* ── Edit Driver Modal ── */}
      <AddEditDriverModal
        open={editOpen}
        driver={editDriver}
        onClose={() => { setEditOpen(false); setEditDriver(null); }}
        onSave={handleSaveDriver}
      />

      {/* ── Bulk Actions Modal ── */}
      <BulkActionsModal
        open={bulkOpen}
        drivers={bulkDrivers}
        onClose={() => setBulkOpen(false)}
        onApply={handleBulkApply}
      />

      {/* ── Document Verification Modal ── */}
      <DocumentVerificationModal
        open={docOpen}
        driver={docDriver}
        docType={docType}
        onClose={() => { setDocOpen(false); setDocDriver(null); setDocType(null); }}
        onApprove={handleApproveDoc}
        onReject={handleRejectDoc}
      />
    </>
  );
}