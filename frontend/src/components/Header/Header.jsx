import React, { memo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../../slices/authSlice';
import TopHeader from './TopHeader';
import MobileNavbar from './MobileNavbar';

const Header = memo(() => {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  
  // 1. Extrage produsele din coș
  const { items } = useSelector((state) => state.cart);
  
  // 2. Calculează numărul total de produse
  const cartItemsCount = items.reduce((acc, item) => acc + item.qty, 0);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
    } catch (error) {
      console.warn('Logout warning:', error);
    }
  };

  return (
    <header>
      <TopHeader 
        isAuthenticated={isAuthenticated} 
        user={user} 
        onLogout={handleLogout}
        cartItemsCount={cartItemsCount} // 3. Trimite numărul către TopHeader
      />
      
      <MobileNavbar
        isAuthenticated={isAuthenticated}
        user={user}
        onLogout={handleLogout}
        cartItemsCount={cartItemsCount} // 4. Trimite numărul către MobileNavbar
      />
    </header>
  );
});

Header.displayName = 'Header';

export default Header;