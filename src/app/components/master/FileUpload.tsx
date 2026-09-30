import { useRef, useState } from 'react';
import { FileText, Upload, X, ImagePlus } from 'lucide-react';
import { labelStyle, helperStyle, errorTextStyle, secondaryButtonStyle } from './styles';

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = 'image/png,image/jpeg,application/pdf';

interface FileUploadProps {
  label: string;
  value: string | null;
  fileName?: string | null;
  onChange: (dataUrl: string | null, fileName: string | null) => void;
}

function isImageDataUrl(v: string | null): boolean {
  return !!v && v.startsWith('data:image/');
}

export function FileUpload({ label, value, fileName, onChange }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!/^(image\/(png|jpe?g)|application\/pdf)$/.test(file.type)) {
      setError('Only PNG, JPG, or PDF files are allowed');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('File must be 5MB or smaller');
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string, file.name);
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: 56, height: 56, borderRadius: 'var(--radius)',
          border: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0,
        }}>
          {isImageDataUrl(value)
            ? <img src={value!} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : value
              ? <FileText size={20} style={{ color: 'var(--color-muted-foreground)' }} />
              : <ImagePlus size={20} style={{ color: 'var(--color-muted-foreground)' }} />}
        </div>
        <div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" onClick={() => inputRef.current?.click()} style={secondaryButtonStyle}>
              <Upload size={13} /> {value ? 'Replace' : 'Upload'}
            </button>
            {value && (
              <button type="button" onClick={() => onChange(null, null)} style={{ ...secondaryButtonStyle, color: '#EF4444' }}>
                <X size={14} /> Remove
              </button>
            )}
          </div>
          {value && fileName && (
            <div style={{ ...helperStyle, marginTop: 6 }}>{fileName}</div>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          style={{ display: 'none' }}
          onChange={e => { handleFile(e.target.files?.[0]); e.target.value = ''; }}
        />
      </div>
      {error ? <div style={errorTextStyle}>{error}</div> : <div style={helperStyle}>PNG, JPG, or PDF, up to 5MB</div>}
    </div>
  );
}
