import { X, Check, CircleX } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { useState, useEffect } from 'react';

interface Transaction {
  id: string;
  driver: { name: string; phone: string };
  redeemItem: 'cash' | 'credit';
  points: number;
  status: 'new' | 'submitted' | 'paid' | 'failed';
  requestedAt: string;
  bankAccount?: string;
  bankName?: string;
  phoneNumber?: string;
  notes?: string;
  processedAt?: string;
}

interface DetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onApprove?: (id: string) => void;
  onMarkCompleted?: (id: string) => void;
  onMarkFailed?: (id: string) => void;
}

export function DetailDrawer({ isOpen, onClose, transaction, onApprove, onMarkCompleted, onMarkFailed }: DetailDrawerProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Small delay to trigger animation after render
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
      // Wait for animation to complete before unmounting
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender || !transaction) return null;

  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          zIndex: 40,
          opacity: isAnimating ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out',
        }}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed',
        right: 0,
        top: 0,
        bottom: 0,
        width: '480px',
        backgroundColor: 'var(--color-card)',
        boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.1)',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        transform: isAnimating ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s ease-in-out',
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
            Transaction Details
          </div>
          <button
            onClick={onClose}
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
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {/* Driver Info */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              fontFamily: 'var(--font-family-geist)',
              fontSize: 'var(--text-24)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-foreground)',
              marginBottom: '8px',
            }}>
              {transaction.driver.name}
            </div>
            <div style={{
              fontFamily: 'monospace',
              fontSize: '12px',
              color: '#3B82F6',
              marginBottom: '8px',
            }}>
              {transaction.id}
            </div>
            <StatusBadge status={transaction.status} />
          </div>

          {/* Value Card */}
          <div style={{
            backgroundColor: '#0F172A',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            marginBottom: '24px',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '24px',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: 'var(--font-family-geist)',
                  fontSize: 'var(--text-14)',
                  fontWeight: 'var(--font-weight-normal)',
                  color: '#94A3B8',
                  marginBottom: '4px',
                }}>
                  Redeem Item
                </div>
                <div style={{
                  fontFamily: 'var(--font-family-geist)',
                  fontSize: 'var(--text-24)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'white',
                }}>
                  {transaction.redeemItem === 'cash' ? 'Cash Transfer' : 'Mobile Credit'}
                </div>
              </div>
              <div style={{
                width: '1px',
                height: '48px',
                backgroundColor: 'rgba(148, 163, 184, 0.2)',
              }} />
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: 'var(--font-family-geist)',
                  fontSize: 'var(--text-14)',
                  fontWeight: 'var(--font-weight-normal)',
                  color: '#94A3B8',
                  marginBottom: '4px',
                }}>
                  Points
                </div>
                <div style={{
                  fontFamily: 'var(--font-family-geist)',
                  fontSize: 'var(--text-24)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: '#22C55E',
                }}>
                  {transaction.points.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Driver Info Section */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              fontFamily: 'var(--font-family-geist)',
              fontSize: 'var(--text-14)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-foreground)',
              marginBottom: '12px',
            }}>
              Driver Information
            </div>
            <div style={{
              backgroundColor: 'var(--color-secondary)',
              borderRadius: 'var(--radius)',
              padding: '16px',
            }}>
              <div style={{ marginBottom: '12px' }}>
                <div style={{
                  fontFamily: 'var(--font-family-geist)',
                  fontSize: '12px',
                  fontWeight: 'var(--font-weight-normal)',
                  color: 'var(--color-muted-foreground)',
                  marginBottom: '4px',
                }}>
                  Name
                </div>
                <div style={{
                  fontFamily: 'var(--font-family-geist)',
                  fontSize: 'var(--text-14)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--color-foreground)',
                }}>
                  {transaction.driver.name}
                </div>
              </div>
              <div>
                <div style={{
                  fontFamily: 'var(--font-family-geist)',
                  fontSize: '12px',
                  fontWeight: 'var(--font-weight-normal)',
                  color: 'var(--color-muted-foreground)',
                  marginBottom: '4px',
                }}>
                  Phone Number
                </div>
                <div style={{
                  fontFamily: 'var(--font-family-geist)',
                  fontSize: 'var(--text-14)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--color-foreground)',
                }}>
                  {transaction.driver.phone}
                </div>
              </div>
            </div>
          </div>

          {/* Redeem Info Section */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              fontFamily: 'var(--font-family-geist)',
              fontSize: 'var(--text-14)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-foreground)',
              marginBottom: '12px',
            }}>
              Redeem Information
            </div>
            <div style={{
              backgroundColor: 'var(--color-secondary)',
              borderRadius: 'var(--radius)',
              padding: '16px',
            }}>
              <div style={{ marginBottom: '12px' }}>
                <div style={{
                  fontFamily: 'var(--font-family-geist)',
                  fontSize: '12px',
                  fontWeight: 'var(--font-weight-normal)',
                  color: 'var(--color-muted-foreground)',
                  marginBottom: '4px',
                }}>
                  Redeem Type
                </div>
                <div style={{
                  fontFamily: 'var(--font-family-geist)',
                  fontSize: 'var(--text-14)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--color-foreground)',
                }}>
                  {transaction.redeemItem === 'cash' ? '🏦 Cash Transfer' : '📱 Mobile Credit'}
                </div>
              </div>
              {transaction.redeemItem === 'cash' && (
                <>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{
                      fontFamily: 'var(--font-family-geist)',
                      fontSize: '12px',
                      fontWeight: 'var(--font-weight-normal)',
                      color: 'var(--color-muted-foreground)',
                      marginBottom: '4px',
                    }}>
                      Bank Name
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-family-geist)',
                      fontSize: 'var(--text-14)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--color-foreground)',
                    }}>
                      {transaction.bankName}
                    </div>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{
                      fontFamily: 'var(--font-family-geist)',
                      fontSize: '12px',
                      fontWeight: 'var(--font-weight-normal)',
                      color: 'var(--color-muted-foreground)',
                      marginBottom: '4px',
                    }}>
                      Account Number
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-family-geist)',
                      fontSize: 'var(--text-14)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--color-foreground)',
                    }}>
                      {transaction.bankAccount}
                    </div>
                  </div>
                </>
              )}
              {transaction.redeemItem === 'credit' && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{
                    fontFamily: 'var(--font-family-geist)',
                    fontSize: '12px',
                    fontWeight: 'var(--font-weight-normal)',
                    color: 'var(--color-muted-foreground)',
                    marginBottom: '4px',
                  }}>
                    Phone Number
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-family-geist)',
                    fontSize: 'var(--text-14)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--color-foreground)',
                  }}>
                    {transaction.phoneNumber}
                  </div>
                </div>
              )}
              <div style={{ marginBottom: '12px' }}>
                <div style={{
                  fontFamily: 'var(--font-family-geist)',
                  fontSize: '12px',
                  fontWeight: 'var(--font-weight-normal)',
                  color: 'var(--color-muted-foreground)',
                  marginBottom: '4px',
                }}>
                  Requested At
                </div>
                <div style={{
                  fontFamily: 'var(--font-family-geist)',
                  fontSize: 'var(--text-14)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--color-foreground)',
                }}>
                  {new Date(transaction.requestedAt).toLocaleString('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </div>
              </div>
              {transaction.processedAt && (
                <div style={{ marginTop: '12px' }}>
                  <div style={{
                    fontFamily: 'var(--font-family-geist)',
                    fontSize: '12px',
                    fontWeight: 'var(--font-weight-normal)',
                    color: 'var(--color-muted-foreground)',
                    marginBottom: '4px',
                  }}>
                    Processed Date
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-family-geist)',
                    fontSize: 'var(--text-14)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--color-foreground)',
                  }}>
                    {new Date(transaction.processedAt).toLocaleString('en-US', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {transaction.notes && (
            <div>
              <div style={{
                fontFamily: 'var(--font-family-geist)',
                fontSize: 'var(--text-14)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-foreground)',
                marginBottom: '12px',
              }}>
                Notes
              </div>
              <div style={{
                backgroundColor: 'var(--color-secondary)',
                borderRadius: 'var(--radius)',
                padding: '16px',
                fontFamily: 'var(--font-family-geist)',
                fontSize: 'var(--text-14)',
                fontWeight: 'var(--font-weight-normal)',
                color: 'var(--color-muted-foreground)',
              }}>
                {transaction.notes}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '20px 24px',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          gap: '12px',
        }}>
          {transaction.status === 'new' && onApprove && (
            <button
              onClick={() => onApprove(transaction.id)}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: 'var(--radius)',
                border: 'none',
                backgroundColor: '#7C3AED',
                color: 'white',
                fontFamily: 'var(--font-family-geist)',
                fontSize: 'var(--text-14)',
                fontWeight: 'var(--font-weight-medium)',
                cursor: 'pointer',
              }}
            >
              Approve Transaction
            </button>
          )}
          {transaction.status === 'submitted' && (
            <>
              {onMarkCompleted && (
                <button
                  onClick={() => onMarkCompleted(transaction.id)}
                  style={{
                    flex: 1,
                    padding: '12px 20px',
                    borderRadius: 'var(--radius)',
                    border: 'none',
                    backgroundColor: '#22C55E',
                    color: 'white',
                    fontFamily: 'var(--font-family-geist)',
                    fontSize: 'var(--text-14)',
                    fontWeight: 'var(--font-weight-medium)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <Check size={16} />
                  Mark as Paid
                </button>
              )}
              {onMarkFailed && (
                <button
                  onClick={() => onMarkFailed(transaction.id)}
                  style={{
                    flex: 1,
                    padding: '12px 20px',
                    borderRadius: 'var(--radius)',
                    border: 'none',
                    backgroundColor: '#EF4444',
                    color: 'white',
                    fontFamily: 'var(--font-family-geist)',
                    fontSize: 'var(--text-14)',
                    fontWeight: 'var(--font-weight-medium)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <CircleX size={16} />
                  Mark Failed
                </button>
              )}
            </>
          )}
          {(transaction.status === 'paid' || transaction.status === 'failed') && (
            <div style={{
              flex: 1,
              textAlign: 'center',
              padding: '12px',
              fontFamily: 'var(--font-family-geist)',
              fontSize: 'var(--text-14)',
              color: 'var(--color-muted-foreground)',
            }}>
              — No actions available —
            </div>
          )}
        </div>
      </div>
    </>
  );
}