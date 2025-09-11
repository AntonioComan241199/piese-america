import React from 'react';
import { Spinner } from 'react-bootstrap';

// Component de loading pentru lazy loading
const LoadingFallback = ({ message = "Se încarcă...", variant = "primary", size = "md" }) => {
  const spinnerSize = size === "sm" ? "sm" : size === "lg" ? "lg" : undefined;

  return (
    <div className="d-flex flex-column align-items-center justify-content-center p-4">
      <Spinner 
        animation="border" 
        variant={variant} 
        size={spinnerSize}
        className="mb-3"
      />
      <p className="text-muted mb-0">{message}</p>
    </div>
  );
};

// Loading pentru pagina întreagă
export const FullPageLoading = ({ message = "Se încarcă aplicația..." }) => (
  <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
    <div className="text-center">
      <div className="mb-4">
        <Spinner 
          animation="border" 
          variant="primary" 
          style={{ width: '3rem', height: '3rem' }}
        />
      </div>
      <h5 className="text-primary mb-2">Piese Auto America</h5>
      <p className="text-muted">{message}</p>
    </div>
  </div>
);

// Loading pentru secțiuni mai mici
export const SectionLoading = ({ message = "Se încarcă...", height = "200px" }) => (
  <div 
    className="d-flex align-items-center justify-content-center bg-light rounded"
    style={{ minHeight: height }}
  >
    <LoadingFallback message={message} size="sm" />
  </div>
);

// Loading pentru butoane
export const ButtonLoading = ({ loading, children, ...props }) => (
  <button {...props} disabled={loading || props.disabled}>
    {loading && (
      <Spinner
        as="span"
        animation="border"
        size="sm"
        role="status"
        aria-hidden="true"
        className="me-2"
      />
    )}
    {children}
  </button>
);

// Loading pentru carduri
export const CardLoading = () => (
  <div className="card">
    <div className="card-body">
      <div className="d-flex align-items-center">
        <Spinner animation="border" size="sm" className="me-3" />
        <div>
          <div className="placeholder col-6 mb-2"></div>
          <div className="placeholder col-8"></div>
        </div>
      </div>
    </div>
  </div>
);

// Loading skeleton pentru liste
export const ListItemSkeleton = ({ count = 3 }) => (
  <>
    {Array.from({ length: count }, (_, index) => (
      <div key={index} className="d-flex align-items-center p-3 border-bottom">
        <div className="placeholder rounded-circle me-3" style={{ width: '40px', height: '40px' }}></div>
        <div className="flex-grow-1">
          <div className="placeholder col-6 mb-2"></div>
          <div className="placeholder col-8"></div>
        </div>
      </div>
    ))}
  </>
);

export default LoadingFallback;