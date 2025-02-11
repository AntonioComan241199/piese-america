import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { logout, checkAuth } from "../../slices/authSlice";
import TopHeader from "./TopHeader";
import MobileNavbar from "./MobileNavbar";

const Header = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, user, authChecked } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
  };

  React.useEffect(() => {
    if (!authChecked) {
      dispatch(checkAuth());
    }
  }, [dispatch, authChecked]);

  return (
    <header>
      {/* Secțiunea superioară */}
      <TopHeader isAuthenticated={isAuthenticated} user={user} onLogout={handleLogout} />

      {/* MobileNavbar pentru dispozitive mobile */}
      <MobileNavbar
        isAuthenticated={isAuthenticated}
        user={user}
        onLogout={handleLogout}
        navLinks={[
          { path: "/home", display: "Home" },
          { path: "/contact", display: "Contact" },
          { path: "/request-order", display: "Solicita oferta" },
          { path: "/oil-products", display: "Uleiuri si Lubrifianti" },
          { path: "/fire-products", display: "Stingatoare" },
        ]}
      />
    </header>
  );
};

export default Header;
