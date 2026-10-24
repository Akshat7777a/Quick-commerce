import { Modal, Spinner } from "./ui";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  busy = false,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="btn btn-secondary btn-sm">
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="btn btn-sm bg-clay text-cream hover:bg-[#9c4826]"
          >
            {busy ? <Spinner /> : confirmLabel}
          </button>
        </div>
      }
    >
      <p className="text-[12.5px] leading-relaxed text-ink-soft">
        This can&apos;t be undone. Make sure you don&apos;t need it before continuing.
      </p>
    </Modal>
  );
}
