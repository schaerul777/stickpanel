import { Fragment, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import {
  Search, ChevronDown, ChevronLeft, ChevronRight, Play, ClipboardList, CheckCircle2,
  AlertTriangle, Lock, X, ArrowRight, SearchX, Eye,
} from 'lucide-react';
import { useToast, ToastContainer, type ToastType } from '../../../components/Toast';
import {
  CITY_NAMES, CYCLE, ME, PAGE_SIZE, contentSummary, fmtShortDateTime, monthLabel, monthLong, monthShort,
  type SurveyAd, type SurveyPhoto,
} from './surveyData';
import {
  adsOfBillboard, autoQueue, bulkApprove, claimAd, claimNext, isClaimedByOther, manualQueue,
  useNow, useSurveyState, type QueueRow,
} from './surveyStore';
import {
  PRIMARY_TINT, Badge, Btn, FONT, GREEN, GREEN_BORDER, GREEN_TINT, Lightbox, Modal, PRIMARY, RED, RED_TINT, Thumb, cardStyle, inputStyle,
} from './surveyUi';

const BASE = '/core-3/qc/billboard-survey';
type Tab = 'manual' | 'auto';

const thStyle: React.CSSProperties = {
  padding: '10px 14px', fontSize: '12px', fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase',
  letterSpacing: '0.04em', backgroundColor: 'var(--muted)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap',
  display: 'flex', alignItems: 'center',
};
const tdStyle: React.CSSProperties = {
  padding: '12px 14px', fontSize: '13px', color: 'var(--foreground)', borderBottom: '1px solid var(--border)',
  display: 'flex', alignItems: 'center', minWidth: 0,
};
const MANUAL_COLS = '92px minmax(220px, 1.3fr) minmax(250px, 1.5fr) 120px 170px 100px 96px';
const AUTO_COLS = 'minmax(260px, 1.5fr) 150px 180px minmax(220px, 1fr)';

// ─── Summary tile ─────────────────────────────────────────────────────────────

function Tile({ label, value, color, icon: Icon }: { label: string; value: number; color: string; icon: typeof ClipboardList }) {
  return (
    <div style={{ ...cardStyle, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
      <div style={{ width: 38, height: 38, borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: color === PRIMARY ? PRIMARY_TINT : color === GREEN ? GREEN_TINT : RED_TINT }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        <div style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>{label}</div>
        <div style={{ fontSize: '22px', fontWeight: 600, color, fontVariantNumeric: 'tabular-nums', lineHeight: 1.3 }}>{value}</div>
      </div>
    </div>
  );
}

// ─── Brand / status change cell ───────────────────────────────────────────────

function ChangeCell({ row }: { row: QueueRow }) {
  const prev = row.prev?.result ?? null;
  const cur = row.ad.surveyor.input;
  const changed = row.change !== 'none';
  const display = (content: typeof cur | null) => {
    if (!content) return '—';
    if (content.status === 'Filled') return content.brand || 'Brand not filled';
    return content.status;
  };
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        <span style={{ color: 'var(--muted-foreground)' }}>{display(prev)}</span>
        <ArrowRight size={12} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} />
        <span style={{
          fontWeight: 600, padding: changed ? '1px 6px' : 0, borderRadius: '4px',
          backgroundColor: changed ? PRIMARY_TINT : 'transparent', color: changed ? PRIMARY : 'var(--foreground)',
        }}>
          {display(cur)}
        </span>
      </div>
    </div>
  );
}

// ─── Billboard search results ─────────────────────────────────────────────────

function SearchResults({ query, city, onClose, onCheck, onOpen, onPhoto }: {
  query: string; city: string; onClose: () => void;
  onCheck: (ad: SurveyAd) => void; onOpen: (ad: SurveyAd) => void; onPhoto: (p: SurveyPhoto, caption: string) => void;
}) {
  const s = useSurveyState();
  const now = useNow(5000);
  const q = query.trim().toLowerCase();
  const matches = s.billboards.filter(b =>
    (!city || b.city === city) && (b.attrs.street.toLowerCase().includes(q) || b.code.toLowerCase().includes(q)),
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ fontSize: '14px', fontWeight: 600 }}>
          Search results "{query.trim()}" · {matches.length} billboard{matches.length === 1 ? '' : 's'}
        </div>
        <Btn size="sm" onClick={onClose}><X size={13} /> Close search</Btn>
      </div>

      {matches.length === 0 ? (
        <div style={{ ...cardStyle, padding: '56px 24px', textAlign: 'center' }}>
          <SearchX size={40} style={{ color: 'var(--muted-foreground)', opacity: 0.4, margin: '0 auto 12px', display: 'block' }} />
          <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px' }}>No billboards found</div>
          <div style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>Try another name or code, or change the city filter.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {matches.map(b => (
            <div key={b.id} style={{ ...cardStyle, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600, fontSize: '14px' }}>{b.attrs.street}</span>
                <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--muted-foreground)' }}>{b.code}</span>
                <span style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>{b.city} · {b.subdistrict} · {b.attrs.mediaType || '—'}</span>
              </div>
              {adsOfBillboard(s, b.id).map(ad => {
                const lockedBy = isClaimedByOther(ad, now) ? ad.claim!.by : null;
                const content = ad.result ?? ad.surveyor.input;
                return (
                  <div key={ad.id} style={{ display: 'grid', gridTemplateColumns: '110px 88px 1fr 190px 130px', alignItems: 'center', gap: '12px', padding: '10px 16px', borderBottom: '1px solid var(--border)', fontSize: '13px' }}>
                    <span style={{ fontWeight: 500 }}>{monthLabel(ad.month)}</span>
                    <Thumb photo={ad.photo} size={64} alt={b.code} onClick={ad.photo ? () => onPhoto(ad.photo!, `${b.code} · ${monthLabel(ad.month)}`) : undefined} />
                    <span>{contentSummary(content)}</span>
                    <span>
                      {lockedBy ? <Badge tone="amber"><Lock size={10} /> Opened by {lockedBy}</Badge>
                        : ad.state === 'pending' ? <Badge>Not checked</Badge>
                        : ad.state === 'rejected' ? <Badge tone="red">Rejected</Badge>
                        : <Badge tone="green">Checked{ad.qc?.method === 'auto' ? ' · auto' : ''}</Badge>}
                    </span>
                    <span style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      {lockedBy ? (
                        <Btn size="sm" disabled title={`${lockedBy} has this ad open`}>Unavailable</Btn>
                      ) : ad.state === 'pending' ? (
                        <Btn size="sm" variant="primary" onClick={() => onCheck(ad)}>Check now</Btn>
                      ) : (
                        <Btn size="sm" onClick={() => onOpen(ad)}><Eye size={13} /> Open</Btn>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function BillboardSurveyList() {
  const navigate = useNavigate();
  const location = useLocation();
  const s = useSurveyState();
  const now = useNow(5000);
  const { toasts, showToast, dismiss } = useToast();

  const [tab, setTab] = useState<Tab>('manual');
  const [city, setCity] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [lightbox, setLightbox] = useState<{ photo: SurveyPhoto; caption: string } | null>(null);
  const [confirmApproveOpen, setConfirmApproveOpen] = useState(false);

  // Toasts handed over from the detail page (e.g. "queue finished").
  useEffect(() => {
    const t = (location.state as { toast?: { type: ToastType; title: string; message?: string } } | null)?.toast;
    if (t) {
      showToast(t.type, t.title, t.message);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, navigate, showToast]);

  const manual = useMemo(() => manualQueue(s, city, now), [s, city, now]);
  const auto = useMemo(() => autoQueue(s, city, now), [s, city, now]);
  const overdue = manual.filter(r => r.overdue);
  const others = manual.length - overdue.length;
  const autoApprovable = auto.filter(r => !isClaimedByOther(r.ad, now));

  const totalPages = Math.max(1, Math.ceil(manual.length / PAGE_SIZE));
  const pageRows = manual.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  const open = (adId: string, mode: 'qc' | 'view') => navigate(`${BASE}/${adId}?mode=${mode}`);

  const startQc = () => {
    const id = claimNext(city);
    if (id) open(id, 'qc');
    else showToast('info', 'Queue is empty', 'There are no ads waiting for manual review.');
  };

  const take = (ad: SurveyAd) => {
    const res = claimAd(ad.id);
    if (res.ok) open(ad.id, 'qc');
    else showToast('warning', 'Ad unavailable', `${res.by} has just opened this ad.`);
  };

  const approveAll = () => {
    setConfirmApproveOpen(false);
    const { approved, skipped } = bulkApprove(auto.map(r => r.ad.id));
    showToast('success', `${approved} ad${approved === 1 ? '' : 's'} auto-approved`,
      skipped ? `${skipped} skipped because another QC has them open.` : undefined);
  };

  const searching = search.trim().length > 0;

  return (
    <div style={{ fontFamily: FONT, maxWidth: '100%' }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginBottom: '6px' }}>QC / Billboard Survey</div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--foreground)', margin: 0, lineHeight: 1.3 }}>Billboard Survey</h1>
            <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', marginTop: '4px' }}>
              Cycle {monthLong(CYCLE.month)} · Sample data as of {new Date(CYCLE.sampleCutoff).getDate()} {monthShort(CYCLE.month)}
            </p>
          </div>
          <Btn variant="primary" onClick={startQc} disabled={manual.length === 0}>
            <Play size={14} /> Start QC · {manual.length} ad{manual.length === 1 ? '' : 's'}
          </Btn>
        </div>
      </div>

      {/* ── Search + city ── */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)', pointerEvents: 'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Billboard name or code..." style={{ ...inputStyle, paddingLeft: '32px', fontSize: '14px' }} />
        </div>
        <div style={{ position: 'relative', width: '220px', flexShrink: 0 }}>
          <select value={city} onChange={e => { setCity(e.target.value); setPage(1); }} style={{ ...inputStyle, appearance: 'none', paddingRight: '28px', cursor: 'pointer', fontSize: '14px' }}>
            <option value="">All cities / regencies</option>
            {CITY_NAMES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <ChevronDown size={13} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--muted-foreground)' }} />
        </div>
      </div>

      {searching ? (
        <SearchResults
          query={search} city={city} onClose={() => setSearch('')}
          onCheck={take} onOpen={ad => open(ad.id, 'view')}
          onPhoto={(photo, caption) => setLightbox({ photo, caption })}
        />
      ) : (
        <>
          {/* ── Summary tiles ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
            <Tile label="Needs manual check" value={manual.length} color={PRIMARY} icon={ClipboardList} />
            <Tile label="Passed auto rules" value={auto.length} color={GREEN} icon={CheckCircle2} />
            <Tile label="Waiting more than 3 days" value={overdue.length} color={RED} icon={AlertTriangle} />
          </div>

          {/* ── Tabs ── */}
          <div style={{ borderBottom: '1px solid var(--border)', marginBottom: '16px', display: 'flex' }}>
            {([['manual', 'Needs manual check', manual.length], ['auto', 'Auto-passed', auto.length]] as const).map(([key, label, count]) => {
              const active = tab === key;
              return (
                <button key={key} onClick={() => setTab(key)} style={{ position: 'relative', padding: '12px 16px', border: 'none', backgroundColor: 'transparent', fontFamily: FONT, fontSize: '14px', fontWeight: 500, color: active ? PRIMARY : 'var(--muted-foreground)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {label}
                  <span style={{ minWidth: 20, height: 18, padding: '0 6px', borderRadius: 999, fontSize: '11px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: active ? PRIMARY_TINT : 'var(--muted)', color: active ? PRIMARY : 'var(--muted-foreground)' }}>{count}</span>
                  {active && <div style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: 2, backgroundColor: PRIMARY }} />}
                </button>
              );
            })}
          </div>

          {tab === 'manual' ? (
            <>
              <div style={{ ...cardStyle, overflow: 'hidden', marginBottom: '16px' }}>
                {manual.length === 0 ? (
                  <div style={{ padding: '64px 24px', textAlign: 'center' }}>
                    <SearchX size={40} style={{ color: 'var(--muted-foreground)', opacity: 0.4, margin: '0 auto 12px', display: 'block' }} />
                    <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px' }}>No ads found</div>
                    <div style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>Try adjusting the city filter, or check the Auto-passed tab.</div>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <div role="table" style={{ minWidth: '1040px' }}>
                      <div role="row" style={{ display: 'grid', gridTemplateColumns: MANUAL_COLS }}>
                        <div style={thStyle}>Photo</div>
                        <div style={thStyle}>Point</div>
                        <div style={thStyle}>Brand ({row0Prev(manual)} → {monthShort(CYCLE.month)})</div>
                        <div style={thStyle}>Type</div>
                        <div style={thStyle}>Taken · Uploaded</div>
                        <div style={thStyle}>Waiting</div>
                        <div style={thStyle} />
                      </div>
                      {pageRows.map((row, idx) => {
                        const prevRow = pageRows[idx - 1];
                        const showHeader = idx === 0 || prevRow.overdue !== row.overdue;
                        return (
                          <Fragment key={row.ad.id}>
                            {showHeader && (
                              <div style={{ padding: '8px 14px', fontSize: '12px', fontWeight: 600, borderBottom: '1px solid var(--border)', backgroundColor: row.overdue ? RED_TINT : 'var(--secondary)', color: row.overdue ? RED : 'var(--muted-foreground)' }}>
                                {row.overdue
                                  ? `Waiting more than 3 days · ${overdue.length} ad${overdue.length === 1 ? '' : 's'} · prioritize`
                                  : `Rest of the queue · ${others} ad${others === 1 ? '' : 's'}`}
                              </div>
                            )}
                            <div role="row" style={{ display: 'grid', gridTemplateColumns: MANUAL_COLS }}>
                              <div style={tdStyle}>
                                <Thumb photo={row.ad.photo} size={64} alt={row.billboard.code} onClick={() => setLightbox({ photo: row.ad.photo!, caption: `${row.billboard.code} · ${monthLabel(row.ad.month)}` })} />
                              </div>
                              <div style={tdStyle}>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.billboard.attrs.street}</div>
                                  <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginTop: 2 }}>{row.billboard.city} · {row.billboard.subdistrict}</div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: 4 }}>
                                    <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--muted-foreground)' }}>{row.billboard.code}</span>
                                    {row.ad.inSample && <Badge tone="accent">Sample</Badge>}
                                  </div>
                                </div>
                              </div>
                              <div style={tdStyle}><ChangeCell row={row} /></div>
                              <div style={tdStyle}>{row.billboard.attrs.mediaType || '—'}</div>
                              <div style={{ ...tdStyle, fontSize: '12px' }}>
                                <div>
                                  <div>{fmtShortDateTime(row.ad.photo!.takenAt)}</div>
                                  <div style={{ color: 'var(--muted-foreground)', marginTop: 2 }}>{fmtShortDateTime(row.ad.photo!.uploadedAt)}</div>
                                </div>
                              </div>
                              <div style={{ ...tdStyle, color: row.overdue ? RED : 'var(--foreground)', fontWeight: row.overdue ? 600 : 400 }}>
                                {row.waiting === 0 ? 'Today' : `${row.waiting} day${row.waiting === 1 ? '' : 's'}`}
                              </div>
                              <div style={{ ...tdStyle, justifyContent: 'flex-end' }}>
                                <Btn size="sm" onClick={() => take(row.ad)}>Take</Btn>
                              </div>
                            </div>
                          </Fragment>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {manual.length > PAGE_SIZE && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>
                    Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, manual.length)} of {manual.length}
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <PageBtn disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={14} /></PageBtn>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <PageBtn key={p} active={p === page} onClick={() => setPage(p)}>{p}</PageBtn>
                    ))}
                    <PageBtn disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight size={14} /></PageBtn>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* ── Auto-pass banner ── */}
              <div style={{ ...cardStyle, padding: '14px 18px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', backgroundColor: GREEN_TINT, borderColor: GREEN_BORDER }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: GREEN }}>
                    {auto.length === 0 ? 'All approved' : 'Empty and space-available ads that passed the auto rules'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginTop: 2 }}>
                    Approved in one go by a single QC. Ads currently opened by another QC are skipped automatically.
                  </div>
                </div>
                <Btn variant="primary" onClick={() => setConfirmApproveOpen(true)} disabled={autoApprovable.length === 0}>
                  <CheckCircle2 size={14} /> Approve {autoApprovable.length} passing ad{autoApprovable.length === 1 ? '' : 's'}
                </Btn>
              </div>

              <div style={{ ...cardStyle, overflow: 'hidden' }}>
                {auto.length === 0 ? (
                  <div style={{ padding: '56px 24px', textAlign: 'center' }}>
                    <CheckCircle2 size={40} style={{ color: GREEN, opacity: 0.5, margin: '0 auto 12px', display: 'block' }} />
                    <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '6px' }}>Nothing left to approve</div>
                    <div style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>New auto-passed ads appear here as surveyors upload.</div>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <div role="table" style={{ minWidth: '820px' }}>
                      <div role="row" style={{ display: 'grid', gridTemplateColumns: AUTO_COLS }}>
                        <div style={thStyle}>Point</div>
                        <div style={thStyle}>Status</div>
                        <div style={thStyle}>CP number</div>
                        <div style={thStyle}>Media owner</div>
                      </div>
                      {auto.map(row => {
                        const lockedBy = isClaimedByOther(row.ad, now) ? row.ad.claim!.by : null;
                        return (
                          <div key={row.ad.id} role="row" style={{ display: 'grid', gridTemplateColumns: AUTO_COLS, opacity: lockedBy ? 0.6 : 1 }}>
                            <div style={tdStyle}>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontWeight: 600 }}>{row.billboard.attrs.street}</div>
                                <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginTop: 2 }}>
                                  <span style={{ fontFamily: 'monospace' }}>{row.billboard.code}</span> · {row.billboard.city}
                                </div>
                                {lockedBy && <Badge tone="amber" style={{ marginTop: 4 }}><Lock size={10} /> Opened by {lockedBy} · will be skipped</Badge>}
                              </div>
                            </div>
                            <div style={tdStyle}>{row.ad.surveyor.input.status}</div>
                            <div style={{ ...tdStyle, fontFamily: 'monospace' }}>
                              {row.ad.surveyor.input.status === 'Space available' ? (row.ad.ocr.cp ?? <span style={{ fontFamily: FONT, color: 'var(--muted-foreground)' }}>Unreadable</span>) : '—'}
                            </div>
                            <div style={tdStyle}>
                              {row.billboard.attrs.mediaOwner && row.ad.ocr.logoOwner === row.billboard.attrs.mediaOwner ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span>{row.billboard.attrs.mediaOwner}</span>
                                  <Badge tone="green">matches photo</Badge>
                                </span>
                              ) : !row.billboard.attrs.mediaOwner ? (
                                <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                                  <span>Not filled</span>
                                  {!row.ad.ocr.logoOwner && <Badge>not in photo</Badge>}
                                </span>
                              ) : <span style={{ color: 'var(--muted-foreground)' }}>—</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginTop: '16px' }}>Signed in as {ME}</div>

      {lightbox && <Lightbox photo={lightbox.photo} caption={lightbox.caption} onClose={() => setLightbox(null)} />}
      {confirmApproveOpen && (
        <Modal
          title={`Approve ${autoApprovable.length} passing ad${autoApprovable.length === 1 ? '' : 's'}?`}
          onClose={() => setConfirmApproveOpen(false)}
          footer={<>
            <Btn onClick={() => setConfirmApproveOpen(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={approveAll}>
              <CheckCircle2 size={14} /> Approve {autoApprovable.length} ad{autoApprovable.length === 1 ? '' : 's'}
            </Btn>
          </>}
        >
          This will approve all auto-passed ads that are available. Ads currently opened by another QC will be skipped.
        </Modal>
      )}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

function row0Prev(rows: QueueRow[]) {
  const m = rows.find(r => r.prev)?.prev?.month;
  return m ? monthShort(m) : 'Prev';
}

function PageBtn({ children, onClick, disabled, active }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; active?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius)', border: `1px solid ${active ? PRIMARY : 'var(--border)'}`, backgroundColor: active ? PRIMARY : 'var(--card)', color: active ? 'white' : 'var(--foreground)', fontFamily: FONT, fontSize: '13px', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1 }}>
      {children}
    </button>
  );
}
