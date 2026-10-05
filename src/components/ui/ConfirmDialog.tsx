import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  loading,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title} size="sm">
      <div className="flex flex-col items-center text-center py-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3 w-full">
          <button className="btn-secondary flex-1" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button className="btn-danger flex-1" onClick={onConfirm} disabled={loading}>
            {loading ? 'Deleting...' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
