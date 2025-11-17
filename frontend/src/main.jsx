import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// CSS imports în ordine optimă
import 'bootstrap/dist/css/bootstrap.min.css';
import 'remixicon/fonts/remixicon.css';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import './index.css';

// Global error handler pentru erori necapturate
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  // Poți trimite la un serviciu de monitoring ca Sentry
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // Poți trimite la un serviciu de monitoring ca Sentry
});

// Top-level error boundary component
class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Global Error Boundary caught an error:', error, errorInfo);
    
    // Aici poți trimite eroarea către un serviciu de monitoring
    //例如: Sentry.captureException(error, { contexts: { errorInfo } });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
          <div className="text-center p-4">
            <div className="mb-4">
              <i className="ri-error-warning-line text-danger" style={{ fontSize: '4rem' }}></i>
            </div>
            <h1 className="h3 mb-3 text-dark">Oops! Ceva nu a mers bine</h1>
            <p className="text-muted mb-4">
              Ne pare rău, dar a apărut o problemă tehnică. Te rugăm să reîncerci.
            </p>
            <div className="d-flex gap-2 justify-content-center">
              <button 
                className="btn btn-primary"
                onClick={() => window.location.reload()}
              >
                <i className="ri-refresh-line me-2"></i>
                Reîncarcă pagina
              </button>
              <button 
                className="btn btn-outline-secondary"
                onClick={() => window.location.href = '/'}
              >
                <i className="ri-home-line me-2"></i>
                Înapoi acasă
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 text-start">
                <summary className="btn btn-sm btn-outline-danger">
                  Detalii eroare (Development)
                </summary>
                <pre className="bg-dark text-light p-3 mt-2 rounded small overflow-auto">
                  {this.state.error?.toString()}
                  {'\n\n'}
                  {this.state.error?.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}


const root = createRoot(document.getElementById('root'));

// Render cu StrictMode și Error Boundary
root.render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </React.StrictMode>
);