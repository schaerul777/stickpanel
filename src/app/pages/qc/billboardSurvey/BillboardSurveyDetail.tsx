import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import {
  ArrowLeft, Lock, CheckCircle2, AlertTriangle, Pencil, History, MapPin, XCircle, Save, ChevronDown, Info,
  CircleAlert, MoreHorizontal, ZoomIn, ZoomOut, RotateCcw, MoveRight, Clock3,
} from 'lucide-react';
import { useToast, ToastContainer } from '../../../components/Toast';
import {
  AD_STATUSES, BRANDS, CYCLE, MAX_DRIFT_M, ME,
  bearingDeg, compass, contentSummary, diffAttrs, diffContent, distanceM, fmtDateTime, industryOf, monthLabel, monthShort, waitingDays,
  type AdContent, type AdStatus, type Billboard, type FieldDiff, type PointAttrs, type SurveyAd, type SurveyPhoto,
} from './surveyData';
import {
  adsOfBillboard, billboardByCode, changeKind, claimAd, claimNext, getAd, getBillboard, manualQueue, prevVerified,
  rejectAd, releaseClaim, saveEdit, saveQc, touchClaim, useNow, useSurveyState, type SaveResult,
} from './surveyStore';
import {
  AMBER, AMBER_BORDER, AMBER_TINT, Badge, Btn, FONT, GRAY, GREEN, GREEN_TINT, Lightbox, Modal, PRIMARY, PRIMARY_BORDER, PRIMARY_TINT, RED, RED_BORDER, RED_TINT,
  cardStyle, fmtCountdown, inputStyle, labelStyle, sectionTitle,
} from './surveyUi';
import { photoSrc } from './surveyPhoto';
import { PositionMap } from './PositionMap';

const BASE = '/core-3/qc/billboard-survey';
type Mode = 'qc' | 'view' | 'edit';
type ShowToast = ReturnType<typeof useToast>['showToast'];

// ─── Route wrapper ────────────────────────────────────────────────────────────
// Keyed on ad + mode so each open starts with fresh form state and captures the
// version it was opened at (used by the save-conflict guard).

export function BillboardSurveyDetail() {
  const { adId = '' } = useParams();
  const [params] = useSearchParams();
  const mode = (['qc', 'view', 'edit'].includes(params.get('mode') ?? '') ? params.get('mode') : 'view') as Mode;
  const city = params.get('city') ?? '';
  const s = useSurveyState();
  const { toasts, showToast, dismiss } = useToast();
  const ad = getAd(s, adId);

  return (
    <div style={{ fontFamily: FONT }}>
      {ad ? (
        <DetailBody key={`${adId}-${mode}`} adId={adId} mode={mode} city={city} showToast={showToast} />
      ) : (
        <div style={{ ...cardStyle, padding: '48px', textAlign: 'center' }}>
          <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px' }}>Ad not found</div>
          <a href={BASE} style={{ color: PRIMARY, fontSize: '13px' }}>Back to Billboard Survey</a>
        </div>
      )}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

// ─── Small building blocks ────────────────────────────────────────────────────

function Card({ title, right, children, style }: { title: ReactNode; right?: ReactNode; children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ ...cardStyle, padding: '16px 18px', ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
        <h3 style={sectionTitle}>{title}</h3>
        {right}
      </div>
      {children}
    </div>
  );
}

function Select<T extends string>({ value, options, onChange, disabled, placeholder }: { value: T; options: readonly T[]; onChange: (v: T) => void; disabled?: boolean; placeholder?: string }) {
  return (
    <div style={{ position: 'relative' }}>
      <select value={value} disabled={disabled} onChange={e => onChange(e.target.value as T)} style={{ ...inputStyle, appearance: 'none', paddingRight: '28px', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1 }}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={13} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--muted-foreground)' }} />
    </div>
  );
}

function DiffList({ diffs }: { diffs: FieldDiff[] }) {
  return (
    <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {diffs.map((d, i) => (
        <li key={i} style={{ fontSize: '13px' }}>
          <span style={{ fontWeight: 600 }}>{d.field}:</span>{' '}
          <span style={{ color: 'var(--muted-foreground)', textDecoration: 'line-through' }}>{d.from}</span> → <span>{d.to}</span>
        </li>
      ))}
    </ul>
  );
}

function KV({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontSize: '12px', padding: '5px 0', borderBottom: '1px dashed var(--border)' }}>
      <span style={{ color: 'var(--muted-foreground)' }}>{k}</span>
      <span style={{ textAlign: 'right', fontWeight: 500 }}>{v}</span>
    </div>
  );
}

function photoOffset(photo: SurveyPhoto | null | undefined, b: Billboard) {
  if (!photo || photo.lat == null || photo.lng == null) return null;
  const d = distanceM(b.lat, b.lng, photo.lat, photo.lng);
  return { d, dir: compass(bearingDeg(b.lat, b.lng, photo.lat, photo.lng)) };
}

// ─── Reject dialog ────────────────────────────────────────────────────────────

const DETAIL_REJECT_REASONS = [
  'Angle miring tidak terbaca',
  'Billboard bukan komersil',
  'Double / pernah di upload',
  'Double BB Beda ID - Delete',
  'Foto Blurry - Konten Tidak Jelas',
  'Foto survey terhalang pohon atau kabel',
  'Foto survey terlalu jauh',
  'Foto survey terpotong',
  'Jenis Billboard - Delete',
  'Keliru type BB dari OOH jadi DOOH atau sebaliknya',
  'Konstruksi Non Permanen - Delete',
  'Lokasi - Delete',
  'Tidak sesuai foto default',
];

