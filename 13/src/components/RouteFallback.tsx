import React from 'react';

interface RouteFallbackProps {
  routeName?: string;
}

/**
 * RouteFallback Component - Practical 8
 * Sleek Apple-styled fallback UI rendered by React <Suspense> during lazy chunk downloads
 */
export const RouteFallback: React.FC<RouteFallbackProps> = ({ routeName }) => {
  return (
    <div className="route-fallback-container">
      <div className="route-fallback-card">
        {/* Pulsing Loading Spinner Ring */}
        <div className="fallback-spinner-ring">
          <div className="spinner-slice"></div>
          <div className="spinner-slice"></div>
          <div className="spinner-slice"></div>
        </div>

        <h3 className="fallback-title">
          Loading {routeName ? `${routeName} Module...` : 'Page Component...'}
        </h3>
        <p className="fallback-subtitle">
          Fetching code-split JavaScript chunk on demand via <code>React.lazy()</code> &amp; <code>Suspense</code>
        </p>

        {/* Skeleton Screen Placeholders */}
        <div className="fallback-skeleton-group">
          <div className="skeleton-bar skeleton-title-bar"></div>
          <div className="skeleton-bar skeleton-text-bar"></div>
          <div className="skeleton-bar skeleton-text-bar short"></div>
        </div>

        <div className="fallback-badge">
          <span>⚡ Code-Split Active • Zero Initial Overhead</span>
        </div>
      </div>
    </div>
  );
};

export default RouteFallback;
