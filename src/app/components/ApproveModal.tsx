import { useState } from 'react';
import { X, Download, Mail, ArrowRight } from 'lucide-react';

interface Transaction {
  id: string;
  driver: { name: string; phone: string };
  redeemItem: 'cash' | 'credit';
  points: number;
  bankAccount?: string;
  phoneNumber?: string;
}

interface ApproveModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  onApprove: (batchRef: string) => void;
}

export function ApproveModal({ isOpen, onClose, transactions, onApprove }: ApproveModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [batchRef, setBatchRef] = useState('');
  const [financeEmail, setFinanceEmail] = useState('finance@stickpanel.com');

  if (!isOpen) return null;

  const isSingleApproval = transactions.length === 1;
  const totalValue = transactions.reduce((sum, t) => sum + t.points, 0);

  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleApprove = () => {
    if (isSingleApproval) {
      // For single approvals, auto-generate batch reference and proceed directly
      const autoBatchRef = `TXN-${transactions[0].id}-${new Date().toISOString().split('T')[0]}`;
      onApprove(autoBatchRef);
      onClose();
      setStep(1);
      setBatchRef('');
    } else {
      // For batch approvals, proceed to step 2 with manual batch reference
      if (batchRef.trim()) {
        setStep(2);
      }
    }
  };

  const handleDownloadCSV = () => {
    onApprove(batchRef);
    onClose();
    setStep(1);
    setBatchRef('');
  };

  const handleSendEmail = () => {
    const subject = `Redeem Requests - ${batchRef}`;
    const body = `Please process the following ${transactions.length} redeem requests:\n\nTotal Value: ${formatIDR(totalValue)}\n\nSee attached CSV for details.`;
    window.open(`mailto:${financeEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    onApprove(batchRef);
    onClose();
    setStep(1);
    setBatchRef('');
  };

  const handleSubmit = () => {
    if (isSingleApproval) {
      const autoBatchRef = `TXN-${transactions[0].id}-${new Date().toISOString().split('T')[0]}`;
      onApprove(autoBatchRef);
      onClose();
      setStep(1);
      setBatchRef('');
    } else {
      if (batchRef.trim()) {
        setStep(2);
      }
    }
  };

  const transactionIds = transactions.map(t => t.id);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
    }}>
      <div style={{
        backgroundColor: 'var(--color-card)',
        borderRadius: 'var(--radius-lg)',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{
            fontFamily: 'var(--font-family-geist)',
            fontSize: 'var(--text-20)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--color-foreground)',
          }}>
            {step === 1 ? 'Approve Requests' : 'Send List to Finance'}
          </div>
          <button
            onClick={() => {
              onClose();
              setStep(1);
              setBatchRef('');
            }}
            style={{
              padding: '8px',
              borderRadius: 'var(--radius)',
              border: 'none',
              backgroundColor: 'transparent',
              color: 'var(--color-muted-foreground)',
              cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', maxHeight: 'calc(90vh - 160px)', overflowY: 'auto' }}>
          {step === 1 ? (
            <>
              {!isSingleApproval && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontFamily: 'var(--font-family-geist)',
                    fontSize: 'var(--text-14)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--color-foreground)',
                    marginBottom: '8px',
                  }}>
                    Batch Reference
                  </label>
                  <input
                    type="text"
                    value={batchRef}
                    onChange={(e) => setBatchRef(e.target.value)}
                    placeholder="e.g. Batch #FIN-2025-02-17"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius)',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-input-background)',
                      fontFamily: 'var(--font-family-geist)',
                      fontSize: 'var(--text-16)',
                      color: 'var(--color-foreground)',
                    }}
                  />
                </div>
              )}

              {/* Summary Card */}
              <div style={{
                backgroundColor: 'rgba(168, 85, 247, 0.1)',
                borderRadius: 'var(--radius)',
                padding: '20px',
                marginBottom: '20px',
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                }}>
                  <span style={{
                    fontFamily: 'var(--font-family-geist)',
                    fontSize: 'var(--text-14)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--color-foreground)',
                  }}>
                    Total Requests
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-family-geist)',
                    fontSize: 'var(--text-16)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--color-foreground)',
                  }}>
                    {transactions.length}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                }}>
                  <span style={{
                    fontFamily: 'var(--font-family-geist)',
                    fontSize: 'var(--text-14)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--color-foreground)',
                  }}>
                    Total Value
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-family-geist)',
                    fontSize: 'var(--text-16)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: '#22C55E',
                  }}>
                    {formatIDR(totalValue)}
                  </span>
                </div>
              </div>

              {/* Transaction List */}
              <div style={{
                fontFamily: 'var(--font-family-geist)',
                fontSize: 'var(--text-14)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-foreground)',
                marginBottom: '12px',
              }}>
                Preview ({transactions.length} drivers)
              </div>
              <div style={{
                maxHeight: '200px',
                overflowY: 'auto',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius)',
              }}>
                {transactions.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--color-border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{
                        fontFamily: 'var(--font-family-geist)',
                        fontSize: 'var(--text-14)',
                        fontWeight: 'var(--font-weight-medium)',
                        color: 'var(--color-foreground)',
                      }}>
                        {t.driver.name}
                      </div>
                      <div style={{
                        fontFamily: 'var(--font-family-geist)',
                        fontSize: '12px',
                        fontWeight: 'var(--font-weight-normal)',
                        color: 'var(--color-muted-foreground)',
                      }}>
                        {t.redeemItem === 'cash' ? t.bankAccount : t.phoneNumber}
                      </div>
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-family-geist)',
                      fontSize: 'var(--text-14)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: '#22C55E',
                    }}>
                      {formatIDR(t.points)}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div style={{
                fontFamily: 'var(--font-family-geist)',
                fontSize: 'var(--text-14)',
                fontWeight: 'var(--font-weight-normal)',
                color: 'var(--color-muted-foreground)',
                marginBottom: '24px',
              }}>
                Choose how you'd like to send the approved list to the Finance team:
              </div>

              {/* Download CSV Option */}
              <div
                onClick={handleDownloadCSV}
                style={{
                  padding: '20px',
                  border: '2px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  marginBottom: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#7C3AED';
                  e.currentTarget.style.backgroundColor = 'rgba(124, 58, 237, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius)',
                    backgroundColor: 'rgba(124, 58, 237, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#7C3AED',
                  }}>
                    <Download size={24} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontFamily: 'var(--font-family-geist)',
                      fontSize: 'var(--text-16)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--color-foreground)',
                      marginBottom: '4px',
                    }}>
                      Download CSV
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-family-geist)',
                      fontSize: 'var(--text-14)',
                      fontWeight: 'var(--font-weight-normal)',
                      color: 'var(--color-muted-foreground)',
                    }}>
                      Save the list and send it manually to Finance
                    </div>
                  </div>
                </div>
              </div>

              {/* Email Option */}
              <div style={{
                padding: '20px',
                border: '2px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius)',
                    backgroundColor: 'rgba(168, 85, 247, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#A855F7',
                  }}>
                    <Mail size={24} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontFamily: 'var(--font-family-geist)',
                      fontSize: 'var(--text-16)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--color-foreground)',
                      marginBottom: '4px',
                    }}>
                      Send via Email
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-family-geist)',
                      fontSize: 'var(--text-14)',
                      fontWeight: 'var(--font-weight-normal)',
                      color: 'var(--color-muted-foreground)',
                    }}>
                      Opens your email client with pre-filled content
                    </div>
                  </div>
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontFamily: 'var(--font-family-geist)',
                    fontSize: 'var(--text-14)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--color-foreground)',
                    marginBottom: '8px',
                  }}>
                    Finance Email
                  </label>
                  <input
                    type="email"
                    value={financeEmail}
                    onChange={(e) => setFinanceEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius)',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-input-background)',
                      fontFamily: 'var(--font-family-geist)',
                      fontSize: 'var(--text-16)',
                      color: 'var(--color-foreground)',
                      marginBottom: '12px',
                    }}
                  />
                  <button
                    onClick={handleSendEmail}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      borderRadius: 'var(--radius)',
                      border: 'none',
                      backgroundColor: '#A855F7',
                      color: 'white',
                      fontFamily: 'var(--font-family-geist)',
                      fontSize: 'var(--text-14)',
                      fontWeight: 'var(--font-weight-medium)',
                      cursor: 'pointer',
                    }}
                  >
                    Open Email Client
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {step === 1 && (
          <div style={{
            padding: '20px 24px',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
          }}>
            <button
              onClick={() => {
                onClose();
                setStep(1);
                setBatchRef('');
              }}
              style={{
                padding: '10px 20px',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'transparent',
                color: 'var(--color-foreground)',
                fontFamily: 'var(--font-family-geist)',
                fontSize: 'var(--text-14)',
                fontWeight: 'var(--font-weight-medium)',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleApprove}
              disabled={!batchRef.trim() && !isSingleApproval}
              style={{
                padding: '10px 20px',
                borderRadius: 'var(--radius)',
                border: 'none',
                backgroundColor: batchRef.trim() || isSingleApproval ? '#7C3AED' : 'var(--color-muted)',
                color: 'white',
                fontFamily: 'var(--font-family-geist)',
                fontSize: 'var(--text-14)',
                fontWeight: 'var(--font-weight-medium)',
                cursor: batchRef.trim() || isSingleApproval ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              Approve {transactions.length} Request{transactions.length > 1 ? 's' : ''}
              {!isSingleApproval && <ArrowRight size={16} />}
            </button>
          </div>
        )}

        {step === 2 && (
          <div style={{
            padding: '20px 24px',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
          }}>
            <button
              onClick={() => {
                onClose();
                setStep(1);
                setBatchRef('');
              }}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'transparent',
                color: 'var(--color-foreground)',
                fontFamily: 'var(--font-family-geist)',
                fontSize: 'var(--text-14)',
                fontWeight: 'var(--font-weight-medium)',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!(batchRef.trim() || isSingleApproval)}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: 'var(--radius)',
                border: 'none',
                backgroundColor: batchRef.trim() || isSingleApproval ? '#7C3AED' : 'var(--color-muted)',
                color: 'white',
                fontFamily: 'var(--font-family-geist)',
                fontSize: 'var(--text-14)',
                fontWeight: 'var(--font-weight-medium)',
                cursor: batchRef.trim() || isSingleApproval ? 'pointer' : 'not-allowed',
                opacity: batchRef.trim() || isSingleApproval ? 1 : 0.5,
              }}
            >
              {isSingleApproval ? 'Approve Transaction' : `Submit ${transactionIds.length} to Finance`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}