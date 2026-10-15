import { useSyncExternalStore } from 'react';
import { type BaseRecord, getMasterState } from './masterStore';

// ─── Client Profile data layer ─────────────────────────────────────────────
// A sibling in-memory store to masterStore.ts (same createStore/useSyncExternalStore
// pattern), holding CORE 4's Client Profile feature: clients, their per-company
// links, contacts, billings, and bank accounts. References into masterStore
// (companies, cities, brands, banks) are by id.

type Listener = () => void;

function createStore<T>(initialState: T) {
  let state = initialState;
  const listeners = new Set<Listener>();
  return {
    getState: () => state,
    setState: (updater: (prev: T) => T) => {
      state = updater(state);
      listeners.forEach(l => l());
    },
    subscribe: (listener: Listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

let idCounter = 6000;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  name: string;
  role: 'Sales' | 'Finance';
}

export interface ClientRecord extends BaseRecord {
  name: string;
  brandText: string;
  brandId: string | null;
  email: string;
  website: string;
  cityId: string;
  phoneNumber: string;
  mainImage: string | null;
  npwpImage: string | null;
  digitalImage: string | null;
}

export interface ClientCompanyLink {
  id: string;
  clientId: string;
  companyId: string;
  salesId: string;
  netsuiteId: string;
  jurnalId: string;
  verified: boolean;
  verifiedBy: string | null;
  verifiedAt: string | null;
  hasQuotations: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClientContact {
  id: string;
  clientId: string;
  salutation: 'Mr' | 'Mrs' | 'Ms';
  name: string;
  position: string;
  email: string;
  mobileNumber: string;
  phoneNumber: string;
  active: boolean;
  primaryContact: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClientBilling {
  id: string;
  clientId: string;
  key: string;
  name: string;
  email: string;
  phoneNumber: string;
  faxNumber: string;
  billingAddress: string;
  shippingAddress: string;
  primary: boolean;
  copyImage: string | null;
  extra: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientBankAccount {
  id: string;
  clientId: string;
  bankId: string;
  name: string;
  holder: string;
  number: string;
  branch: string;
  primary: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ClientProfileState {
  clients: ClientRecord[];
  links: ClientCompanyLink[];
  contacts: ClientContact[];
  billings: ClientBilling[];
  bankAccounts: ClientBankAccount[];
  adminUsers: AdminUser[];
}

// ─── Mock seed data ─────────────────────────────────────────────────────────

const ms = getMasterState();
const companyId = (i: number) => ms.companies[i].id;
const cityId = (i: number) => ms.cities[i].id;
const brandId = (i: number) => ms.brands[i].id;
const bankId = (i: number) => ms.banks[i].id;

export const adminUsers: AdminUser[] = [
  { id: nextId('admin'), name: 'Dewi Anggraini', role: 'Sales' },
  { id: nextId('admin'), name: 'Budi Santoso', role: 'Sales' },
  { id: nextId('admin'), name: 'Rina Marlina', role: 'Sales' },
  { id: nextId('admin'), name: 'Agus Prasetyo', role: 'Finance' },
  { id: nextId('admin'), name: 'Siti Nurhaliza', role: 'Finance' },
  { id: nextId('admin'), name: 'Fajar Ramadhan', role: 'Sales' },
];
const sales = (i: number) => adminUsers[i].id;

interface ClientSeed {
  name: string; brandText: string; brandIdx: number | null; email: string; website: string;
  cityIdx: number; phoneNumber: string;
  links: { companyIdx: number; salesIdx: number; verified: boolean; hasQuotations?: boolean }[];
}

const clientSeeds: ClientSeed[] = [
  { name: 'CV Sinar Boga Nusantara', brandText: 'Nusantara Kopi', brandIdx: 0, email: 'contact@sinarboga.co.id', website: 'https://sinarboga.co.id', cityIdx: 0, phoneNumber: '021-5551000',
    links: [{ companyIdx: 0, salesIdx: 0, verified: true, hasQuotations: true }, { companyIdx: 1, salesIdx: 1, verified: false }] },
  { name: 'PT Otomotif Jaya Perkasa', brandText: 'Garuda Mobile', brandIdx: 1, email: 'info@jayaperkasa.id', website: 'https://jayaperkasa.id', cityIdx: 1, phoneNumber: '031-5552000',
    links: [{ companyIdx: 0, salesIdx: 0, verified: true }, { companyIdx: 2, salesIdx: 2, verified: false }] },
  { name: 'PT Properti Cemerlang', brandText: 'Cemerlang Land', brandIdx: null, email: 'admin@cemerlangland.id', website: '', cityIdx: 2, phoneNumber: '022-5553000',
    links: [{ companyIdx: 1, salesIdx: 1, verified: true }] },
  { name: 'Toko Elektronik Merapi', brandText: 'Cakra Elektronik', brandIdx: 3, email: 'toko@cakraelektronik.id', website: 'https://cakraelektronik.id', cityIdx: 7, phoneNumber: '0274-5554000',
    links: [{ companyIdx: 0, salesIdx: 2, verified: false }] },
  { name: 'PT Fintech Nusantara Digital', brandText: 'Rajawali Finance', brandIdx: 7, email: 'hello@rajawalifinance.id', website: 'https://rajawalifinance.id', cityIdx: 0, phoneNumber: '021-5555000',
    links: [{ companyIdx: 3, salesIdx: 3, verified: true }] },
  { name: 'CV Fashion Melati Indah', brandText: 'Melati Kosmetik', brandIdx: 8, email: 'order@melatiindah.id', website: '', cityIdx: 4, phoneNumber: '024-5556000',
    links: [{ companyIdx: 1, salesIdx: 1, verified: false }] },
  { name: 'PT Sekolah Cerdas Bangsa', brandText: 'Cerdas Bangsa', brandIdx: null, email: 'admin@cerdasbangsa.sch.id', website: 'https://cerdasbangsa.sch.id', cityIdx: 3, phoneNumber: '061-5557000',
    links: [{ companyIdx: 2, salesIdx: 2, verified: true }] },
  { name: 'PT Teknologi Awan Biru', brandText: 'Awan Biru Cloud', brandIdx: null, email: 'contact@awanbiru.tech', website: 'https://awanbiru.tech', cityIdx: 0, phoneNumber: '021-5558000',
    links: [{ companyIdx: 0, salesIdx: 0, verified: true }, { companyIdx: 3, salesIdx: 3, verified: true }] },
  { name: 'CV Kuliner Rasa Ibu', brandText: 'Khatulistiwa Snack', brandIdx: 6, email: 'order@rasaibu.id', website: '', cityIdx: 5, phoneNumber: '0411-5559000',
    links: [{ companyIdx: 2, salesIdx: 4, verified: false }] },
  { name: 'PT Otomotif Prima Sejahtera', brandText: 'Samudra Otomotif', brandIdx: 5, email: 'sales@primasejahtera.id', website: 'https://primasejahtera.id', cityIdx: 6, phoneNumber: '0361-5550000',
    links: [{ companyIdx: 3, salesIdx: 3, verified: true }] },
];

const CONTACT_NAME_POOL = [
  'Ahmad Fauzi', 'Sri Wahyuni', 'Hendra Gunawan', 'Lestari Putri', 'Dedi Kurniawan',
  'Maya Sari', 'Rudi Hartono', 'Indah Permata', 'Yusuf Ibrahim', 'Nadia Ramadhani',
];

function buildSeed() {
  const clients: ClientRecord[] = [];
  const links: ClientCompanyLink[] = [];
  const contacts: ClientContact[] = [];
  const billings: ClientBilling[] = [];
  const bankAccounts: ClientBankAccount[] = [];

  clientSeeds.forEach((seed, i) => {
    const clientId = nextId('client');
    const createdAt = daysAgoISO(60 - i * 2);

    clients.push({
      id: clientId,
      name: seed.name,
      brandText: seed.brandText,
      brandId: seed.brandIdx === null ? null : brandId(seed.brandIdx),
      email: seed.email,
      website: seed.website,
      cityId: cityId(seed.cityIdx),
      phoneNumber: seed.phoneNumber,
      mainImage: null,
      npwpImage: null,
      digitalImage: null,
      createdAt, updatedAt: daysAgoISO(10 - (i % 8)), deletedAt: null,
    });

    seed.links.forEach((l, li) => {
      const linkId = nextId('link');
      const verifiedAt = l.verified ? daysAgoISO(20 - i) : null;
      links.push({
        id: linkId,
        clientId,
        companyId: companyId(l.companyIdx),
        salesId: sales(l.salesIdx),
        netsuiteId: `NS-${1000 + i * 10 + li}`,
        jurnalId: `JR-${2000 + i * 10 + li}`,
        verified: l.verified,
        verifiedBy: l.verified ? adminUsers[l.salesIdx].name : null,
        verifiedAt,
        hasQuotations: !!l.hasQuotations,
        createdAt, updatedAt: createdAt,
      });

      // Two contacts per link: one primary, one not.
      const nameA = CONTACT_NAME_POOL[(i * 2 + li) % CONTACT_NAME_POOL.length];
      const nameB = CONTACT_NAME_POOL[(i * 2 + li + 1) % CONTACT_NAME_POOL.length];
      contacts.push({
        id: nextId('contact'), clientId,
        salutation: 'Mr', name: nameA, position: 'Marketing Manager',
        email: `${nameA.toLowerCase().replace(/\s+/g, '.')}.${i}${li}@${seed.name.split(' ')[0].toLowerCase()}.co.id`,
        mobileNumber: `08${1100000000 + i * 1000 + li}`, phoneNumber: '',
        active: true, primaryContact: true,
        createdAt, updatedAt: createdAt,
      });
      contacts.push({
        id: nextId('contact'), clientId,
        salutation: 'Ms', name: nameB, position: 'Finance Staff',
        email: `${nameB.toLowerCase().replace(/\s+/g, '.')}.${i}${li}@${seed.name.split(' ')[0].toLowerCase()}.co.id`,
        mobileNumber: `08${1200000000 + i * 1000 + li}`, phoneNumber: `021${5000000 + i}`,
        active: true, primaryContact: false,
        createdAt, updatedAt: createdAt,
      });
    });

    // Billings — 1 primary for every client, a 2nd (non-primary) for the first three.
    billings.push({
      id: nextId('billing'), clientId, key: `BIL-${i}-0`, name: `${seed.name} - Head Office`, email: seed.email,
      phoneNumber: '021-5551000', faxNumber: '',
      billingAddress: `Jl. Sudirman No. ${45 + i}, Jakarta Selatan`, shippingAddress: `Jl. Sudirman No. ${45 + i}, Jakarta Selatan`,
      primary: true, copyImage: null, extra: '',
      createdAt, updatedAt: createdAt,
    });
    if (i < 3) {
      billings.push({
        id: nextId('billing'), clientId, key: `BIL-${i}-1`, name: `${seed.name} - Branch Office`, email: seed.email,
        phoneNumber: '021-5552000', faxNumber: '',
        billingAddress: `Jl. Sudirman No. ${45 + i}, Jakarta Selatan`, shippingAddress: '', primary: false,
        copyImage: null, extra: 'Branch billing contact',
        createdAt, updatedAt: createdAt,
      });
    }

    // Bank accounts — 1 for every client, a 2nd for the first three.
    bankAccounts.push({
      id: nextId('bank-acct'), clientId, bankId: bankId(i % 6), name: `Main Account`, holder: seed.name,
      number: String(1000000000 + i * 111111), branch: 'Jakarta Pusat', primary: true,
      createdAt, updatedAt: createdAt,
    });
    if (i < 3) {
      bankAccounts.push({
        id: nextId('bank-acct'), clientId, bankId: bankId((i + 2) % 6), name: `Secondary Account`, holder: seed.name,
        number: String(2000000000 + i * 111111), branch: 'Surabaya', primary: false,
        createdAt, updatedAt: createdAt,
      });
    }
  });

  return { clients, links, contacts, billings, bankAccounts };
}

const seeded = buildSeed();

const initialState: ClientProfileState = {
  clients: seeded.clients,
  links: seeded.links,
  contacts: seeded.contacts,
  billings: seeded.billings,
  bankAccounts: seeded.bankAccounts,
  adminUsers,
};

const store = createStore<ClientProfileState>(initialState);

export function useClientProfileData(): ClientProfileState {
  return useSyncExternalStore(store.subscribe, store.getState, store.getState);
}

function touch() { return new Date().toISOString(); }

// ─── Client CRUD ────────────────────────────────────────────────────────────

export function getClient(id: string): ClientRecord | undefined {
  return store.getState().clients.find(c => c.id === id);
}

export interface ClientFormInput {
  name: string; brandText: string; brandId: string | null; email: string; website: string;
  cityId: string; phoneNumber: string;
  mainImage: string | null; npwpImage: string | null; digitalImage: string | null;
}

/** Creates a client and, on create, its first company link. Returns the new/updated client id. */
export function upsertClient(data: ClientFormInput, id?: string): string {
  let resultId = id ?? '';
  store.setState(s => {
    if (id) {
      return { ...s, clients: s.clients.map(c => c.id === id ? { ...c, ...data, updatedAt: touch() } : c) };
    }
    const rec: ClientRecord = { ...data, id: nextId('client'), createdAt: touch(), updatedAt: touch(), deletedAt: null };
    resultId = rec.id;
    return { ...s, clients: [rec, ...s.clients] };
  });
  return resultId || id!;
}

export function softDeleteClient(id: string) {
  store.setState(s => ({ ...s, clients: s.clients.map(c => c.id === id ? { ...c, deletedAt: touch() } : c) }));
}

export function restoreClient(id: string) {
  store.setState(s => ({ ...s, clients: s.clients.map(c => c.id === id ? { ...c, deletedAt: null, updatedAt: touch() } : c) }));
}

// ─── Company links ──────────────────────────────────────────────────────────

export function getLinksForClient(clientId: string): ClientCompanyLink[] {
  return store.getState().links.filter(l => l.clientId === clientId);
}

export function getLink(clientId: string, companyId: string): ClientCompanyLink | undefined {
  return store.getState().links.find(l => l.clientId === clientId && l.companyId === companyId);
}

export function isClientLinkedToCompany(clientId: string, companyId: string): boolean {
  return !!getLink(clientId, companyId);
}

/** Clients (not deleted) linked to the given company. */
export function getClientsForCompany(companyId: string): ClientRecord[] {
  const linkedIds = new Set(store.getState().links.filter(l => l.companyId === companyId).map(l => l.clientId));
  return store.getState().clients.filter(c => c.deletedAt === null && linkedIds.has(c.id));
}

export function addCompanyLink(clientId: string, companyId: string, salesId: string, netsuiteId: string, jurnalId: string) {
  store.setState(s => ({
    ...s,
    links: [...s.links, {
      id: nextId('link'), clientId, companyId, salesId, netsuiteId, jurnalId,
      verified: false, verifiedBy: null, verifiedAt: null, hasQuotations: false,
      createdAt: touch(), updatedAt: touch(),
    }],
  }));
}

export function updateCompanyLink(linkId: string, data: { salesId: string; netsuiteId: string; jurnalId: string }) {
  store.setState(s => ({ ...s, links: s.links.map(l => l.id === linkId ? { ...l, ...data, updatedAt: touch() } : l) }));
}

export function canRemoveLink(linkId: string): string | undefined {
  const link = store.getState().links.find(l => l.id === linkId);
  if (link?.hasQuotations) return `Can't remove: this client has quotations under this company.`;
  return undefined;
}

export function removeCompanyLink(linkId: string) {
  store.setState(s => ({ ...s, links: s.links.filter(l => l.id !== linkId) }));
}

export function setLinkVerified(linkId: string, verified: boolean, adminUserName: string | null) {
  store.setState(s => ({
    ...s,
    links: s.links.map(l => l.id === linkId ? {
      ...l, verified, verifiedBy: verified ? adminUserName : null, verifiedAt: verified ? touch() : null, updatedAt: touch(),
    } : l),
  }));
}

// ─── Contacts ───────────────────────────────────────────────────────────────

export function getContactsForClient(clientId: string): ClientContact[] {
  return store.getState().contacts.filter(c => c.clientId === clientId);
}

export function isContactEmailTaken(email: string, excludeId?: string): boolean {
  const norm = email.trim().toLowerCase();
  return store.getState().contacts.some(c => c.id !== excludeId && c.email.trim().toLowerCase() === norm);
}

export interface ContactFormInput {
  salutation: 'Mr' | 'Mrs' | 'Ms'; name: string; position: string; email: string;
  mobileNumber: string; phoneNumber: string; active: boolean; primaryContact: boolean;
}

export function upsertContact(clientId: string, data: ContactFormInput, id?: string) {
  store.setState(s => {
    let contacts = s.contacts;
    if (data.primaryContact) {
      contacts = contacts.map(c => (c.clientId === clientId && c.id !== id)
        ? { ...c, primaryContact: false } : c);
    }
    if (id) {
      contacts = contacts.map(c => c.id === id ? { ...c, ...data, updatedAt: touch() } : c);
    } else {
      const rec: ClientContact = {
        ...data, id: nextId('contact'), clientId,
        createdAt: touch(), updatedAt: touch(),
      };
      contacts = [rec, ...contacts];
    }
    return { ...s, contacts };
  });
}

export function deactivateContact(id: string) {
  store.setState(s => ({ ...s, contacts: s.contacts.map(c => c.id === id ? { ...c, active: false, updatedAt: touch() } : c) }));
}

// ─── Billings ───────────────────────────────────────────────────────────────

export function getBillingsForClient(clientId: string): ClientBilling[] {
  return store.getState().billings.filter(b => b.clientId === clientId);
}

export type BillingFormInput = Omit<ClientBilling, 'id' | 'clientId' | 'createdAt' | 'updatedAt'>;

export function upsertBilling(clientId: string, data: BillingFormInput, id?: string) {
  store.setState(s => {
    let billings = s.billings;
    if (data.primary) {
      billings = billings.map(b => (b.clientId === clientId && b.id !== id) ? { ...b, primary: false } : b);
    }
    if (id) {
      billings = billings.map(b => b.id === id ? { ...b, ...data, updatedAt: touch() } : b);
    } else {
      const isFirst = !billings.some(b => b.clientId === clientId);
      const rec: ClientBilling = { ...data, id: nextId('billing'), clientId, primary: data.primary || isFirst, createdAt: touch(), updatedAt: touch() };
      billings = [rec, ...billings];
    }
    return { ...s, billings };
  });
}

export function deleteBilling(id: string) {
  store.setState(s => ({ ...s, billings: s.billings.filter(b => b.id !== id) }));
}

// ─── Bank accounts ──────────────────────────────────────────────────────────

export function getBankAccountsForClient(clientId: string): ClientBankAccount[] {
  return store.getState().bankAccounts.filter(b => b.clientId === clientId);
}

export type BankAccountFormInput = Omit<ClientBankAccount, 'id' | 'clientId' | 'createdAt' | 'updatedAt'>;

export function upsertBankAccount(clientId: string, data: BankAccountFormInput, id?: string) {
  store.setState(s => {
    let bankAccounts = s.bankAccounts;
    if (data.primary) {
      bankAccounts = bankAccounts.map(b => (b.clientId === clientId && b.id !== id) ? { ...b, primary: false } : b);
    }
    if (id) {
      return { ...s, bankAccounts: bankAccounts.map(b => b.id === id ? { ...b, ...data, updatedAt: touch() } : b) };
    }
    const rec: ClientBankAccount = { ...data, id: nextId('bank-acct'), clientId, createdAt: touch(), updatedAt: touch() };
    return { ...s, bankAccounts: [rec, ...bankAccounts] };
  });
}

export function deleteBankAccount(id: string) {
  store.setState(s => ({ ...s, bankAccounts: s.bankAccounts.filter(b => b.id !== id) }));
}

// ─── Reference counts (used to block deleting Industry / Bank master records) ──

export function countClientsUsingIndustry(_industryId: string): number {
  // industryId removed from ClientRecord per ERD; always return 0 now
  return 0;
}

export function countBankAccountsUsingBank(bankId: string): number {
  return store.getState().bankAccounts.filter(b => b.bankId === bankId).length;
}
