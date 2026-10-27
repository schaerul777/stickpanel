import { useEffect, useState, useSyncExternalStore } from 'react';
import {
  buildSeed, evaluateAutoPass, waitingDays, diffContent, diffAttrs,
  CYCLE, CLAIM_MS, ME, OTHER_QCS, OVERDUE_DAYS,
  type AdContent, type AutoPassResult, type Billboard, type PointAttrs, type SeedState, type SurveyAd,
} from './surveyData';

// ─── In-memory "server" for QC · Billboard Survey ─────────────────────────────
// Same createStore/useSyncExternalStore shape as core/masterStore.ts. Every
// claim/save goes through these functions, which re-check state at call time —
// the UI never decides on its own whether a claim or save is allowed.

type Listener = () => void;

let state: SeedState = buildSeed();
const listeners = new Set<Listener>();

function setState(updater: (prev: SeedState) => SeedState) {
  state = updater(state);
  listeners.forEach(l => l());
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  ensureTicker();
  return () => listeners.delete(listener);
}

export function useSurveyState() {
  return useSyncExternalStore(subscribe, () => state, () => state);
}

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

function patchAd(id: string, patch: (ad: SurveyAd) => SurveyAd) {
  setState(s => ({ ...s, ads: s.ads.map(a => (a.id === id ? patch(a) : a)) }));
}

// ─── Selectors ────────────────────────────────────────────────────────────────

export function getBillboard(s: SeedState, id: string): Billboard | undefined {
  return s.billboards.find(b => b.id === id);
}

export function getAd(s: SeedState, id: string): SurveyAd | undefined {
  return s.ads.find(a => a.id === id);
}

export function prevVerified(s: SeedState, ad: SurveyAd): SurveyAd | null {
  return s.ads
    .filter(a => a.billboardId === ad.billboardId && a.month < ad.month && a.state === 'approved' && a.result)
    .sort((a, b) => b.month.localeCompare(a.month))[0] ?? null;
}

export function adsOfBillboard(s: SeedState, billboardId: string): SurveyAd[] {
  return s.ads.filter(a => a.billboardId === billboardId).sort((a, b) => b.month.localeCompare(a.month));
}

export function isClaimedByOther(ad: SurveyAd, now: number) {
  return !!ad.claim && ad.claim.by !== ME && ad.claim.expiresAt > now;
}

export type ChangeKind = 'status' | 'brand' | 'none';

export function changeKind(ad: SurveyAd, prev: SurveyAd | null): ChangeKind {
  const cur = ad.surveyor.input;
  const p = prev?.result;
  if (!p) return 'none';
  if (p.status !== cur.status) return 'status';
  if (p.brand !== cur.brand || JSON.stringify(p.additionalBrands ?? []) !== JSON.stringify(cur.additionalBrands ?? [])) return 'brand';
  return 'none';
}

export interface QueueRow {
  ad: SurveyAd;
  billboard: Billboard;
  prev: SurveyAd | null;
  auto: AutoPassResult;
  change: ChangeKind;
  waiting: number;
  overdue: boolean;
}

function buildRow(s: SeedState, ad: SurveyAd, now: number): QueueRow {
  const billboard = getBillboard(s, ad.billboardId)!;
  const prev = prevVerified(s, ad);
  const waiting = waitingDays(ad, now);
  return { ad, billboard, prev, auto: evaluateAutoPass(ad, billboard, prev), change: changeKind(ad, prev), waiting, overdue: waiting > OVERDUE_DAYS };
}

function cyclePending(s: SeedState, city: string, now: number) {
  return s.ads
    .filter(a => a.month === CYCLE.month && a.state === 'pending')
    .map(a => buildRow(s, a, now))
    .filter(r => !city || r.billboard.city === city);
}

const CHANGE_RANK: Record<ChangeKind, number> = { status: 1, brand: 2, none: 3 };

/** Manual queue, already in claim order. Ads claimed by anyone are excluded. */
export function manualQueue(s: SeedState, city: string, now: number): QueueRow[] {
  return cyclePending(s, city, now)
    .filter(r => !r.auto.pass)
    .filter(r => !r.ad.claim || r.ad.claim.expiresAt <= now)
    .sort((a, b) => {
      const ga = a.overdue ? 0 : CHANGE_RANK[a.change];
      const gb = b.overdue ? 0 : CHANGE_RANK[b.change];
      if (ga !== gb) return ga - gb;
      if (a.ad.inSample !== b.ad.inSample) return a.ad.inSample ? -1 : 1;
      return a.ad.photo!.uploadedAt - b.ad.photo!.uploadedAt;
    });
}

