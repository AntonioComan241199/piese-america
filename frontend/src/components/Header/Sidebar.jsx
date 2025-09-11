import React, { memo } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Nav, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useNavigation } from '../../hooks/useResponsive';
import { getNavigationLinks, getAuthLinks, getUserDisplayName } from '../../utils/navigationHelpers';
import { LAYOUT_DIMENSIONS, COMPANY_INFO, THEME_COLORS } from '../Layout/constants';

// Navigation Link Component
const NavigationLink = memo(({ item, onClick }) => (
  <NavLink
    to={item.path}
    onClick={onClick}
    className={({ isActive }) =>
      isActive 
        ? 'nav-link active bg-primary text-white' 
        : 'nav-link text-white'
    }
  >
    {item.icon && <i className={`${item.icon} me-2`}></i>}
    {item.display}
  </NavLink>
));
NavigationLink.displayName = 'NavigationLink';

// Auth Links Component
const AuthLinks = memo(({ isAuthenticated, onLogout, onLinkClick }) => {
  if (isAuthenticated) {
    return (
      <Button
        onClick={onLogout}
        variant="outline-light"
        size="sm"
        className="mt-3"
        aria-label="Logout din cont"
      >
        <i className="ri-logout-box-line me-2"></i>
        Logout
      </Button>
    );
  }

  const guestLinks = getAuthLinks(false);
  
  return (
    <>
      {guestLinks.map((item, index) => (
        <NavigationLink
          key={index}
          item={item}
          onClick={onLinkClick}
        />
      ))}
    </>
  );
});
AuthLinks.displayName = 'AuthLinks';

// Brand Header Component
const BrandHeader = memo(({ onLinkClick }) => (
  <h2 className="p-3">
    <Link 
      to="/home"
      onClick={onLinkClick}
      className="text-white text-decoration-none"
      aria-label={`Acasă - ${COMPANY_INFO.NAME}`}
    >
      <i className="ri-car-line me-2"></i>
      {COMPANY_INFO.NAME}
    </Link>
  </h2>
));
BrandHeader.displayName = 'BrandHeader';

// User Info Component
const UserInfo = memo(({ user, isAuthenticated }) => {
  if (!isAuthenticated || !user) return null;

  return (
    <div className="px-3 py-2 border-top border-secondary">
      <small className="text-muted d-block mb-1">Conectat ca:</small>
      <div className="text-white">
        <i className="ri-user-line me-2"></i>
        {getUserDisplayName(user)}
        {user.role && (
          <span className="badge bg-primary ms-2 small">
            {user.role}
          </span>
        )}
      </div>
    </div>
  );
});
UserInfo.displayName = 'UserInfo';

// Main Sidebar Component
const Sidebar = memo(({ isAuthenticated, user, onLogout }) => {
  const navigate = useNavigate();
  const { handleNavigationClick } = useNavigation();
  
  const navigationLinks = getNavigationLinks(isAuthenticated, user);

  const handleLinkClick = () => {
    handleNavigationClick(navigate, window.location.pathname);
  };

  const handleLogout = () => {
    handleNavigationClick(navigate, '/home');
    if (onLogout) {
      onLogout();
    }
  };

  const sidebarStyles = {
    position: 'fixed',
    top: `${LAYOUT_DIMENSIONS.TOP_HEADER_HEIGHT}px`,
    left: '0',
    width: `${LAYOUT_DIMENSIONS.SIDEBAR_WIDTH}px`,
    height: `calc(100vh - ${LAYOUT_DIMENSIONS.TOP_HEADER_HEIGHT}px)`,
    zIndex: LAYOUT_DIMENSIONS.Z_INDEX.SIDEBAR,
    overflowY: 'auto',
    backgroundColor: THEME_COLORS.DARK,
    borderRight: `1px solid ${THEME_COLORS.PRIMARY}`
  };

  return (
    <div className="sidebar text-white" style={sidebarStyles}>
      <BrandHeader onLinkClick={handleLinkClick} />
      
      <Nav className="flex-column px-3">
        {/* Main Navigation Links */}
        {navigationLinks.map((item, index) => (
          <NavigationLink
            key={index}
            item={item}
            onClick={handleLinkClick}
          />
        ))}
        
        {/* Authentication Links */}
        <div className="mt-auto pt-3">
          <AuthLinks
            isAuthenticated={isAuthenticated}
            onLogout={handleLogout}
            onLinkClick={handleLinkClick}
          />
        </div>
      </Nav>
      
      {/* User Information */}
      <UserInfo user={user} isAuthenticated={isAuthenticated} />
    </div>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;