import React from 'react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
  return (
    <div className="error-box">
      <div className="error-icon-wrapper">
        <svg className="error-icon" viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" strokeWidth="2" fill="none">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <div className="error-content">
        <h4 className="error-title">Failed to Fetch Repositories</h4>
        <p className="error-message">{message}</p>
        {onRetry && (
          <button type="button" className="btn btn-secondary retry-btn" onClick={onRetry}>
            🔄 Retry Fetching
          </button>
        )}
      </div>
    </div>
  );
};
