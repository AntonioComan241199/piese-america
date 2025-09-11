import React, { memo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../../slices/authSlice';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import Sidebar from '../Header/Sidebar';
import { useResponsive } from '../../hooks/useResponsive';
import { LAYOUT_DIMENSIONS } from './constants';

const Layout = memo(({ children }) => {
  const { isMobile } = useResponsive();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
    } catch (error) {
      console.warn('Logout warning:', error);
    }
  };

  const mainStyles = {
    marginLeft: isMobile ? '0' : `${LAYOUT_DIMENSIONS.SIDEBAR_WIDTH}px`,
    padding: '15px',
    width: isMobile ? '100%' : `calc(100% - ${LAYOUT_DIMENSIONS.SIDEBAR_WIDTH}px)`,
    flex: '1',
    transition: 'margin-left 0.3s ease'
  };

  return (
    <>
      <Header />
      
      <div className="d-flex" style={{ minHeight: '100vh' }}>
        {/* Desktop Sidebar */}
        {!isMobile && (
          <Sidebar 
            isAuthenticated={isAuthenticated}
            user={user}
            onLogout={handleLogout}
          />
        )}

        {/* Main Content */}
        <main style={mainStyles}>
          <div className="container-fluid">
            <div className="row justify-content-center">
              <div className="col-xl-8 col-lg-10 col-md-12">
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>
      
      <Footer />
    </>
  );
});

Layout.displayName = 'Layout';

export default Layout;