function MoveBillboardDialog({ currentId, billboards, nearby, onCancel, onConfirm }: {
  currentId: string; billboards: Billboard[]; nearby: { billboard: Billboard; distance: number }[];
  onCancel: () => void; onConfirm: (code: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [confirming, setConfirming] = useState(false);
  const selected = billboardByCode(query.trim());
  const nearbyIds = new Set(nearby.map(n => n.billboard.id));
  const candidates = billboards.filter(b => b.id !== currentId && (!query.trim() || `${b.code} ${b.attrs.street} ${b.city}`.toLowerCase().includes(query.toLowerCase())))
    .sort((a, b) => Number(nearbyIds.has(b.id)) - Number(nearbyIds.has(a.id)))
    .slice(0, 8);
  return (
    <Modal
      title={confirming ? 'Confirm billboard move' : 'Move to another billboard'}
      onClose={onCancel}
      width={520}
      footer={<>
        <Btn onClick={confirming ? () => setConfirming(false) : onCancel}>{confirming ? 'Back' : 'Cancel'}</Btn>
        {confirming
          ? <Btn variant="primary" disabled={!selected} onClick={() => selected && onConfirm(selected.code)}><MoveRight size={14} /> Move photo</Btn>
          : <Btn variant="primary" disabled={!selected || selected.id === currentId} onClick={() => setConfirming(true)}>Continue</Btn>}
      </>}
    >
      <p style={{ margin: '0 0 12px', color: 'var(--muted-foreground)' }}>Only if this photo actually belongs to a different, already registered billboard.</p>
      {confirming ? (
        <div style={{ ...cardStyle, padding: '12px 14px' }}>
          Move this photo to <strong>{selected?.code}</strong> · {selected?.attrs.street}?
        </div>
      ) : <>
        <input value={query} onChange={e => setQuery(e.target.value)} autoFocus placeholder="Search billboard code or name" style={{ ...inputStyle, marginBottom: '10px' }} />
        <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {candidates.map(b => {
            const close = nearby.find(n => n.billboard.id === b.id);
            return <button key={b.id} onClick={() => setQuery(b.code)} style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', gap: '12px', textAlign: 'left', minHeight: '42px', padding: '7px 10px', border: `1px solid ${selected?.id === b.id ? PRIMARY : 'var(--border)'}`, borderRadius: 'var(--radius)', background: selected?.id === b.id ? PRIMARY_TINT : 'var(--card)', color: 'var(--foreground)', cursor: 'pointer', fontFamily: FONT }}>
              <span><strong style={{ fontFamily: 'monospace' }}>{b.code}</strong> · {b.attrs.street}</span>
              <span style={{ fontSize: '11px', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>{close ? `${Math.round(close.distance)} m away` : b.city}</span>
            </button>;
          })}
          {candidates.length === 0 && <div style={{ padding: '12px', color: 'var(--muted-foreground)' }}>No matching billboards.</div>}
        </div>
        {nearby.filter(n => nearbyIds.has(n.billboard.id)).length > 0 && <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginTop: '10px' }}>Nearby billboards within 50 m are listed first.</div>}
      </>}
    </Modal>
  );
}

// ─── Detail body ──────────────────────────────────────────────────────────────

function DetailBody({ adId, mode, city, showToast }: { adId: string; mode: Mode; city: string; showToast: ShowToast }) {
  const navigate = useNavigate();
  const [, setParams] = useSearchParams();
  const s = useSurveyState();
  const now = useNow(1000);
  const ad = getAd(s, adId)!;
  const billboard = getBillboard(s, ad.billboardId)!;

  // Snapshot of what this QC opened — never re-read from the live store.
  const opened = useRef({
    version: ad.version,
    content: { ...(mode === 'qc' ? ad.surveyor.input : (ad.result ?? ad.surveyor.input)) } as AdContent,
    attrs: { ...billboard.attrs } as PointAttrs,
  }).current;

  const [blocked, setBlocked] = useState<string | null>(null);
  const [content, setContent] = useState<AdContent>(opened.content);
  const [attrs, setAttrs] = useState<PointAttrs>(opened.attrs);
  const [moveTo, setMoveTo] = useState('');
  const [reason, setReason] = useState('');
  const [overturn, setOverturn] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [attributesOpen, setAttributesOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState<Extract<SaveResult, { ok: false }> | null>(null);
  const [lightbox, setLightbox] = useState<{ photo: SurveyPhoto; caption: string } | null>(null);

  const history = useMemo(() => adsOfBillboard(s, ad.billboardId).slice().reverse(), [s, ad.billboardId]);
  const lastVerified = prevVerified(s, ad);
  const [compareId, setCompareId] = useState<string | null>(
    () => history.filter(a => a.id !== ad.id && a.month < ad.month && a.state === 'approved' && a.photo).at(-1)?.id ?? null,
  );
  const compareAd = compareId ? getAd(s, compareId) ?? null : null;

  // ── Claim lifecycle ──
  const locking = mode === 'qc' || mode === 'edit';
  useEffect(() => {
    if (!locking) return;
    if (mode === 'qc' && ad.state !== 'pending') {
      setBlocked(`This ad was already checked by ${ad.qc?.by ?? 'another QC'}.`);
      return;
    }
    const res = claimAd(adId);
    if (!res.ok) setBlocked(`${res.by} has this ad open. You can't edit it right now.`);
    return () => releaseClaim(adId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adId, mode]);

  const claimMine = ad.claim?.by === ME && ad.claim.expiresAt > now;
  const claimLost = locking && !blocked && !claimMine;
  const readOnly = mode === 'view' || !!blocked;

  const lastTouch = useRef(0);
  const onActivity = () => {
    if (!locking || Date.now() - lastTouch.current < 1000) return;
    lastTouch.current = Date.now();
    touchClaim(adId);
  };

  // ── Derived form state ──
  const prevContent = compareAd?.result ?? null;
  const brandMissing = content.status === 'Filled' && !content.brand;
  const target = moveTo.trim() ? billboardByCode(moveTo) : undefined;
  const moveError = !moveTo.trim() ? null
    : !target ? 'No billboard registered with this code.'
    : target.id === billboard.id ? 'This photo is already on that billboard.'
    : null;
  const corrections = diffContent(ad.surveyor.input, content);
  const editDiffs = useMemo(() => {
    const d = [...diffContent(opened.content, content), ...diffAttrs(opened.attrs, attrs)];
    if (overturn) d.unshift({ field: 'QC decision', from: 'Rejected', to: 'Approved' });
    return d;
  }, [opened, content, attrs, overturn]);

  const nearby = s.billboards.filter(b => b.id !== billboard.id && distanceM(b.lat, b.lng, billboard.lat, billboard.lng) <= MAX_DRIFT_M);
  const attrsFilled = [attrs.street, attrs.mediaOwner, attrs.mediaType, attrs.width && attrs.height ? 'size' : '', attrs.orientation, attrs.lighting, 'nearby']
    .filter(Boolean).length;

  const setStatus = (status: AdStatus) => setContent(c => ({
    ...c, status,
    brand: status === 'Filled' ? c.brand : '',
    subBrand: status === 'Filled' ? c.subBrand : '',
    cp: status === 'Space available' ? c.cp : '',
  }));

  // ── Actions ──
  const goQueue = (toast?: { type: 'success' | 'info'; title: string; message?: string }) => navigate(BASE, { state: toast ? { toast } : null });
  const goNext = (doneMsg: string) => {
    const next = claimNext(city);
    if (next) {
      showToast('success', doneMsg);
      navigate(`${BASE}/${next}?mode=qc${city ? `&city=${encodeURIComponent(city)}` : ''}`);
    } else {
      goQueue({ type: 'success', title: doneMsg, message: 'The manual queue is empty — nice work.' });
    }
  };

  const handleSaveQc = () => {
    const res = saveQc(adId, opened.version, { content, attrs, moveTo });
    if (!res.ok) { setSaving(false); return setConflict(res); }
    goNext(`${billboard.code} saved`);
  };

  const saveWithFeedback = () => {
    if (qcSaveDisabled || saving) return;
    setSaving(true);
    window.setTimeout(() => handleSaveQc(), 180);
  };

  const handleReject = (r: string) => {
    setRejectOpen(false);
    const res = rejectAd(adId, opened.version, r);
    if (!res.ok) return setConflict(res);
    goNext(`${billboard.code} rejected`);
  };

  const handleSaveEdit = () => {
    const res = saveEdit(adId, opened.version, { content, attrs, reason: reason.trim(), approve: overturn });
    if (!res.ok) return setConflict(res);
    showToast('success', 'QC result updated', `${editDiffs.length} change${editDiffs.length === 1 ? '' : 's'} recorded.`);
    setParams({ mode: 'view' });
  };

  const startEdit = () => {
    const res = claimAd(adId);
    if (!res.ok) return showToast('warning', 'Ad is locked', `${res.by} has this ad open right now.`);
    setParams({ mode: 'edit' });
  };

  const reclaim = () => {
    const res = claimAd(adId);
    if (!res.ok) showToast('warning', 'Could not reclaim', `${res.by} has opened this ad.`);
  };

  // ── Header bits ──
  const kind = changeKind(ad, lastVerified);
  const waiting = waitingDays(ad, now);
  const curOffset = photoOffset(ad.photo, billboard);
  const cmpOffset = photoOffset(compareAd?.photo, billboard);
  const betweenPhotos = ad.photo?.lat != null && compareAd?.photo?.lat != null
    ? distanceM(ad.photo.lat, ad.photo.lng!, compareAd.photo.lat, compareAd.photo.lng!) : null;
  const lastEditAt = ad.changes.at(-1)?.at ?? ad.qc?.at ?? null;

  const qcSaveDisabled = readOnly || brandMissing || !!moveError;
  const editSaveDisabled = readOnly || brandMissing || editDiffs.length === 0 || !reason.trim();

  const brandOptions = BRANDS.map(b => b.name);
  const subBrandOptions = BRANDS.find(b => b.name === content.brand)?.subBrands ?? [];
  const showCp = content.status === 'Space available' || prevContent?.status === 'Space available';

  const nextPendingAd = manualQueue(s, city, now).find(r => r.ad.id !== adId)?.ad;
  useEffect(() => {
    if (!nextPendingAd?.photo) return;
    const image = new Image();
    image.src = photoSrc(nextPendingAd.photo);
  }, [nextPendingAd?.id]);

  useEffect(() => {
    if (mode !== 'qc' || readOnly) return;
    const statusField = document.querySelector<HTMLSelectElement>('[data-qc-status]');
    statusField?.focus();
  }, [adId, mode, readOnly]);

  useEffect(() => {
    setAttributesOpen(attrsFilled < 7);
  }, [attrsFilled]);

  useEffect(() => {
    if (mode !== 'qc') return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.matches('textarea, [contenteditable="true"]')) return;
      if (e.key === 'Enter') { e.preventDefault(); saveWithFeedback(); return; }
      if (target?.matches('input')) return;
      if (readOnly) return;
      if (e.key.toLowerCase() === 'r') { e.preventDefault(); setRejectOpen(true); }
      if (e.key === '1') { e.preventDefault(); setStatus('Filled'); }
      if (e.key === '2') { e.preventDefault(); setStatus('Space available'); }
      if (e.key === '3') { e.preventDefault(); setStatus('Empty'); }
      if (e.key === '4') { e.preventDefault(); setStatus('No longer exists'); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (mode === 'qc') return (
    <QcReviewLayout
      ad={ad} billboard={billboard} history={history} compareAd={compareAd} compareId={compareId}
      setCompareId={setCompareId} content={content} setContent={setContent} setStatus={setStatus}
      prevContent={prevContent} attrs={attrs} setAttrs={setAttrs} attrsFilled={attrsFilled}
      attributesOpen={attributesOpen} setAttributesOpen={setAttributesOpen} nearby={nearby}
      curOffset={curOffset} cmpOffset={cmpOffset} betweenPhotos={betweenPhotos} lastEditAt={lastEditAt}
      claimMine={claimMine} claimLost={claimLost} claim={ad.claim} now={now} doneToday={s.doneToday}
      blocked={blocked} kind={kind} waiting={waiting} brandMissing={brandMissing} moveError={moveError}
      readOnly={readOnly} saving={saving} onSave={saveWithFeedback}
      onPause={() => { releaseClaim(adId); goQueue(); }}
      onLightbox={setLightbox} onMove={() => setMoveDialogOpen(true)} onReclaim={reclaim}
      onActivity={onActivity} showCp={showCp} onView={() => setParams({ mode: 'view' })}
      corrections={corrections} billboards={s.billboards} moveDialogOpen={moveDialogOpen}
      setMoveDialogOpen={setMoveDialogOpen} onConfirmMove={setMoveTo} rejectDialogOpen={rejectOpen}
      setRejectDialogOpen={setRejectOpen} onConfirmReject={handleReject} conflict={conflict}
      moveTo={moveTo} moveTarget={target}
      onClearConflict={() => setConflict(null)} onBackQueue={() => { setConflict(null); goQueue(); }}
      onTakeNext={() => { setConflict(null); goNext('Moved on'); }} />
  );

  return (
    <div onClickCapture={onActivity} onKeyDownCapture={onActivity} style={{ paddingBottom: '88px' }}>
      {/* ── Header ── */}
      <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginBottom: '8px' }}>QC / Billboard Survey / {billboard.code}</div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '16px' }}>
        <div style={{ minWidth: 0 }}>
          <button
            onClick={() => { releaseClaim(adId); goQueue(); }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', border: 'none', background: 'none', padding: 0, cursor: 'pointer', color: PRIMARY, fontFamily: FONT, fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}
          >
            <ArrowLeft size={14} /> {mode === 'qc' ? 'Pause & return to queue' : 'Back to Billboard Survey'}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 600, margin: 0, lineHeight: 1.3 }}>{billboard.attrs.street}</h1>
            {ad.state === 'pending' && kind === 'status' && <Badge tone="accent">Status changed</Badge>}
            {ad.state === 'pending' && kind === 'brand' && <Badge tone="accent">Brand changed</Badge>}
            {ad.state === 'pending' && waiting > 0 && <Badge tone={waiting > 3 ? 'red' : 'neutral'}>Waiting {waiting} day{waiting === 1 ? '' : 's'}</Badge>}
            {ad.state === 'approved' && <Badge tone="green"><CheckCircle2 size={11} /> Checked</Badge>}
            {ad.state === 'rejected' && <Badge tone="red"><XCircle size={11} /> Rejected</Badge>}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--muted-foreground)', marginTop: '4px' }}>
            <span style={{ fontFamily: 'monospace' }}>{billboard.code}</span> · {billboard.city} · {billboard.subdistrict} · {billboard.attrs.mediaType || '—'} · {billboard.route} · {monthLabel(ad.month)}
          </div>
        </div>

        {mode === 'qc' && !blocked && (
          <div style={{ ...cardStyle, padding: '10px 14px', flexShrink: 0, maxWidth: '360px', backgroundColor: claimMine ? PRIMARY_TINT : AMBER_TINT, borderColor: claimMine ? 'PRIMARY_BORDER' : 'AMBER_BORDER' }}>
            {claimMine ? (
              <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: PRIMARY }}>
                <Lock size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontWeight: 600 }}>Claimed for you · other QCs can't open it</div>
                  <div>Auto-release in <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{fmtCountdown(ad.claim!.expiresAt - now)}</span></div>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '12px', color: AMBER, fontWeight: 600 }}>Claim released</div>
            )}
            <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginTop: '6px', paddingTop: '6px', borderTop: `1px solid ${PRIMARY_BORDER}` }}>
              You've completed today: <strong style={{ color: 'var(--foreground)' }}>{s.doneToday}</strong>
            </div>
          </div>
        )}
      </div>

      {/* ── Banners ── */}
      {blocked && (
        <Banner tone="amber" icon={Lock}>
          {blocked}{' '}
          {ad.state !== 'pending' && mode === 'qc' && (
            <button onClick={() => setParams({ mode: 'view' })} style={linkBtn}>Open read-only</button>
          )}
        </Banner>
      )}
      {claimLost && (
        <Banner tone="amber" icon={AlertTriangle}>
          Your claim was released after 15 minutes without activity and the ad went back to the queue. Saving may conflict with another QC.{' '}
          <button onClick={reclaim} style={linkBtn}>Reclaim</button>
        </Banner>
      )}
      {mode === 'edit' && !blocked && (
        <Banner tone="accent" icon={Pencil}>
          <strong>Edit QC result mode</strong> · every change is recorded. This ad is locked against other QCs while you edit.
        </Banner>
      )}

      {/* ── Photo history ── */}
      <Card title="Photo history" right={<span style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>Click a month to compare</span>} style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '2px' }}>
          {history.filter(h => h.photo).map(h => {
            const isCur = h.id === ad.id;
            const isCmp = h.id === compareId;
            return (
              <button
                key={h.id}
                onClick={() => isCur ? setLightbox({ photo: h.photo!, caption: `${billboard.code} · ${monthLabel(h.month)}` }) : setCompareId(h.id)}
                style={{ flexShrink: 0, width: '150px', padding: '8px', borderRadius: 'var(--radius)', cursor: 'pointer', textAlign: 'left', fontFamily: FONT, backgroundColor: isCur ? PRIMARY_TINT : 'var(--card)', border: `2px solid ${isCur ? PRIMARY : isCmp ? PRIMARY : 'var(--border)'}` }}
              >
                <img src={photoSrc(h.photo!)} alt={h.month} style={{ width: '100%', height: '84px', objectFit: 'cover', borderRadius: '4px', display: 'block' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)' }}>{monthLabel(h.month)}</span>
                  {isCur ? <Badge tone="accent">This</Badge> : isCmp ? <Badge>Compare</Badge> : null}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {h.state === 'pending' ? 'Not checked' : h.state === 'rejected' ? 'Rejected' : contentSummary(h.result)}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* ── Photo comparison ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <PhotoPanel title={compareAd ? `Comparison · ${monthLabel(compareAd.month)}` : 'Comparison'} ad={compareAd} code={billboard.code} onOpen={setLightbox} empty="No verified photo from an earlier month." />
        <PhotoPanel title={`${ad.month === CYCLE.month ? 'This cycle' : 'Reviewed month'} · ${monthLabel(ad.month)}`} ad={ad} code={billboard.code} onOpen={setLightbox} highlight empty="No photo uploaded." />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '16px', alignItems: 'start' }}>
        {/* ── Left column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Card title={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><MapPin size={14} /> Photo position</span>}>
            {ad.photo && curOffset == null && (
              <div style={{ fontSize: '12px', color: AMBER, backgroundColor: AMBER_TINT, borderRadius: 'var(--radius)', padding: '8px 10px', marginBottom: '10px', display: 'flex', gap: '6px' }}>
                <Info size={14} style={{ flexShrink: 0 }} /> This month's photo has no GPS data, so its distance from the point can't be calculated.
              </div>
            )}
            <div style={{ height: '260px', borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)', position: 'relative', zIndex: 0 }}>
              <PositionMap
                billboard={billboard}
                nearby={nearby}
                photos={[
                  ...(compareAd?.photo ? [{ label: `${monthShort(compareAd.month)} photo`, color: AMBER, lat: compareAd.photo.lat, lng: compareAd.photo.lng, heading: compareAd.photo.heading }] : []),
                  ...(ad.photo ? [{ label: `${monthShort(ad.month)} photo`, color: PRIMARY, lat: ad.photo.lat, lng: ad.photo.lng, heading: ad.photo.heading }] : []),
                ]}
              />
            </div>
            <div style={{ display: 'flex', gap: '14px', fontSize: '11px', color: 'var(--muted-foreground)', margin: '8px 0 10px', flexWrap: 'wrap' }}>
              <Legend color={PRIMARY} square>Billboard point</Legend>
              <Legend color={PRIMARY}>{monthShort(ad.month)} photo</Legend>
              {compareAd && <Legend color={AMBER}>{monthShort(compareAd.month)} photo</Legend>}
              <Legend color={GRAY}>Other points within 50 m</Legend>
            </div>
            <KV k="Distance between photos" v={betweenPhotos != null ? `${Math.round(betweenPhotos)} m` : 'Can\'t be calculated'} />
            <KV k={`${monthShort(ad.month)} photo from point`} v={curOffset ? <span style={{ color: curOffset.d > MAX_DRIFT_M ? RED : undefined }}>{Math.round(curOffset.d)} m {curOffset.dir}</span> : 'GPS not captured'} />
            {compareAd && <KV k={`${monthShort(compareAd.month)} photo from point`} v={cmpOffset ? `${Math.round(cmpOffset.d)} m ${cmpOffset.dir}` : 'GPS not captured'} />}
            <KV k="Point coordinates" v={`${billboard.lat.toFixed(5)}, ${billboard.lng.toFixed(5)}`} />
            <KV k="Photo taken" v={ad.photo ? fmtDateTime(ad.photo.takenAt) : '—'} />
            <KV k="Photo uploaded" v={ad.photo ? fmtDateTime(ad.photo.uploadedAt) : '—'} />
            <KV k="QC edited" v={lastEditAt ? fmtDateTime(lastEditAt) : '—'} />
          </Card>

          <Card title="Point attributes" right={<Badge tone={attrsFilled === 7 ? 'green' : 'neutral'}>{attrsFilled} of 7 filled</Badge>}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Field label="Street name" span>
                <input value={attrs.street} disabled={readOnly} onChange={e => setAttrs(a => ({ ...a, street: e.target.value }))} style={inputStyle} />
              </Field>
              <Field label="Media owner">
                <input value={attrs.mediaOwner} disabled={readOnly} onChange={e => setAttrs(a => ({ ...a, mediaOwner: e.target.value }))} placeholder="Not filled" style={inputStyle} />
              </Field>
              <Field label="Media type">
                <Select value={attrs.mediaType} options={['Conventional', 'LED'] as const} disabled={readOnly} placeholder="Select" onChange={v => setAttrs(a => ({ ...a, mediaType: v }))} />
              </Field>
              <Field label="Size (W × H, m)">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input type="number" min={0} value={attrs.width ?? ''} disabled={readOnly} onChange={e => setAttrs(a => ({ ...a, width: e.target.value === '' ? null : Number(e.target.value) }))} style={inputStyle} />
                  <span style={{ color: 'var(--muted-foreground)' }}>×</span>
                  <input type="number" min={0} value={attrs.height ?? ''} disabled={readOnly} onChange={e => setAttrs(a => ({ ...a, height: e.target.value === '' ? null : Number(e.target.value) }))} style={inputStyle} />
                </div>
              </Field>
              <Field label="Orientation">
                <Select value={attrs.orientation} options={['Horizontal', 'Vertical'] as const} disabled={readOnly} placeholder="Select" onChange={v => setAttrs(a => ({ ...a, orientation: v }))} />
              </Field>
              <Field label="Lighting">
                <Select value={attrs.lighting} options={['Frontlit', 'Backlit', 'No lighting'] as const} disabled={readOnly} placeholder="Select" onChange={v => setAttrs(a => ({ ...a, lighting: v }))} />
              </Field>
              <Field label="Other billboards within 50 m">
                <div style={{ fontSize: '13px', minHeight: '36px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <strong>{nearby.length}</strong>
                  {nearby.map(n => <span key={n.id} style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--muted-foreground)' }}>{n.code}</span>)}
                </div>
              </Field>
            </div>
          </Card>

          {mode === 'qc' && (
            <Card title="Move to another billboard" right={<span style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>Optional</span>}>
              <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginBottom: '8px' }}>
                Only if this photo actually belongs to a different, already registered billboard.
              </div>
              <input value={moveTo} disabled={readOnly} onChange={e => setMoveTo(e.target.value)} placeholder="Destination billboard code, e.g. JKS-0107" style={{ ...inputStyle, borderColor: moveError ? RED : 'var(--border)', fontFamily: 'monospace' }} />
              {moveError && <div style={{ fontSize: '12px', color: RED, marginTop: '6px' }}>{moveError}</div>}
              {target && !moveError && <div style={{ fontSize: '12px', color: GREEN, marginTop: '6px' }}>Will move to {target.code} · {target.attrs.street}</div>}
            </Card>
          )}
        </div>

        {/* ── Right column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Card title="Ad content">
            <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 1fr', gap: '10px 12px', alignItems: 'center', fontSize: '13px' }}>
              <span />
              <span style={labelStyle}>{compareAd ? `${monthLabel(compareAd.month)} (verified)` : 'Previous'}</span>
              <span style={{ ...labelStyle, color: PRIMARY }}>{monthLabel(ad.month)}{readOnly ? '' : ' · editable'}</span>

              <RowLabel>Status</RowLabel>
              <Prev>{prevContent?.status}</Prev>
              <Select value={content.status} options={AD_STATUSES} disabled={readOnly} onChange={setStatus} />

              <RowLabel>Brand</RowLabel>
              <Prev>{prevContent?.brand}</Prev>
              <div>
                <Select value={content.brand} options={brandOptions} disabled={readOnly || content.status !== 'Filled'} placeholder={content.status === 'Filled' ? 'Select brand' : '—'} onChange={v => setContent(c => ({ ...c, brand: v, subBrand: '' }))} />
                {brandMissing && <div style={{ fontSize: '12px', color: RED, marginTop: '4px' }}>Brand is required when status is Filled.</div>}
              </div>

              <RowLabel>Sub-brand</RowLabel>
              <Prev>{prevContent?.subBrand}</Prev>
              <div>
                <input list="bs-subbrands" value={content.subBrand} disabled={readOnly || content.status !== 'Filled'} onChange={e => setContent(c => ({ ...c, subBrand: e.target.value }))} placeholder={content.status === 'Filled' ? 'Optional' : '—'} style={inputStyle} />
                <datalist id="bs-subbrands">{subBrandOptions.map(o => <option key={o} value={o} />)}</datalist>
              </div>

              {showCp && <>
                <RowLabel>CP number</RowLabel>
                <Prev mono>{prevContent?.cp}</Prev>
                <input value={content.cp} disabled={readOnly || content.status !== 'Space available'} onChange={e => setContent(c => ({ ...c, cp: e.target.value }))} placeholder={content.status === 'Space available' ? '08xx-xxxx-xxxx' : '—'} style={{ ...inputStyle, fontFamily: 'monospace' }} />
              </>}

              <RowLabel>Industry</RowLabel>
              <Prev>{prevContent ? industryOf(prevContent.brand) : ''}</Prev>
              <span style={{ color: content.brand ? 'var(--foreground)' : 'var(--muted-foreground)' }}>{industryOf(content.brand) || '—'} <span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>(from brand)</span></span>

              <RowLabel>Ad copy</RowLabel>
              <Prev>{prevContent?.adCopy}</Prev>
              {mode === 'edit' && !readOnly ? (
                <textarea value={content.adCopy} onChange={e => setContent(c => ({ ...c, adCopy: e.target.value }))} style={{ ...inputStyle, height: '60px', padding: '8px 10px', resize: 'vertical' }} />
              ) : (
                <span style={{ fontSize: '12px', padding: '8px 10px', borderRadius: 'var(--radius)', backgroundColor: 'var(--muted)', color: content.adCopy ? 'var(--foreground)' : 'var(--muted-foreground)' }}>
                  {content.adCopy || 'No text read from photo'}
                  <span style={{ display: 'block', fontSize: '10px', color: 'var(--muted-foreground)', marginTop: '2px' }}>OCR read-out</span>
                </span>
              )}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
              Surveyor input by <strong>{ad.surveyor.name}</strong> ({contentSummary(ad.surveyor.input)}).
              {compareAd?.qc && <> {monthLabel(compareAd.month)} verified by <strong>{compareAd.qc.by}</strong>{compareAd.qc.method === 'auto' ? ' (auto rules)' : ''}.</>}
            </div>
          </Card>

          {/* QC corrections vs the surveyor's input */}
          {mode === 'qc' && !readOnly && corrections.length > 0 && (
            <Card title="QC corrections" right={<span style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>Recorded when saved</span>} style={{ borderColor: 'PRIMARY_BORDER', backgroundColor: PRIMARY_TINT }}>
              <DiffList diffs={corrections} />
            </Card>
          )}
          {mode !== 'qc' && ad.corrections.length > 0 && (
            <Card title="QC corrections to surveyor input">
              <DiffList diffs={ad.corrections} />
            </Card>
          )}

          {mode !== 'qc' && (
            <Card title={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><History size={14} /> QC history</span>}>
              {!ad.qc ? (
                <div style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>Not checked yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <HistoryItem who={ad.qc.by} at={ad.qc.at}>
                    {ad.state === 'rejected' && ad.changes.every(c => c.field !== 'QC decision')
                      ? <>Rejected · {ad.rejectReason}</>
                      : ad.qc.method === 'auto' ? 'Approved via auto rules (bulk approval)' : 'Checked and approved'}
                  </HistoryItem>
                  {groupChanges(ad).map(g => (
                    <HistoryItem key={g.at} who={g.by} at={g.at}>
                      <DiffList diffs={g.items} />
                      <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginTop: '4px' }}>Reason: {g.reason}</div>
                    </HistoryItem>
                  ))}
                </div>
              )}
            </Card>
          )}

          {mode === 'edit' && !readOnly && (
            <>
              {ad.state === 'rejected' && (
                <label style={{ ...cardStyle, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={overturn} onChange={e => setOverturn(e.target.checked)} style={{ accentColor: PRIMARY }} />
                  Overturn rejection and approve this ad
                </label>
              )}
              <Card title="Changes to be recorded" style={{ borderColor: editDiffs.length ? 'PRIMARY_BORDER' : undefined }}>
                {editDiffs.length ? <DiffList diffs={editDiffs} /> : <div style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>No changes yet.</div>}
              </Card>
              <Card title={<>Reason for change <span style={{ color: RED }}>*</span></>}>
                <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Why is this result being changed?" style={{ ...inputStyle, height: '72px', padding: '8px 10px', resize: 'vertical' }} />
                {!reason.trim() && editDiffs.length > 0 && <div style={{ fontSize: '12px', color: RED, marginTop: '4px' }}>A reason is required to save.</div>}
              </Card>
            </>
          )}
        </div>
      </div>

      {/* ── Sticky footer ── */}
      <div style={{ position: 'sticky', bottom: 0, marginTop: '20px', padding: '12px 16px', ...cardStyle, boxShadow: '0 -4px 16px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', zIndex: 5 }}>
        <div style={{ fontSize: '12px', color: brandMissing || moveError ? RED : 'var(--muted-foreground)' }}>
          {mode === 'qc' && (brandMissing || moveError ? 'Resolve the fields marked in red before saving.' : 'Saving releases this ad and claims the next one in the queue.')}
          {mode === 'edit' && (editDiffs.length === 0 ? 'Change at least one field to save.' : !reason.trim() ? 'Add a reason for the change.' : `${editDiffs.length} change${editDiffs.length === 1 ? '' : 's'} ready to record.`)}
          {mode === 'view' && (ad.state === 'pending' ? 'This ad has not been checked yet.' : 'Read-only. Edits are logged with a reason.')}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {mode === 'qc' && <>
            <Btn variant="danger" disabled={readOnly} onClick={() => setRejectOpen(true)}><XCircle size={14} /> Reject</Btn>
            <Btn variant="primary" disabled={qcSaveDisabled} onClick={handleSaveQc}><Save size={14} /> Save & take next</Btn>
          </>}
          {mode === 'edit' && <>
            <Btn onClick={() => { releaseClaim(adId); setParams({ mode: 'view' }); }}>Cancel</Btn>
            <Btn variant="primary" disabled={editSaveDisabled} onClick={handleSaveEdit}><Save size={14} /> Save changes</Btn>
          </>}
          {mode === 'view' && (ad.state === 'pending'
            ? <Btn variant="primary" onClick={() => { const r = claimAd(adId); if (r.ok) setParams({ mode: 'qc' }); else showToast('warning', 'Ad is locked', `${r.by} has this ad open right now.`); }}>Check now</Btn>
            : <Btn variant="primary" onClick={startEdit}><Pencil size={14} /> Edit QC result</Btn>)}
        </div>
      </div>

      {rejectOpen && <RejectDialog onCancel={() => setRejectOpen(false)} onConfirm={handleReject} />}
      {conflict && (
        <Modal
          title={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><AlertTriangle size={18} style={{ color: AMBER }} /> {conflict.saved ? 'Already saved by another QC' : 'Opened by another QC'}</span>}
          footer={<>
            <Btn onClick={() => goQueue()}>Back to queue</Btn>
            <Btn variant="primary" onClick={() => { setConflict(null); goNext('Moved on'); }}>Take next ad</Btn>
          </>}
        >
          <p style={{ margin: '0 0 8px' }}>
            <strong>{billboard.code} · {billboard.attrs.street}</strong>{' '}
            {conflict.saved ? <>was already saved by <strong>{conflict.by}</strong> a few seconds ago.</> : <>is now open by <strong>{conflict.by}</strong>.</>}
          </p>
          <p style={{ margin: '0 0 8px' }}>Your decision has <strong>not</strong> been saved, to avoid overwriting theirs.</p>
          <p style={{ margin: 0, color: 'var(--muted-foreground)' }}>If their result is wrong, you can still correct it later via billboard search → Open → Edit QC result.</p>
        </Modal>
      )}
      {lightbox && <Lightbox photo={lightbox.photo} caption={lightbox.caption} onClose={() => setLightbox(null)} />}
    </div>
  );
}

// ─── Helpers / leaf components ────────────────────────────────────────────────

type QcReviewProps = {
  ad: SurveyAd; billboard: Billboard; history: SurveyAd[]; compareAd: SurveyAd | null; compareId: string | null;
  setCompareId: (id: string) => void; content: AdContent; setContent: React.Dispatch<React.SetStateAction<AdContent>>;
  setStatus: (status: AdStatus) => void; prevContent: AdContent | null; attrs: PointAttrs;
  setAttrs: React.Dispatch<React.SetStateAction<PointAttrs>>; attrsFilled: number; attributesOpen: boolean;
  setAttributesOpen: (open: boolean) => void; nearby: Billboard[];
  curOffset: { d: number; dir: string } | null; cmpOffset: { d: number; dir: string } | null;
  betweenPhotos: number | null; lastEditAt: number | null; claimMine: boolean; claimLost: boolean;
  claim: SurveyAd['claim']; now: number; doneToday: number; blocked: string | null;
  kind: ReturnType<typeof changeKind>; waiting: number; brandMissing: boolean; moveError: string | null;
  readOnly: boolean; saving: boolean; onSave: () => void; onPause: () => void;
  onLightbox: (v: { photo: SurveyPhoto; caption: string }) => void; onMove: () => void; onReclaim: () => void;
  onActivity: () => void; showCp: boolean; onView: () => void;
  corrections: FieldDiff[];
  billboards: Billboard[]; moveDialogOpen: boolean; setMoveDialogOpen: (open: boolean) => void;
  onConfirmMove: (code: string) => void; rejectDialogOpen: boolean; setRejectDialogOpen: (open: boolean) => void;
  moveTo: string; moveTarget: Billboard | undefined;
  onConfirmReject: (reason: string) => void; conflict: Extract<SaveResult, { ok: false }> | null;
  onClearConflict: () => void; onBackQueue: () => void; onTakeNext: () => void;
}

function QcReviewLayout(p: QcReviewProps) {
  const {
    ad, billboard, history, compareAd, compareId, setCompareId, content, setContent, setStatus, prevContent,
    attrs, setAttrs, attrsFilled, attributesOpen, setAttributesOpen, nearby, curOffset, cmpOffset, betweenPhotos,
    lastEditAt, claimMine, claimLost, claim, now, doneToday, blocked, kind, waiting, brandMissing, moveError,
    readOnly, saving, onSave, onPause, onLightbox, onMove, onReclaim, onActivity, showCp, onView,
    corrections, billboards, moveDialogOpen, setMoveDialogOpen, onConfirmMove, rejectDialogOpen, setRejectDialogOpen,
    onConfirmReject, conflict, onClearConflict, onBackQueue, onTakeNext, moveTo, moveTarget,
  } = p;
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [drag, setDrag] = useState<{ pointer: number; x: number; y: number; panX: number; panY: number } | null>(null);
  const [moveOpen, setMoveOpen] = useState(false);
  const [rejectChoice, setRejectChoice] = useState(DETAIL_REJECT_REASONS[0]);
  const [rejectNote, setRejectNote] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const remain = claim?.expiresAt ? claim.expiresAt - now : 0;
  const currentPhoto = ad.photo;
  const headingDiff = currentPhoto?.heading != null && compareAd?.photo?.heading != null
    ? Math.abs(((currentPhoto.heading - compareAd.photo.heading + 540) % 360) - 180) : null;
  const noLongerCheckApplies = content.status === 'No longer exists';
  const noLongerPass = betweenPhotos != null && headingDiff != null && betweenPhotos <= 10 && headingDiff <= 30;
  const brandOptions = BRANDS.map(b => b.name);
  const subBrandOptions = BRANDS.find(b => b.name === content.brand)?.subBrands ?? [];
  const selectedCompareId = compareId ?? '';
  const nearbyTargets = nearby.map(b => ({ billboard: b, distance: distanceM(billboard.lat, billboard.lng, b.lat, b.lng) })).sort((a, b) => a.distance - b.distance);

  useEffect(() => {
    setZoom(1); setPan({ x: 0, y: 0 });
  }, [selectedCompareId, ad.id]);

  const updateStatus = (value: string) => setStatus(value as AdStatus);
  const openLightbox = (photo: SurveyPhoto | null | undefined, caption: string) => {
    if (photo) onLightbox({ photo, caption });
  };
  const startPan = (e: React.PointerEvent<HTMLDivElement>) => {
    if (zoom === 1) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ pointer: e.pointerId, x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y });
  };
  const movePan = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag || drag.pointer !== e.pointerId) return;
    setPan({ x: drag.panX + e.clientX - drag.x, y: drag.panY + e.clientY - drag.y });
  };
  const endPan = () => setDrag(null);
  const wheelZoom = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    setZoom(z => Math.min(3, Math.max(1, z + (e.deltaY < 0 ? 0.15 : -0.15))));
  };
  const resetZoom = () => { setZoom(1); setPan({ x: 0, y: 0 }); };
  const changeField = (key: keyof AdContent, value: string) => setContent(c => ({ ...c, [key]: value }));

  const compareImage = (item: SurveyAd | null, label: string) => (
    <div
      onPointerDown={startPan} onPointerMove={movePan} onPointerUp={endPan} onPointerCancel={endPan} onWheel={wheelZoom}
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', cursor: zoom > 1 ? (drag ? 'grabbing' : 'grab') : 'zoom-in', touchAction: 'none' }}
    >
      {item?.photo ? <img
        src={photoSrc(item.photo)} alt={label} onDoubleClick={() => openLightbox(item.photo, `${billboard.code} · ${monthLabel(item.month)}`)}
        style={{ width: '100%', height: '100%', objectFit: 'contain', transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: 'center', userSelect: 'none', pointerEvents: 'none' }}
      /> : <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: 'white', fontSize: '13px' }}>No photo available</div>}
    </div>
  );

  const suggestionMeta = (value: string, confidence: string, source: 'Auto' | 'Surveyor' | 'QC' = 'Surveyor') => value ? (
    <span style={{ display: 'inline-flex', gap: '4px', alignItems: 'center', marginTop: '5px', flexWrap: 'wrap' }}>
      <Badge tone="green">{confidence}%</Badge><Badge>{source}</Badge>
    </span>
  ) : null;

  return (
    <div className="qc-redesign" onClickCapture={onActivity} onKeyDownCapture={onActivity}>
      <style>{`
        .qc-redesign { font-family:${FONT}; padding-bottom:16px; }
        .qc-two-col { display:grid; grid-template-columns:minmax(640px,1fr) 420px; gap:20px; align-items:start; }
        .qc-evidence { min-width:0; display:flex; flex-direction:column; gap:12px; }
        .qc-decision { position:sticky; top:16px; max-height:calc(100vh - 32px); min-height:500px; display:flex; flex-direction:column; overflow:hidden; }
        .qc-decision-scroll { overflow-y:auto; min-height:0; flex:1; padding:14px; }
        .qc-decision-footer { flex-shrink:0; padding:10px 12px; border-top:1px solid var(--border); background:var(--card); box-shadow:0 -5px 14px rgba(15,23,42,.06); }
        .qc-photo-strip { display:flex; align-items:stretch; gap:8px; overflow-x:auto; }
        .qc-history-item { flex:0 0 118px; padding:5px; border-radius:var(--radius); cursor:pointer; text-align:left; font-family:${FONT}; background:var(--card); }
        .qc-history-item img { width:100%; height:48px; object-fit:cover; border-radius:4px; display:block; }
        .qc-comparison-stage { position:relative; height:min(50vh,410px); min-height:240px; overflow:hidden; background:#172033; border-radius:var(--radius); }
        .qc-position-grid { display:grid; grid-template-columns:minmax(220px,.9fr) minmax(0,1.1fr); gap:14px; align-items:start; }
        .qc-metadata-grid { display:grid; grid-template-columns:1fr 1fr; gap:0 14px; }
        .qc-decision-field { display:grid; grid-template-columns:minmax(70px,.8fr) minmax(105px,1.2fr); gap:8px; padding:8px 0; border-bottom:1px solid var(--border); align-items:start; }
        @media(max-width:1199px) { .qc-two-col { grid-template-columns:minmax(0,1fr); } .qc-decision { position:relative; top:auto; max-height:none; min-height:0; overflow:visible; } .qc-decision-scroll { overflow:visible; } }
        @media(max-width:760px) { .qc-position-grid,.qc-metadata-grid { grid-template-columns:1fr; } .qc-comparison-stage { height:360px; } .qc-decision-field { grid-template-columns:75px minmax(0,1fr); } }
      `}</style>

      <header style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginBottom: '4px' }}>QC / Billboard Survey / {billboard.code}</div>
          <button onClick={onPause} style={{ display: 'inline-flex', gap: '5px', alignItems: 'center', padding: 0, border: 0, background: 'none', color: PRIMARY, font: `500 12px ${FONT}`, cursor: 'pointer', marginBottom: '5px' }}><ArrowLeft size={13} /> Pause & return to queue</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '19px', fontWeight: 650, margin: 0, lineHeight: 1.25 }}>{billboard.attrs.street}</h1>
            {kind === 'status' && <Badge tone="accent"><CircleAlert size={11} /> Status changed</Badge>}
            {kind === 'brand' && <Badge tone="accent">Brand changed</Badge>}
            {waiting > 0 && <Badge tone={waiting > 3 ? 'red' : 'neutral'}><Clock3 size={11} /> Waiting {waiting} day{waiting === 1 ? '' : 's'}</Badge>}
            <Badge tone={content.status === 'No longer exists' ? 'amber' : 'neutral'}>{content.status}</Badge>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginTop: '3px' }}><span style={{ fontFamily: 'monospace' }}>{billboard.code}</span> · {billboard.city} · {billboard.subdistrict} · {billboard.attrs.mediaType || '—'} · {monthLabel(ad.month)}</div>
        </div>
        <div style={{ ...cardStyle, padding: '8px 10px', flex: '0 0 216px', background: !claimMine || remain < 120_000 ? RED_TINT : PRIMARY_TINT, borderColor: !claimMine || remain < 120_000 ? RED_BORDER : PRIMARY_BORDER }}>
          <div style={{ display: 'flex', gap: '7px', alignItems: 'center', fontSize: '11px', color: !claimMine || remain < 120_000 ? RED : PRIMARY }}>
            <Lock size={13} />
            <div><strong>{claimMine ? 'Claimed for you' : 'Claim released'}</strong>{claimMine && <div>Auto-release in <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtCountdown(remain)}</strong></div>}</div>
          </div>
          <div style={{ borderTop: `1px solid ${!claimMine || remain < 120_000 ? RED_BORDER : PRIMARY_BORDER}`, marginTop: '5px', paddingTop: '5px', fontSize: '11px', color: 'var(--muted-foreground)' }}>Completed today: <strong style={{ color: 'var(--foreground)' }}>{doneToday}</strong></div>
        </div>
      </header>

      {(blocked || claimLost) && <Banner tone="amber" icon={AlertTriangle}>{blocked ?? <>Your claim expired and this ad returned to the queue. Saving may conflict. <button onClick={onReclaim} style={linkBtn}>Reclaim</button></>}</Banner>}
      {blocked && ad.state !== 'pending' && <button onClick={onView} style={linkBtn}>Open read-only</button>}

      <div className="qc-two-col">
        <section className="qc-evidence">
          <div style={{ ...cardStyle, padding: '10px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
              <h3 style={sectionTitle}>Photo history</h3><span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>Select a month to compare</span>
            </div>
            <div className="qc-photo-strip">
              {history.filter(h => h.photo).map(h => {
                const isCurrent = h.id === ad.id; const isCompare = h.id === compareId;
                return <button key={h.id} className="qc-history-item" onClick={() => isCurrent ? openLightbox(h.photo, `${monthLabel(h.month)} · This`) : setCompareId(h.id)} style={{ border: `2px solid ${isCurrent || isCompare ? PRIMARY : 'var(--border)'}`, background: isCurrent || isCompare ? PRIMARY_TINT : 'var(--card)' }}>
                  <img src={photoSrc(h.photo!)} alt={`${monthLabel(h.month)} billboard`} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px', marginTop: '4px' }}><span style={{ fontSize: '11px', fontWeight: 600 }}>{monthLabel(h.month)}</span>{isCurrent ? <Badge tone="accent">This</Badge> : isCompare ? <Badge>Compare</Badge> : null}</div>
                  <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{contentSummary(h.result ?? h.surveyor.input)}</div>
                </button>;
              })}
            </div>
          </div>

          <div style={{ ...cardStyle, padding: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <h3 style={sectionTitle}>Photo comparison</h3>
              <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                <Btn size="sm" style={{ height: '34px', minWidth: '34px', padding: '0 8px' }} onClick={() => setZoom(z => Math.max(1, z - .2))} title="Zoom out"><ZoomOut size={13} /></Btn>
                <span style={{ minWidth: '38px', textAlign: 'center', fontSize: '11px' }}>{Math.round(zoom * 100)}%</span>
                <Btn size="sm" style={{ height: '34px', minWidth: '34px', padding: '0 8px' }} onClick={() => setZoom(z => Math.min(3, z + .2))} title="Zoom in"><ZoomIn size={13} /></Btn>
                <Btn size="sm" style={{ height: '34px', minWidth: '34px', padding: '0 8px' }} onClick={resetZoom} title="Reset zoom"><RotateCcw size={13} /></Btn>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { item: compareAd, label: compareAd ? `${monthLabel(compareAd.month)} · Reference` : 'Previous month · Reference' },
                { item: ad, label: `${monthLabel(ad.month)} · This` },
              ].map(({ item, label }) => <div key={label}>
                <div style={{ color: 'white', background: '#253047', padding: '5px 8px', borderRadius: '6px 6px 0 0', fontSize: '11px', fontWeight: 600 }}>{label}</div>
                <div className="qc-comparison-stage" style={{ height: 'min(50vh,410px)', minHeight: '230px', borderRadius: '0 0 6px 6px' }}>
                  {compareImage(item, label)}
                </div>
                <div style={{ padding: '6px 8px', background: 'var(--muted)', fontSize: '10px', color: 'var(--muted-foreground)', lineHeight: 1.45 }}>
                  {item?.photo ? <>{fmtDateTime(item.photo.takenAt)} · {item.photo.lat != null && item.photo.lng != null ? `${item.photo.lat.toFixed(5)}, ${item.photo.lng.toFixed(5)}` : 'GPS not captured'}</> : 'Photo unavailable'}
                </div>
              </div>)}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', marginTop: '6px' }}>Drag to pan after zooming · double-click a photo to open it</div>
          </div>

          <div style={{ ...cardStyle, padding: '12px' }}>
            <h3 style={{ ...sectionTitle, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}><MapPin size={14} /> Photo position</h3>
            {noLongerCheckApplies && <div style={{ padding: '8px 10px', borderRadius: 'var(--radius)', marginBottom: '10px', display: 'flex', gap: '7px', alignItems: 'flex-start', background: noLongerPass ? GREEN_TINT : RED_TINT, color: noLongerPass ? GREEN : RED, fontSize: '12px' }}>
              {noLongerPass ? <CheckCircle2 size={15} /> : <CircleAlert size={15} />}
              <div><strong>{noLongerPass ? 'Pass' : 'Fails'}: {betweenPhotos == null ? 'photo distance unavailable' : `${Math.round(betweenPhotos)} m ${betweenPhotos <= 10 ? '≤' : '>'} 10 m`}, {headingDiff == null ? 'heading unavailable' : `heading diff ${Math.round(headingDiff)}° ${headingDiff <= 30 ? '≤' : '>'} 30°`}</strong><div style={{ fontSize: '10px', marginTop: '2px' }}>GPS accuracy is not recorded in this prototype; the 10 m threshold is applied directly.</div></div>
            </div>}
            <div className="qc-position-grid">
              <div>
                {ad.photo && curOffset == null && <div style={{ fontSize: '11px', color: AMBER, background: AMBER_TINT, borderRadius: 'var(--radius)', padding: '7px', marginBottom: '7px' }}>Current photo has no GPS data.</div>}
                <div style={{ height: '230px', borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)', position: 'relative', zIndex: 0 }}>
                  <PositionMap billboard={billboard} nearby={nearby} photos={[
                    ...(compareAd?.photo ? [{ label: `${monthShort(compareAd.month)} photo`, color: AMBER, lat: compareAd.photo.lat, lng: compareAd.photo.lng, heading: compareAd.photo.heading }] : []),
                    ...(ad.photo ? [{ label: `${monthShort(ad.month)} photo`, color: PRIMARY, lat: ad.photo.lat, lng: ad.photo.lng, heading: ad.photo.heading }] : []),
                  ]} />
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '10px', color: 'var(--muted-foreground)', marginTop: '6px' }}><Legend color={PRIMARY} square>Point</Legend><Legend color={PRIMARY}>{monthShort(ad.month)} photo</Legend>{compareAd && <Legend color={AMBER}>{monthShort(compareAd.month)} photo</Legend>}</div>
              </div>
              <div className="qc-metadata-grid">
                <KV k="Distance between photos" v={betweenPhotos != null ? `${Math.round(betweenPhotos)} m` : 'Unavailable'} />
                <KV k="Heading difference" v={headingDiff != null ? `${Math.round(headingDiff)}°` : 'Unavailable'} />
                <KV k={`${monthShort(ad.month)} photo from point`} v={curOffset ? `${Math.round(curOffset.d)} m ${curOffset.dir}` : 'GPS not captured'} />
                <KV k={`${monthShort(compareAd?.month ?? ad.month)} photo from point`} v={cmpOffset ? `${Math.round(cmpOffset.d)} m ${cmpOffset.dir}` : 'GPS not captured'} />
                <KV k="Point coordinates" v={`${billboard.lat.toFixed(5)}, ${billboard.lng.toFixed(5)}`} />
                <KV k="Photo taken" v={ad.photo ? fmtDateTime(ad.photo.takenAt) : '—'} />
                <KV k="Photo uploaded" v={ad.photo ? fmtDateTime(ad.photo.uploadedAt) : '—'} />
                <KV k="QC edited" v={lastEditAt ? fmtDateTime(lastEditAt) : '—'} />
              </div>
            </div>
          </div>
        </section>

        <aside className="qc-decision" style={{ ...cardStyle }}>
          <div className="qc-decision-scroll" ref={scrollRef}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h2 style={{ fontSize: '15px', margin: 0, fontWeight: 650 }}>Ad content</h2>
              <Btn size="sm" disabled={!prevContent || readOnly} onClick={() => prevContent && setContent({ ...prevContent })}>Same as {monthShort(compareAd?.month ?? ad.month - 1)}</Btn>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '8px', marginBottom: '8px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--muted-foreground)' }}>{compareAd ? monthLabel(compareAd.month) : 'Previous month'} · Verified</div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: PRIMARY }}>{monthLabel(ad.month)} · Editable</div>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '9px', color: 'var(--muted-foreground)', margin: '0 0 3px' }}><span><kbd>1</kbd> Filled</span><span><kbd>2</kbd> Space Available</span><span><kbd>3</kbd> Empty</span><span><kbd>4</kbd> No longer exists</span></div>
            <DecisionField label="Status" shortcut="1–4" oldValue={prevContent?.status}>
              <select data-qc-status value={content.status} disabled={readOnly} onChange={e => updateStatus(e.target.value)} style={{ ...inputStyle, height: '38px' }}>
                {AD_STATUSES.map(status => <option key={status}>{status}</option>)}
              </select>
              {suggestionMeta(content.status, '91', content.status === ad.surveyor.input.status ? 'Surveyor' : 'QC')}
            </DecisionField>
            {content.status === 'No longer exists' ? <div style={{ borderBottom: '1px solid var(--border)', padding: '10px 0', fontSize: '12px', color: 'var(--muted-foreground)' }}><strong>Brand, sub-brand & ad copy</strong><div style={{ marginTop: '6px', color: 'var(--foreground)' }}>Not applicable</div></div> : <>
              <DecisionField label="Brand" oldValue={prevContent?.brand}>
                <select value={content.brand} disabled={readOnly} onChange={e => changeField('brand', e.target.value)} style={inputStyle}>
                  <option value="">{content.status === 'Filled' ? 'Select brand' : '—'}</option>{brandOptions.map(b => <option key={b}>{b}</option>)}
                </select>{suggestionMeta(content.brand, '87', content.brand === ad.surveyor.input.brand ? 'Surveyor' : 'QC')}
                {brandMissing && <div style={{ color: RED, fontSize: '11px', marginTop: '4px' }}>Brand is required when status is Filled.</div>}
              </DecisionField>
              <DecisionField label="Sub-brand" oldValue={prevContent?.subBrand}>
                <input list="qc-subbrands" value={content.subBrand} disabled={readOnly} onChange={e => changeField('subBrand', e.target.value)} placeholder="Optional" style={inputStyle} />
                <datalist id="qc-subbrands">{subBrandOptions.map(b => <option key={b} value={b} />)}</datalist>{suggestionMeta(content.subBrand, '82', content.subBrand === ad.surveyor.input.subBrand ? 'Surveyor' : 'QC')}
              </DecisionField>
              <DecisionField label="Industry" oldValue={prevContent?.brand ? industryOf(prevContent.brand) : ''}>
                <div style={{ minHeight: '36px', display: 'flex', alignItems: 'center', fontSize: '12px' }}>{industryOf(content.brand) || '—'}</div>
              </DecisionField>
              <DecisionField label="Ad copy" oldValue={prevContent?.adCopy}>
                <textarea value={content.adCopy} disabled={readOnly} onChange={e => changeField('adCopy', e.target.value)} placeholder="No text read from photo" style={{ ...inputStyle, height: '54px', padding: '7px 8px', resize: 'vertical' }} />
                <div style={{ fontSize: '10px', color: 'var(--muted-foreground)', marginTop: '3px' }}>OCR read-out</div>{suggestionMeta(content.adCopy, '94', content.adCopy === ad.surveyor.input.adCopy ? 'Surveyor' : 'QC')}
              </DecisionField>
              {showCp && <DecisionField label="CP number" oldValue={prevContent?.cp}>
                <input value={content.cp} disabled={readOnly || content.status !== 'Space available'} onChange={e => changeField('cp', e.target.value)} placeholder="08xx-xxxx-xxxx" style={{ ...inputStyle, fontFamily: 'monospace' }} />
              </DecisionField>}
            </>}

            <div style={{ marginTop: '12px', ...cardStyle, padding: '10px' }}>
              <button onClick={() => setAttributesOpen(attrsFilled < 7 ? true : !attributesOpen)} aria-expanded={attributesOpen} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', border: 0, padding: 0, background: 'none', cursor: 'pointer', color: 'var(--foreground)', textAlign: 'left', fontFamily: FONT }}>
                <span style={{ fontSize: '12px', fontWeight: 650 }}>Point attributes</span><span style={{ display: 'flex', gap: '7px', alignItems: 'center' }}><Badge tone={attrsFilled === 7 ? 'green' : 'red'}>{attrsFilled} of 7 filled</Badge><ChevronDown size={14} style={{ transform: attributesOpen ? 'rotate(180deg)' : undefined }} /></span>
              </button>
              {!attributesOpen ? <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginTop: '7px' }}>
                {[attrs.mediaType, attrs.width && attrs.height ? `${attrs.width} × ${attrs.height} m` : '', attrs.orientation, attrs.lighting, attrs.mediaOwner].filter(Boolean).join(' · ') || 'No attributes entered'}
                <button onClick={() => setAttributesOpen(true)} style={{ ...linkBtn, marginLeft: '8px', fontSize: '11px' }}>Edit</button>
              </div> : <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '9px 10px', marginTop: '10px' }}>
                <CompactField label="Street name" missing={!attrs.street}><input value={attrs.street} disabled={readOnly} onChange={e => setAttrs(a => ({ ...a, street: e.target.value }))} style={missingStyle(!attrs.street)} /></CompactField>
                <CompactField label="Media owner" missing={!attrs.mediaOwner}><input value={attrs.mediaOwner} disabled={readOnly} onChange={e => setAttrs(a => ({ ...a, mediaOwner: e.target.value }))} placeholder="Not filled" style={missingStyle(!attrs.mediaOwner)} /></CompactField>
                <CompactField label="Media type" missing={!attrs.mediaType}><select value={attrs.mediaType} disabled={readOnly} onChange={e => setAttrs(a => ({ ...a, mediaType: e.target.value as PointAttrs['mediaType'] }))} style={missingStyle(!attrs.mediaType)}><option value="">Select</option><option>Conventional</option><option>LED</option></select></CompactField>
                <CompactField label="Size (W × H, m)" missing={!attrs.width || !attrs.height}><div style={{ display: 'flex', gap: '4px' }}><input type="number" value={attrs.width ?? ''} disabled={readOnly} onChange={e => setAttrs(a => ({ ...a, width: e.target.value ? Number(e.target.value) : null }))} style={missingStyle(!attrs.width)} /><span>×</span><input type="number" value={attrs.height ?? ''} disabled={readOnly} onChange={e => setAttrs(a => ({ ...a, height: e.target.value ? Number(e.target.value) : null }))} style={missingStyle(!attrs.height)} /></div></CompactField>
                <CompactField label="Orientation" missing={!attrs.orientation}><select value={attrs.orientation} disabled={readOnly} onChange={e => setAttrs(a => ({ ...a, orientation: e.target.value as PointAttrs['orientation'] }))} style={missingStyle(!attrs.orientation)}><option value="">Select</option><option>Horizontal</option><option>Vertical</option></select></CompactField>
                <CompactField label="Lighting" missing={!attrs.lighting}><select value={attrs.lighting} disabled={readOnly} onChange={e => setAttrs(a => ({ ...a, lighting: e.target.value as PointAttrs['lighting'] }))} style={missingStyle(!attrs.lighting)}><option value="">Select</option><option>Frontlit</option><option>Backlit</option><option>No lighting</option></select></CompactField>
                <CompactField label="Other billboards within 50 m" missing={false}><div style={{ minHeight: 36, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>{nearby.length}{nearby.slice(0, 3).map(n => <Badge key={n.id}>{n.code}</Badge>)}</div></CompactField>
              </div>}
            </div>

            {corrections.length > 0 && <div style={{ marginTop: '10px', padding: '9px', borderRadius: 'var(--radius)', background: PRIMARY_TINT, border: `1px solid ${PRIMARY_BORDER}` }}><div style={{ fontSize: '11px', fontWeight: 650, marginBottom: '6px' }}>QC corrections</div><DiffList diffs={corrections} /></div>}
          </div>
          <div className="qc-decision-footer">
            <div style={{ fontSize: '10px', color: brandMissing || moveError ? RED : 'var(--muted-foreground)', marginBottom: '7px' }}>{brandMissing || moveError ? 'Resolve the fields marked in red before saving.' : moveTarget && moveTo ? `Photo will move to ${moveTarget.code} · ${moveTarget.attrs.street}. ` : 'Saving releases this ad and claims the next one in the queue. '}<span style={{ whiteSpace: 'nowrap' }}>Enter = Save · R = Reject</span></div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <Btn variant="danger" disabled={readOnly} onClick={() => setRejectDialogOpen(true)}><XCircle size={14} /> Reject</Btn>
              <Btn variant="primary" disabled={readOnly || brandMissing || !!moveError || saving} onClick={onSave} style={{ flex: 1 }}><Save size={14} /> {saving ? 'Saving…' : 'Save & take next'}</Btn>
              <div style={{ position: 'relative' }}>
                <Btn title="More actions" disabled={readOnly} onClick={() => setMoveOpen(v => !v)}><MoreHorizontal size={17} /></Btn>
                {moveOpen && <div style={{ position: 'absolute', zIndex: 20, bottom: '42px', right: 0, minWidth: '220px', padding: '5px', ...cardStyle, boxShadow: '0 8px 24px rgba(0,0,0,.15)' }}><button onClick={() => { setMoveOpen(false); onMove(); }} style={{ width: '100%', border: 0, background: 'none', textAlign: 'left', padding: '9px 10px', borderRadius: 'var(--radius)', font: `13px ${FONT}`, color: 'var(--foreground)', cursor: 'pointer' }}>Move to another billboard…</button></div>}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {rejectDialogOpen && <Modal title="Reject photo" onClose={() => setRejectDialogOpen(false)} footer={<><Btn onClick={() => setRejectDialogOpen(false)}>Cancel</Btn><Btn variant="primary" disabled={readOnly} onClick={() => { setRejectDialogOpen(false); onConfirmReject(rejectNote.trim() ? `${rejectChoice} — ${rejectNote.trim()}` : rejectChoice); setRejectNote(''); }} style={{ background: RED, borderColor: RED }}>Reject & take next</Btn></>}>
        <p style={{ margin: '0 0 9px', color: 'var(--muted-foreground)' }}>Choose the main reason. Add an optional note.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>{DETAIL_REJECT_REASONS.map(r => <button key={r} onClick={() => setRejectChoice(r)} style={{ padding: '8px', minHeight: '36px', borderRadius: 'var(--radius)', border: `1px solid ${rejectChoice === r ? PRIMARY : 'var(--border)'}`, background: rejectChoice === r ? PRIMARY_TINT : 'var(--card)', color: 'var(--foreground)', textAlign: 'left', cursor: 'pointer' }}>{rejectChoice === r ? '◉ ' : '○ '}{r}</button>)}</div>
        <textarea value={rejectNote} onChange={e => setRejectNote(e.target.value)} placeholder="Optional note" style={{ ...inputStyle, height: '66px', padding: '8px', resize: 'vertical', marginTop: '9px' }} />
      </Modal>}
      {moveDialogOpen && <MoveBillboardDialog currentId={billboard.id} billboards={billboards} nearby={nearbyTargets} onCancel={() => setMoveDialogOpen(false)} onConfirm={code => { onConfirmMove(code); setMoveDialogOpen(false); }} />}
      {conflict && <Modal title={conflict.saved ? 'Already saved by another QC' : 'Opened by another QC'} onClose={onClearConflict} footer={<><Btn onClick={onBackQueue}>Back to queue</Btn><Btn variant="primary" onClick={onTakeNext}>Take next ad</Btn></>}><p style={{ margin: '0 0 8px' }}><strong>{billboard.code} · {billboard.attrs.street}</strong> {conflict.saved ? <>was already saved by <strong>{conflict.by}</strong> a few seconds ago.</> : <>is now open by <strong>{conflict.by}</strong>.</>}</p><p style={{ margin: 0 }}>Your decision has <strong>not</strong> been saved, to avoid overwriting theirs.</p></Modal>}
    </div>
  );
}

