import { useState, useRef } from 'react';
import { X, Upload, TriangleAlert, CircleCheck, CircleX } from 'lucide-react';

interface UploadResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (results: Array<{ id: string; status: 'paid' | 'failed'; notes: string }>) => void;
}

export function UploadResultsModal({ isOpen, onClose, onUpload }: UploadResultsModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [isDragging, setIsDragging] = useState(false);
  const [parsedResults, setParsedResults] = useState<Array<{ id: string; status: 'paid' | 'failed'; notes: string }>>([]);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileUpload = (file: File) => {
    setError('');
    
    if (!file.name.endsWith('.csv')) {
      setError('Invalid file type. Please upload a CSV file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      // Skip header row
      const dataLines = lines.slice(1);
      
      const results = dataLines.map(line => {
        const [id, status, notes] = line.split(',').map(s => s.trim());
        return {
          id,
          status: status.toLowerCase() === 'paid' ? 'paid' as const : 'failed' as const,
          notes: notes || '',
        };
      });

      setParsedResults(results);
      setStep(2);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleApply = () => {
    onUpload(parsedResults);
    onClose();
    setStep(1);
    setParsedResults([]);
  };

  const completedCount = parsedResults.filter(r => r.status === 'paid').length;
  const failedCount = parsedResults.filter(r => r.status === 'failed').length;

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
            Upload Results
          </div>
          <button
            onClick={() => {
              onClose();
              setStep(1);
              setParsedResults([]);
              setError('');
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
              {/* Upload Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                style={{
                  border: `2px dashed ${isDragging ? '#3B82F6' : 'var(--color-border)'}`,
                  borderRadius: 'var(--radius-lg)',
                  padding: '48px 24px',
                  textAlign: 'center',
                  backgroundColor: isDragging ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                  marginBottom: '20px',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  color: '#3B82F6',
                }}>
                  <Upload size={32} />
                </div>
                <div style={{
                  fontFamily: 'var(--font-family-geist)',
                  fontSize: 'var(--text-16)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--color-foreground)',
                  marginBottom: '8px',
                }}>
                  Drag and drop your CSV file here
                </div>
                <div style={{
                  fontFamily: 'var(--font-family-geist)',
                  fontSize: 'var(--text-14)',
                  fontWeight: 'var(--font-weight-normal)',
                  color: 'var(--color-muted-foreground)',
                  marginBottom: '16px',
                }}>
                  or
                </div>
                <label style={{
                  display: 'inline-block',
                  padding: '10px 20px',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-card)',
                  color: 'var(--color-foreground)',
                  fontFamily: 'var(--font-family-geist)',
                  fontSize: 'var(--text-14)',
                  fontWeight: 'var(--font-weight-medium)',
                  cursor: 'pointer',
                }}>
                  Browse Files
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileInput}
                    style={{ display: 'none' }}
                    ref={fileInputRef}
                  />
                </label>
              </div>

              {error && (
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 'var(--radius)',
                  color: '#EF4444',
                  fontFamily: 'var(--font-family-geist)',
                  fontSize: 'var(--text-14)',
                  fontWeight: 'var(--font-weight-normal)',
                  marginBottom: '20px',
                }}>
                  {error}
                </div>
              )}

              {/* Format Hint */}
              <div style={{
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                borderRadius: 'var(--radius)',
                padding: '16px',
              }}>
                <div style={{
                  fontFamily: 'var(--font-family-geist)',
                  fontSize: 'var(--text-14)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: '#F59E0B',
                  marginBottom: '8px',
                }}>
                  Expected CSV Format
                </div>
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  color: 'var(--color-muted-foreground)',
                  whiteSpace: 'pre',
                  backgroundColor: 'var(--color-card)',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                }}>
                  {`Transaction ID, Status, Notes\nTXN-001, Paid, Success\nTXN-002, Failed, Invalid account`}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Stats */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginBottom: '20px',
              }}>
                <div style={{
                  padding: '16px',
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                  borderRadius: 'var(--radius)',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px',
                  }}>
                    <CircleCheck size={20} color="#22C55E" />
                    <span style={{
                      fontFamily: 'var(--font-family-geist)',
                      fontSize: 'var(--text-14)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: '#22C55E',
                    }}>
                      Paid
                    </span>
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-family-geist)',
                    fontSize: 'var(--text-24)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: '#22C55E',
                  }}>
                    {completedCount}
                  </div>
                </div>
                <div style={{
                  padding: '16px',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  borderRadius: 'var(--radius)',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px',
                  }}>
                    <CircleX size={20} color="#EF4444" />
                    <span style={{
                      fontFamily: 'var(--font-family-geist)',
                      fontSize: 'var(--text-14)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: '#EF4444',
                    }}>
                      Failed
                    </span>
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-family-geist)',
                    fontSize: 'var(--text-24)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: '#EF4444',
                  }}>
                    {failedCount}
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div style={{
                display: 'flex',
                gap: '12px',
                padding: '12px 16px',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: 'var(--radius)',
                marginBottom: '20px',
              }}>
                <TriangleAlert size={20} color="#F59E0B" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{
                  fontFamily: 'var(--font-family-geist)',
                  fontSize: 'var(--text-14)',
                  fontWeight: 'var(--font-weight-normal)',
                  color: '#F59E0B',
                }}>
                  This action will update {parsedResults.length} transactions. Please review carefully before applying.
                </div>
              </div>

              {/* Results Preview */}
              <div style={{
                fontFamily: 'var(--font-family-geist)',
                fontSize: 'var(--text-14)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-foreground)',
                marginBottom: '12px',
              }}>
                Preview ({parsedResults.length} transactions)
              </div>
              <div style={{
                maxHeight: '240px',
                overflowY: 'auto',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius)',
              }}>
                {parsedResults.map((result, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '12px 16px',
                      borderBottom: idx < parsedResults.length - 1 ? '1px solid var(--color-border)' : 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        color: '#3B82F6',
                        marginBottom: '4px',
                      }}>
                        {result.id}
                      </div>
                      {result.notes && (
                        <div style={{
                          fontFamily: 'var(--font-family-geist)',
                          fontSize: '12px',
                          fontWeight: 'var(--font-weight-normal)',
                          color: 'var(--color-muted-foreground)',
                        }}>
                          {result.notes}
                        </div>
                      )}
                    </div>
                    <div style={{
                      padding: '4px 12px',
                      borderRadius: '999px',
                      backgroundColor: result.status === 'paid' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: result.status === 'paid' ? '#22C55E' : '#EF4444',
                      fontFamily: 'var(--font-family-geist)',
                      fontSize: '12px',
                      fontWeight: 'var(--font-weight-medium)',
                    }}>
                      {result.status}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
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
                setStep(1);
                setParsedResults([]);
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
              onClick={handleApply}
              style={{
                padding: '10px 20px',
                borderRadius: 'var(--radius)',
                border: 'none',
                backgroundColor: '#22C55E',
                color: 'white',
                fontFamily: 'var(--font-family-geist)',
                fontSize: 'var(--text-14)',
                fontWeight: 'var(--font-weight-medium)',
                cursor: 'pointer',
              }}
            >
              Apply {parsedResults.length} Updates
            </button>
          </div>
        )}
      </div>
    </div>
  );
}