/** Auto-pass candidates. Includes ads another QC has open (shown, but skipped on approve). */
export function autoQueue(s: SeedState, city: string, now: number): QueueRow[] {
  return cyclePending(s, city, now)
    .filter(r => r.auto.pass)
    .sort((a, b) => a.ad.photo!.uploadedAt - b.ad.photo!.uploadedAt);
}

// ─── Claims ───────────────────────────────────────────────────────────────────

export type ClaimResult = { ok: true } | { ok: false; by: string };

export function claimAd(adId: string): ClaimResult {
  const now = Date.now();
  const ad = getAd(state, adId);
  if (!ad) return { ok: false, by: 'unknown' };
  if (isClaimedByOther(ad, now)) return { ok: false, by: ad.claim!.by };
  // One claim per QC: drop any other claim this QC still holds.
  setState(s => ({
    ...s,
    ads: s.ads.map(a => {
      if (a.id === adId) return { ...a, claim: { by: ME, expiresAt: now + CLAIM_MS } };
      if (a.claim?.by === ME) return { ...a, claim: null };
      return a;
    }),
  }));
  return { ok: true };
}

export function claimNext(city: string): string | null {
  const next = manualQueue(state, city, Date.now())[0];
  if (!next) return null;
  return claimAd(next.ad.id).ok ? next.ad.id : null;
}

export function touchClaim(adId: string) {
  const ad = getAd(state, adId);
  if (!ad || ad.claim?.by !== ME) return;
  const expiresAt = Date.now() + CLAIM_MS;
  if (expiresAt - ad.claim.expiresAt < 1000) return;
  patchAd(adId, a => ({ ...a, claim: { by: ME, expiresAt } }));
}

export function releaseClaim(adId: string) {
  const ad = getAd(state, adId);
  if (!ad || ad.claim?.by !== ME) return;
  patchAd(adId, a => ({ ...a, claim: null }));
}

// Closing the tab releases immediately instead of waiting for the timeout.
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => {
    if (state.ads.some(a => a.claim?.by === ME)) {
      state = { ...state, ads: state.ads.map(a => (a.claim?.by === ME ? { ...a, claim: null } : a)) };
    }
  });
}

// ─── Saves ────────────────────────────────────────────────────────────────────

export type SaveResult = { ok: true } | { ok: false; conflict: true; by: string; saved: boolean };

/** Re-check on the server side: the ad must still be the version this QC opened. */
function checkWritable(adId: string, openedVersion: number): SaveResult {
  const ad = getAd(state, adId);
  if (!ad) return { ok: false, conflict: true, by: 'unknown', saved: false };
  if (ad.version !== openedVersion) {
    return { ok: false, conflict: true, by: ad.qc?.by ?? 'another QC', saved: true };
  }
  if (isClaimedByOther(ad, Date.now())) {
    return { ok: false, conflict: true, by: ad.claim!.by, saved: false };
  }
  return { ok: true };
}

function moveTarget(code: string) {
  return code.trim() ? state.billboards.find(b => b.code.toLowerCase() === code.trim().toLowerCase()) : undefined;
}

function applyAttrs(billboardId: string, attrs: PointAttrs) {
  setState(s => ({ ...s, billboards: s.billboards.map(b => (b.id === billboardId ? { ...b, attrs: { ...attrs } } : b)) }));
}

export function saveQc(adId: string, openedVersion: number, payload: { content: AdContent; attrs: PointAttrs; moveTo: string }): SaveResult {
  const check = checkWritable(adId, openedVersion);
  if (!check.ok) return check;
  const ad = getAd(state, adId)!;
  const target = moveTarget(payload.moveTo);
  applyAttrs(ad.billboardId, payload.attrs);
  patchAd(adId, a => ({
    ...a,
    billboardId: target?.id ?? a.billboardId,
    state: 'approved',
    result: { ...payload.content },
    corrections: diffContent(a.surveyor.input, payload.content),
    qc: { by: ME, at: Date.now(), method: 'manual' },
    claim: null,
    version: a.version + 1,
  }));
  setState(s => ({ ...s, doneToday: s.doneToday + 1 }));
  return { ok: true };
}