function DecisionField({ label, shortcut, oldValue, children }: { label: string; shortcut?: string; oldValue?: string | null; children: ReactNode }) {
  return <div className="qc-decision-field">
    <div><div style={{ fontSize: '11px', fontWeight: 650 }}>{label}{shortcut && <span style={{ color: PRIMARY, marginLeft: '4px' }}>{shortcut}</span>}</div><div style={{ fontSize: '10px', color: 'var(--muted-foreground)', marginTop: '5px', overflowWrap: 'anywhere' }}>{oldValue || '—'}</div></div>
    <div style={{ minWidth: 0, fontSize: '12px' }}>{children}</div>
  </div>;
}

function CompactField({ label, missing, children }: { label: string; missing: boolean; children: ReactNode }) {
  return <label style={{ minWidth: 0 }}><span style={{ display: 'block', fontSize: '9px', color: missing ? RED : 'var(--muted-foreground)', marginBottom: '4px', fontWeight: 650 }}>{label}{missing ? ' · REQUIRED' : ''}</span>{children}</label>;
}

function missingStyle(missing: boolean): CSSProperties {
  return { ...inputStyle, height: '36px', borderColor: missing ? RED : 'var(--border)', background: missing ? RED_TINT : 'var(--input-background)', minWidth: 0 };
}

