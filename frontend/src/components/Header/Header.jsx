import React, { memo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../../slices/authSlice';
import TopHeader from './TopHeader';
import MobileNavbar from './MobileNavbar';

const Header = memo(() => {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
    } catch (error) {
      // Logout errors are generally not critical - user intent is clear
      console.warn('Logout warning:', error);
    }
  };

  return (
    <header>
      <TopHeader 
        isAuthenticated={isAuthenticated} 
        user={user} 
        onLogout={handleLogout} 
      />
      
      <MobileNavbar
        isAuthenticated={isAuthenticated}
        user={user}
        onLogout={handleLogout}
      />
    </header>
  );
});

Header.displayName = 'Header';

export default Header;