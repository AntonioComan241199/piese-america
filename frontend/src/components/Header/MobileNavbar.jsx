import React, { useState, memo, useCallback } from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { NavLink, Link } from 'react-router-dom';
import { useNavigation } from '../../hooks/useResponsive';
import { getNavigationLinks, getAuthLinks, getUserDisplayName } from '../../utils/navigationHelpers';
import { COMPANY_INFO, LAYOUT_DIMENSIONS } from '../Layout/constants';

// Navigation Link Component
const MobileNavLink = memo(({ item, onLinkClick }) => (
  <Nav.Link
    as={NavLink}
    to={item.path}
    onClick={onLinkClick}
    className={({ isActive }) =>
      isActive 
        ? 'nav-link active text-primary' 
        : 'nav-link text-white'
    }
  >
    {item.icon && <i className={`${item.icon} me-2`}></i>}
    {item.display}
  </Nav.Link>
));
MobileNavLink.displayName = 'MobileNavLink';

// Auth Section Component
const MobileAuthSection = memo(({ 
  isAuthenticated, 
  user, 
  onLogout, 
  onLinkClick 
}) => {
  if (isAuthenticated) {
    return (
      <>
        {/* User info */}
        <div className="px-3 py-2 border-top border-secondary">
          <small className="text-muted d-block">Conectat ca:</small>
          <span className="text-white">
            <i className="ri-user-line me-2"></i>
            {getUserDisplayName(user)}
            {user?.role && (
              <span className="badge bg-primary ms-2 small">
                {user.role}
              </span>
            )}
          </span>
        </div>
        
        {/* Logout button */}
        <div className="px-3 pb-3">
          <Button
            onClick={() => {
              onLogout();
              onLinkClick(); // Close menu
            }}
            variant="outline-light"
            size="sm"
            className="w-100"
            aria-label="Logout din cont"
          >
            <i className="ri-logout-box-line me-2"></i>
            Logout
          </Button>
        </div>
      </>
    );
  }

  const guestLinks = getAuthLinks(false);
  
  return (
    <>
      {guestLinks.map((item, index) => (
        <MobileNavLink
          key={index}
          item={item}
          onLinkClick={onLinkClick}
        />
      ))}
    </>
  );
});
MobileAuthSection.displayName = 'MobileAuthSection';

// Main Mobile Navbar Component
const MobileNavbar = memo(({ isAuthenticated, user, onLogout }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { handleNavigationClick } = useNavigation();
  
  const navigationLinks = getNavigationLinks(isAuthenticated, user);

  const handleNavLinkClick = useCallback(() => {
    setIsExpanded(false);
    // Scroll to top is handled by navigation utility
  }, []);

  const handleLogout = useCallback(() => {
    setIsExpanded(false);
    onLogout();
  }, [onLogout]);

  const handleToggle = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  return (
    <Navbar
      expand="lg"
      bg="dark"
      variant="dark"
      className="d-lg-none"
      expanded={isExpanded}
      style={{ 
        zIndex: LAYOUT_DIMENSIONS.Z_INDEX.MOBILE_NAVBAR,
        borderBottom: '1px solid #495057'
      }}
    >
      <Container>
        {/* Brand */}
        <Navbar.Brand 
          as={Link} 
          to="/home" 
          className="text-white text-decoration-none"
          onClick={handleNavLinkClick}
          aria-label={`Acasă - ${COMPANY_INFO.NAME}`}
        >
          <i className="ri-car-line me-2"></i>
          {COMPANY_INFO.NAME}
        </Navbar.Brand>

        {/* Mobile Menu Toggle */}
        <Navbar.Toggle
          aria-controls="mobile-navbar"
          onClick={handleToggle}
          aria-label="Toggle navigation menu"
        >
          <i className={isExpanded ? 'ri-close-line' : 'ri-menu-line'}></i>
          <span className="ms-2">
            {isExpanded ? 'Închide' : 'Meniu'}
          </span>
        </Navbar.Toggle>

        {/* Collapsible Content */}
        <Navbar.Collapse id="mobile-navbar">
          <Nav className="ms-auto">
            {/* Main Navigation Links */}
            {navigationLinks.map((item, index) => (
              <MobileNavLink
                key={index}
                item={item}
                onLinkClick={handleNavLinkClick}
              />
            ))}
          </Nav>
          
          {/* Authentication Section */}
          <MobileAuthSection
            isAuthenticated={isAuthenticated}
            user={user}
            onLogout={handleLogout}
            onLinkClick={handleNavLinkClick}
          />
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
});

MobileNavbar.displayName = 'MobileNavbar';

export default MobileNavbar;