const linkBtn: CSSProperties = { border: 'none', background: 'none', padding: 0, cursor: 'pointer', color: PRIMARY, fontFamily: FONT, fontSize: '13px', fontWeight: 600, textDecoration: 'underline' };

function groupChanges(ad: SurveyAd) {
  const groups: { by: string; at: number; reason: string; items: FieldDiff[] }[] = [];
  ad.changes.forEach(c => {
    const g = groups.find(x => x.at === c.at && x.by === c.by);
    if (g) g.items.push(c);
    else groups.push({ by: c.by, at: c.at, reason: c.reason, items: [c] });
  });
  return groups;
}

function Banner({ tone, icon: Icon, children }: { tone: 'amber' | 'accent'; icon: typeof Lock; children: ReactNode }) {
  const amber = tone === 'amber';
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 14px', marginBottom: '16px', borderRadius: 'var(--radius)', fontSize: '13px', backgroundColor: amber ? AMBER_TINT : PRIMARY_TINT, border: `1px solid ${amber ? 'AMBER_BORDER' : 'PRIMARY_BORDER'}`, color: amber ? AMBER : PRIMARY }}>
      <Icon size={15} style={{ flexShrink: 0, marginTop: 2 }} />
      <div>{children}</div>
    </div>
  );
}

function PhotoPanel({ title, ad, code, onOpen, highlight, empty }: { title: string; ad: SurveyAd | null; code: string; onOpen: (v: { photo: SurveyPhoto; caption: string }) => void; highlight?: boolean; empty: string }) {
  return (
    <div style={{ ...cardStyle, padding: '12px', borderColor: highlight ? PRIMARY : 'var(--border)', borderWidth: highlight ? 2 : 1 }}>
      <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: highlight ? PRIMARY : 'var(--foreground)' }}>{title}</div>
      {ad?.photo ? (
        <img src={photoSrc(ad.photo)} alt={title} onClick={() => onOpen({ photo: ad.photo!, caption: `${code} · ${monthLabel(ad.month)}` })} style={{ width: '100%', aspectRatio: '640 / 420', objectFit: 'cover', borderRadius: 'var(--radius)', cursor: 'zoom-in', display: 'block' }} />
      ) : (
        <div style={{ aspectRatio: '640 / 420', borderRadius: 'var(--radius)', backgroundColor: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: 'var(--muted-foreground)' }}>{empty}</div>
      )}
      {ad && <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginTop: '8px' }}>{contentSummary(ad.result ?? ad.surveyor.input)}{ad.photo ? ` · taken ${fmtDateTime(ad.photo.takenAt)}` : ''}</div>}
    </div>
  );
}

