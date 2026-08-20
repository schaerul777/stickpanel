import { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

interface DateRange {
  start: string;
  end: string;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [range, setRange] = useState<{ from?: Date; to?: Date }>(() => ({
    from: value.start ? new Date(value.start) : undefined,
    to: value.end ? new Date(value.end) : undefined,
  }));
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Sync internal state with external value changes (e.g., from clear button)
  useEffect(() => {
    setRange({
      from: value.start ? new Date(value.start) : undefined,
      to: value.end ? new Date(value.end) : undefined,
    });
  }, [value.start, value.end]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (selectedRange: { from?: Date; to?: Date } | undefined) => {
    if (selectedRange) {
      setRange(selectedRange);
      if (selectedRange.from && selectedRange.to) {
        onChange({
          start: format(selectedRange.from, 'yyyy-MM-dd'),
          end: format(selectedRange.to, 'yyyy-MM-dd'),
        });
        setIsOpen(false);
      }
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRange({ from: undefined, to: undefined });
    onChange({ start: '', end: '' });
  };

  const displayText = range.from && range.to
    ? `${format(range.from, 'MMM dd, yyyy')} - ${format(range.to, 'MMM dd, yyyy')}`
    : 'Select date range';

  const hasValue = range.from && range.to;

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 12px',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-input-background)',
          fontFamily: 'var(--font-family-geist)',
          fontSize: 'var(--text-14)',
          color: hasValue ? 'var(--color-foreground)' : 'var(--color-muted-foreground)',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          transition: 'border-color 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-ring)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-border)';
        }}
      >
        <CalendarIcon size={16} style={{ flexShrink: 0, color: 'var(--color-foreground)' }} />
        <span>{displayText}</span>
        {hasValue && (
          <X
            size={16}
            onClick={handleClear}
            style={{ 
              flexShrink: 0, 
              color: 'var(--color-muted-foreground)',
              marginLeft: '4px',
            }}
          />
        )}
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            zIndex: 50,
            backgroundColor: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          }}
        >
          <style>
            {`
              .rdp {
                --rdp-cell-size: 36px;
                --rdp-accent-color: #7C3AED;
                --rdp-background-color: rgba(124, 58, 237, 0.1);
                margin: 0;
              }

              .rdp-months {
                font-family: var(--font-family-geist);
              }

              .rdp-caption {
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 0;
                margin-bottom: 16px;
                position: relative;
                height: 32px;
              }

              .rdp-caption_label {
                font-family: var(--font-family-geist);
                font-size: var(--text-14);
                font-weight: var(--font-weight-semibold);
                color: var(--color-foreground);
                position: absolute;
                left: 50%;
                transform: translateX(-50%);
                z-index: 1;
              }

              .rdp-head_cell {
                font-family: var(--font-family-geist);
                font-size: 12px;
                font-weight: var(--font-weight-medium);
                color: var(--color-muted-foreground);
                text-transform: uppercase;
              }

              .rdp-cell {
                width: var(--rdp-cell-size);
                height: var(--rdp-cell-size);
              }

              .rdp-button {
                width: var(--rdp-cell-size);
                height: var(--rdp-cell-size);
                font-family: var(--font-family-geist);
                font-size: var(--text-14);
                color: var(--color-foreground);
                border-radius: var(--radius);
                border: none;
                background: transparent;
                cursor: pointer;
              }

              .rdp-button:hover:not(.rdp-day_selected):not(.rdp-day_disabled) {
                background-color: var(--color-secondary);
              }

              .rdp-day_selected {
                background-color: #7C3AED !important;
                color: white !important;
                font-weight: var(--font-weight-medium);
              }

              .rdp-day_selected:hover {
                background-color: #6D28D9 !important;
              }

              .rdp-day_range_middle {
                background-color: rgba(124, 58, 237, 0.1) !important;
                color: var(--color-foreground) !important;
              }

              .rdp-day_disabled {
                color: var(--color-muted-foreground);
                opacity: 0.5;
                cursor: not-allowed;
              }

              .rdp-nav {
                display: flex;
                align-items: center;
                justify-content: space-between;
                width: 100%;
                position: relative;
                z-index: 2;
              }

              .rdp-nav_button {
                width: 32px;
                height: 32px;
                border-radius: var(--radius);
                border: none;
                background: transparent;
                color: var(--color-foreground);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0;
                position: relative;
              }

              .rdp-nav_button:hover {
                background-color: var(--color-secondary);
              }

              .rdp-nav_button svg {
                width: 16px;
                height: 16px;
              }

              .rdp-table {
                border-collapse: collapse;
              }
            `}
          </style>
          <DayPicker
            mode="range"
            selected={range}
            onSelect={handleSelect}
            numberOfMonths={1}
            disabled={{ after: new Date() }}
          />
        </div>
      )}
    </div>
  );
}