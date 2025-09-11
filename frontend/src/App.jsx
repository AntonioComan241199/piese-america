import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider, useDispatch, useSelector } from "react-redux";
import { HelmetProvider } from 'react-helmet-async';
import store from "./redux/store/store";
import ErrorBoundary from "./components/ErrorBoundary";
import RouteWrapper from "./components/common/RouteWrapper";
import { FullPageLoading } from "./components/common/LoadingFallback";
import { checkAuth } from "./slices/authSlice";
import { routeConfig, routeMeta } from "./config/routes";

// 404 Page component
const NotFound = () => (
  <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
    <div className="text-center">
      <div className="mb-4">
        <i className="ri-error-warning-line text-warning" style={{ fontSize: '4rem' }}></i>
      </div>
      <h1 className="h2 mb-3">404 - Pagina nu a fost găsită</h1>
      <p className="text-muted mb-4">
        Ne pare rău, dar pagina pe care o cauți nu există.
      </p>
      <div className="d-flex gap-2 justify-content-center">
        <a href="/" className="btn btn-primary">
          <i className="ri-home-line me-2"></i>
          Înapoi acasă
        </a>
        <button 
          className="btn btn-outline-secondary"
          onClick={() => window.history.back()}
        >
          <i className="ri-arrow-left-line me-2"></i>
          Înapoi
        </button>
      </div>
    </div>
  </div>
);

// App wrapper component
const AppWrapper = () => {
  const dispatch = useDispatch();
  const { authChecked } = useSelector((state) => state.auth);

  // Check authentication on app load
  useEffect(() => {
    if (!authChecked) {
      dispatch(checkAuth());
    }
  }, [dispatch, authChecked]);

  // Show loading screen while checking authentication
  if (!authChecked) {
    return <FullPageLoading message="Inițializare aplicație..." />;
  }

  return (
    <ErrorBoundary>
      <Routes>
        {/* Generate routes dynamically from config */}
        {routeConfig.map((route) => {
          const { path, component, layout, protection, title } = route;
          
          return (
            <Route
              key={path}
              path={path}
              element={
                <RouteWrapper
                  component={component}
                  layout={layout}
                  protection={protection}
                  title={title}
                />
              }
            />
          );
        })}
        
        {/* 404 Route - must be last */}
        <Route 
          path="*" 
          element={
            <RouteWrapper
              component={NotFound}
              layout={false}
              protection="public"
              title="Pagina nu a fost găsită"
            />
          } 
        />
      </Routes>
    </ErrorBoundary>
  );
};

// SEO Meta component
const SEOMeta = () => {
  const location = window.location;
  const currentPath = location.pathname;
  const meta = routeMeta[currentPath] || {
    title: 'Piese Auto America',
    description: 'Piese auto de calitate pentru toate tipurile de vehicule'
  };

  useEffect(() => {
    // Update page title
    document.title = meta.title;
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', meta.description);
    } else {
      const newMeta = document.createElement('meta');
      newMeta.name = 'description';
      newMeta.content = meta.description;
      document.head.appendChild(newMeta);
    }

    // Update Open Graph meta tags
    const updateOrCreateOGMeta = (property, content) => {
      let ogMeta = document.querySelector(`meta[property="${property}"]`);
      if (ogMeta) {
        ogMeta.setAttribute('content', content);
      } else {
        ogMeta = document.createElement('meta');
        ogMeta.setAttribute('property', property);
        ogMeta.setAttribute('content', content);
        document.head.appendChild(ogMeta);
      }
    };

    updateOrCreateOGMeta('og:title', meta.title);
    updateOrCreateOGMeta('og:description', meta.description);
    updateOrCreateOGMeta('og:url', location.href);
    updateOrCreateOGMeta('og:type', 'website');
  }, [currentPath, meta, location.href]);

  return null;
};

// Performance monitoring hook
const usePerformanceMonitoring = () => {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      // Monitor navigation timing
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            // Log slow page loads
            if (entry.loadEventEnd - entry.loadEventStart > 3000) {
              console.warn('Slow page load detected:', entry.loadEventEnd - entry.loadEventStart, 'ms');
            }
          }
        }
      });

      observer.observe({ type: 'navigation', buffered: true });

      return () => observer.disconnect();
    }
  }, []);
};

// Main App component
export default function App() {
  usePerformanceMonitoring();

  return (
    <Provider store={store}>
      <HelmetProvider>
        <BrowserRouter>
          <SEOMeta />
          <AppWrapper />
        </BrowserRouter>
      </HelmetProvider>
    </Provider>
  );
}