function Field({ label, children, span }: { label: string; children: ReactNode; span?: boolean }) {
  return (
    <div style={{ gridColumn: span ? '1 / -1' : undefined }}>
      <div style={{ ...labelStyle, marginBottom: '6px' }}>{label}</div>
      {children}
    </div>
  );
}

function RowLabel({ children }: { children: ReactNode }) {
  return <span style={{ fontSize: '12px', color: 'var(--muted-foreground)', fontWeight: 500 }}>{children}</span>;
}

function Prev({ children, mono }: { children?: ReactNode; mono?: boolean }) {
  return <span style={{ color: children ? 'var(--foreground)' : 'var(--muted-foreground)', fontFamily: mono ? 'monospace' : undefined }}>{children || '—'}</span>;
}

function Legend({ color, square, children }: { color: string; square?: boolean; children: ReactNode }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
      <span style={{ width: 9, height: 9, backgroundColor: color, borderRadius: square ? 2 : '50%' }} />{children}
    </span>
  );
}

function HistoryItem({ who, at, children }: { who: string; at: number; children: ReactNode }) {
  return (
    <div style={{ borderLeft: `2px solid ${PRIMARY}`, paddingLeft: '10px' }}>
      <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginBottom: '3px' }}><strong style={{ color: 'var(--foreground)' }}>{who}</strong> · {fmtDateTime(at)}</div>
      <div style={{ fontSize: '13px' }}>{children}</div>
    </div>
  );
}