export function rejectAd(adId: string, openedVersion: number, reason: string): SaveResult {
  const check = checkWritable(adId, openedVersion);
  if (!check.ok) return check;
  patchAd(adId, a => ({
    ...a,
    state: 'rejected',
    rejectReason: reason,
    qc: { by: ME, at: Date.now(), method: 'manual' },
    claim: null,
    version: a.version + 1,
  }));
  setState(s => ({ ...s, doneToday: s.doneToday + 1 }));
  return { ok: true };
}

export function saveEdit(
  adId: string, openedVersion: number,
  payload: { content: AdContent; attrs: PointAttrs; reason: string; approve: boolean },
): SaveResult {
  const check = checkWritable(adId, openedVersion);
  if (!check.ok) return check;
  const ad = getAd(state, adId)!;
  const billboard = getBillboard(state, ad.billboardId)!;
  const before = ad.result ?? ad.surveyor.input;
  const at = Date.now();
  const diffs = [...diffContent(before, payload.content), ...diffAttrs(billboard.attrs, payload.attrs)];
  if (payload.approve) diffs.unshift({ field: 'QC decision', from: 'Rejected', to: 'Approved' });
  applyAttrs(ad.billboardId, payload.attrs);
  patchAd(adId, a => ({
    ...a,
    state: payload.approve ? 'approved' : a.state,
    rejectReason: payload.approve ? null : a.rejectReason,
    result: { ...payload.content },
    changes: [...a.changes, ...diffs.map(d => ({ ...d, by: ME, at, reason: payload.reason }))],
    claim: null,
    version: a.version + 1,
  }));
  return { ok: true };
}

/** One transaction: ads another QC has open are skipped; each approval is logged individually. */
export function bulkApprove(adIds: string[]): { approved: number; skipped: number } {
  const now = Date.now();
  let approved = 0;
  let skipped = 0;
  setState(s => ({
    ...s,
    ads: s.ads.map(a => {
      if (!adIds.includes(a.id) || a.state !== 'pending') return a;
      if (isClaimedByOther(a, now)) { skipped++; return a; }
      approved++;
      return { ...a, state: 'approved', result: { ...a.surveyor.input }, qc: { by: ME, at: now, method: 'auto' }, claim: null, version: a.version + 1 };
    }),
  }));
  return { approved, skipped };
}

export function billboardByCode(code: string) {
  return moveTarget(code);
}

// ─── Claim expiry + simulated QC colleagues ───────────────────────────────────
// Expired claims return to the queue. Other QCs finish the ad they hold when
// their claim runs out. When *this* QC's claim times out, a colleague picks that
// ad up shortly after — so a late Save hits the conflict guard, as it would live.

let ticker: ReturnType<typeof setInterval> | null = null;
const PICKUP_DELAY_MS = 20_000;
const pickups = new Map<string, number>();

function ensureTicker() {
  if (ticker) return;
  ticker = setInterval(tick, 1000);
}

function tick() {
  const now = Date.now();
  const expired = state.ads.filter(a => a.claim && a.claim.expiresAt <= now);
  const dueTakeovers = [...pickups.entries()].filter(([, at]) => at <= now).map(([id]) => id);
  if (!expired.length && !dueTakeovers.length) return;

  expired.forEach(a => { if (a.claim!.by === ME && a.state === 'pending') pickups.set(a.id, now + PICKUP_DELAY_MS); });
  dueTakeovers.forEach(id => pickups.delete(id));

  setState(s => ({
    ...s,
    ads: s.ads.map(a => {
      const isExpired = a.claim && a.claim.expiresAt <= now;
      if (isExpired && a.claim!.by !== ME && a.state === 'pending') {
        // Colleague finishes the ad they were working on.
        return { ...a, state: 'approved', result: { ...a.surveyor.input }, qc: { by: a.claim!.by, at: now, method: 'manual' }, claim: null, version: a.version + 1 };
      }
      if (isExpired) return { ...a, claim: null };
      if (dueTakeovers.includes(a.id) && a.state === 'pending' && !a.claim) {
        return { ...a, state: 'approved', result: { ...a.surveyor.input }, qc: { by: OTHER_QCS[0], at: now, method: 'manual' }, version: a.version + 1 };
      }
      return a;
    }),
  }));
}
