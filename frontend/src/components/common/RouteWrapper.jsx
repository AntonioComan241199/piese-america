import React, { Suspense } from 'react';
import { useSelector } from 'react-redux';
import Layout from '../Layout/Layout';
import LoadingFallback, { FullPageLoading } from './LoadingFallback';
import { Navigate } from 'react-router-dom';

const RouteWrapper = ({ 
  component: Component, 
  layout = true, 
  protection = 'public',
  title,
  fallback = <LoadingFallback message="Se încarcă pagina..." />,
  ...props 
}) => {
  const { isAuthenticated, user, authChecked } = useSelector((state) => state.auth);

  // Hook-urile trebuie să fie apelate întotdeauna în aceeași ordine
  React.useEffect(() => {
    if (title) {
      const originalTitle = document.title;
      document.title = `${title} - Piese Auto America`;
      
      return () => {
        document.title = originalTitle;
      };
    }
  }, [title]);

  // Așteaptă ca auth să fie verificat
  if (!authChecked) {
    return <FullPageLoading message="Verificare autentificare..." />;
  }

  // Logic de protecție a rutelor
  const checkAccess = () => {
    switch (protection) {
      case 'guest':
        // Doar utilizatorii neautentificați pot accesa (login, register, etc.)
        if (isAuthenticated) {
          return <Navigate to="/" replace />;
        }
        break;
      
      case 'auth':
        // Doar utilizatorii autentificați pot accesa
        if (!isAuthenticated) {
          return <Navigate to="/signin" replace />;
        }
        break;
      
      case 'admin':
        // Doar administratorii pot accesa
        if (!isAuthenticated) {
          return <Navigate to="/signin" replace />;
        }
        if (user?.role !== 'admin') {
          return <Navigate to="/" replace />;
        }
        break;
      
      case 'public':
      default:
        // Oricine poate accesa
        break;
    }
    return null;
  };

  const redirectComponent = checkAccess();
  if (redirectComponent) {
    return redirectComponent;
  }

  // Component cu sau fără layout
  const WrappedComponent = (
    <Suspense fallback={fallback}>
      <Component {...props} />
    </Suspense>
  );

  if (layout) {
    return (
      <Layout>
        {WrappedComponent}
      </Layout>
    );
  }

  return WrappedComponent;
};

export default RouteWrapper;