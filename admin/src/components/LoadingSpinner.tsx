import "../styles/LoadingSpinner.css";

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = "読み込み中..." }: LoadingSpinnerProps) {
  return (
    <div className="loading-spinner-container">
      <div className="spinner"></div>
      <p>{message}</p>
    </div>
  );
}
