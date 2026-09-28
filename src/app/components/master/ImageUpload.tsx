import { useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { labelStyle, helperStyle, errorTextStyle, secondaryButtonStyle } from './styles';

const MAX_BYTES = 2 * 1024 * 1024;

interface ImageUploadProps {
  label: string;
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  size?: number;
}

export function ImageUpload({ label, value, onChange, size = 72 }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!/^image\/(png|jpe?g)$/.test(file.type)) {
      setError('Only PNG or JPG images are allowed');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('Image must be 2MB or smaller');
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: size, height: size, borderRadius: 'var(--radius)',
          border: '1px solid var(--color-border)', backgroundColor: 'var(--color-secondary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0,
        }}>
          {value
            ? <img src={value} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <ImagePlus size={20} style={{ color: 'var(--color-muted-foreground)' }} />}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            style={secondaryButtonStyle}
          >
            {value ? 'Replace' : 'Upload'}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              style={{ ...secondaryButtonStyle, color: '#EF4444' }}
            >
              <X size={14} /> Remove
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg"
          style={{ display: 'none' }}
          onChange={e => { handleFile(e.target.files?.[0]); e.target.value = ''; }}
        />
      </div>
      {error ? <div style={errorTextStyle}>{error}</div> : <div style={helperStyle}>PNG or JPG, up to 2MB</div>}
    </div>
  );
}
