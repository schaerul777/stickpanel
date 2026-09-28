import { Pencil, Trash2, RotateCcw } from 'lucide-react';

interface RowActionsProps {
  deleted: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onRestore?: () => void;
}

const iconBtn = {
  padding: 7, borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-card)', cursor: 'pointer', display: 'inline-flex',
} as const;

export function RowActions({ deleted, onEdit, onDelete, onRestore }: RowActionsProps) {
  if (deleted) {
    return (
      <button onClick={onRestore} style={{ ...iconBtn, color: '#10B981' }} aria-label="Restore" title="Restore">
        <RotateCcw size={14} />
      </button>
    );
  }
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {onEdit && (
        <button onClick={onEdit} style={{ ...iconBtn, color: 'var(--color-foreground)' }} aria-label="Edit" title="Edit">
          <Pencil size={14} />
        </button>
      )}
      {onDelete && (
        <button onClick={onDelete} style={{ ...iconBtn, color: '#EF4444' }} aria-label="Delete" title="Delete">
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}
