import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import {
  ArrowLeft, Lock, CheckCircle2, AlertTriangle, Pencil, History, MapPin, XCircle, Save, ChevronDown, Info,
} from 'lucide-react';
import { useToast, ToastContainer } from '../../../components/Toast';
import {
  AD_STATUSES, BRANDS, CYCLE, MAX_DRIFT_M, ME, REJECT_REASONS,
  bearingDeg, compass, contentSummary, diffAttrs, diffContent, distanceM, fmtDateTime, industryOf, monthLabel, monthShort, waitingDays,
  type AdContent, type AdStatus, type Billboard, type FieldDiff, type PointAttrs, type SurveyAd, type SurveyPhoto,
} from './surveyData';
import {
  adsOfBillboard, billboardByCode, changeKind, claimAd, claimNext, getAd, getBillboard, prevVerified,
  rejectAd, releaseClaim, saveEdit, saveQc, touchClaim, useNow, useSurveyState, type SaveResult,
} from './surveyStore';
import {
  AMBER, AMBER_BORDER, AMBER_TINT, Badge, Btn, FONT, GRAY, GREEN, Lightbox, Modal, PRIMARY, PRIMARY_BORDER, PRIMARY_TINT, RED,
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

function RejectDialog({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: (reason: string) => void }) {
  const [choice, setChoice] = useState(REJECT_REASONS[0]);
  const reason = choice;
  return (
    <Modal
      title="Reject this photo?"
      onClose={onCancel}
      footer={<>
        <Btn onClick={onCancel}>Cancel</Btn>
        <Btn variant="primary" disabled={!reason} onClick={() => onConfirm(reason)} style={{ backgroundColor: RED, borderColor: RED }}>Reject & take next</Btn>
      </>}
    >
      <p style={{ margin: '0 0 12px', color: 'var(--muted-foreground)' }}>The ad is marked Rejected and removed from the queue. Pick the reason:</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {REJECT_REASONS.map(r => (
          <label key={r} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input type="radio" name="reject-reason" checked={choice === r} onChange={() => setChoice(r)} style={{ accentColor: PRIMARY }} />
            {r}
          </label>
        ))}
      </div>
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
    if (!res.ok) return setConflict(res);
    goNext(`${billboard.code} saved`);
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
