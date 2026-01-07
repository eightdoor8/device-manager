import "../styles/ErrorMessage.css";

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="error-message-container">
      <div className="error-icon">⚠️</div>
      <div className="error-content">
        <h3>エラーが発生しました</h3>
        <p>{message}</p>
        {onRetry && (
          <button onClick={onRetry} className="retry-button">
            もう一度試す
          </button>
        )}
      </div>
    </div>
  );
}
