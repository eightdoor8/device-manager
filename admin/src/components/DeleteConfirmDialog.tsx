import React from "react";
import "../styles/DeleteConfirmDialog.css";

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  deviceName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function DeleteConfirmDialog({
  isOpen,
  deviceName,
  onConfirm,
  onCancel,
  isLoading = false,
}: DeleteConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="delete-confirm-overlay">
      <div className="delete-confirm-dialog">
        <h2>端末を削除しますか？</h2>
        <p>
          <strong>{deviceName}</strong> を削除してもよろしいですか？
        </p>
        <p className="warning-text">この操作は取り消せません。</p>
        <div className="dialog-buttons">
          <button
            className="cancel-button"
            onClick={onCancel}
            disabled={isLoading}
          >
            キャンセル
          </button>
          <button
            className="confirm-button"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "削除中..." : "削除"}
          </button>
        </div>
      </div>
    </div>
  );
}
