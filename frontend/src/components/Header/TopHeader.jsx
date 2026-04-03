// frontend/src/components/Header/TopHeader.jsx
import React, { memo } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useResponsive, useNavigation } from '../../hooks/useResponsive';
import { getUserDisplayName } from '../../utils/navigationHelpers';
import { 
  LAYOUT_DIMENSIONS, 
  COMPANY_INFO, 
  SEO_CONFIG,
  THEME_COLORS 
} from '../Layout/constants';

// Contact Section Component
const ContactSection = memo(() => (
  <Col xs={12} md={6}>
    <span className="d-block">
      Ai nevoie de ajutor?{' '}
      <span className="fw-bold">
        <i className="ri-phone-fill me-2"></i>
        <a
          href={`tel:${COMPANY_INFO.PHONE_LINK}`}
          className="text-white text-decoration-none"
          aria-label={`Sună la ${COMPANY_INFO.PHONE}`}
        >
          {COMPANY_INFO.PHONE}
        </a>
      </span>
    </span>
  </Col>
));
ContactSection.displayName = 'ContactSection';

// Auth Section Component
const AuthSection = memo(({ isAuthenticated, user, onLogout, isMobile, cartItemsCount }) => {
  const navigate = useNavigate();
  const { handleNavigationClick } = useNavigation();

  const handleLogout = () => {
    handleNavigationClick(navigate, '/home');
    onLogout();
  };

  const colClass = `d-flex ${
    isMobile ? 'flex-column text-center mt-3' : 'justify-content-end align-items-center'
  } gap-3`;

  return (
    <Col xs={12} md={6} className={colClass}>
      {/* Iconița de Coș - ascuns pe mobile (e in MobileNavbar) */}
      <Link
        to="/cart"
        className="position-relative text-decoration-none d-none d-md-flex align-items-center gap-1 px-3 py-1 rounded fw-semibold"
        style={{
          backgroundColor: '#ffc107',
          color: '#212529',
          border: '2px solid #ffc107',
          transition: 'all 0.2s ease',
          whiteSpace: 'nowrap'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.backgroundColor = '#ffca2c';
          e.currentTarget.style.borderColor = '#ffca2c';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.backgroundColor = '#ffc107';
          e.currentTarget.style.borderColor = '#ffc107';
        }}
        aria-label={`Coș cumpărături${cartItemsCount > 0 ? ` - ${cartItemsCount} produse` : ''}`}
      >
        <i className="ri-shopping-cart-2-line fs-5"></i>
        <span className="d-none d-sm-inline">Coș</span>
        <span
          className="badge rounded-pill ms-1"
          style={{
            backgroundColor: cartItemsCount > 0 ? '#dc3545' : '#6c757d',
            minWidth: '20px'
          }}
        >
          {cartItemsCount}
        </span>
      </Link>

      {/* Autentificare / Profil */}
      {isAuthenticated ? (
        <div className="d-flex align-items-center gap-2">
          <span>Salut, {getUserDisplayName(user)}!</span>
          <Button
            onClick={handleLogout}
            variant="outline-light"
            size="sm"
            aria-label="Logout din cont"
          >
            Logout
          </Button>
        </div>
      ) : (
        <div className="d-flex gap-2">
          <Button
            onClick={() => handleNavigationClick(navigate, '/signin')}
            variant="outline-light"
            size="sm"
            aria-label="Conectează-te în cont"
          >
            Conectare
          </Button>
          <Button
            onClick={() => handleNavigationClick(navigate, '/register')}
            variant="outline-light"
            size="sm"
            aria-label="Creează cont nou"
          >
            Înregistrare
          </Button>
        </div>
      )}
    </Col>
  );
});
AuthSection.displayName = 'AuthSection';

// Company Info Section Component
const CompanyInfoSection = memo(({ isMobile, sidebarOffset }) => (
  <div
    className="bg-light border-bottom"
    style={{
      position: 'relative',
      marginTop: isMobile ? '0px' : `${LAYOUT_DIMENSIONS.TOP_HEADER_HEIGHT}px`,
      ...sidebarOffset,
      zIndex: LAYOUT_DIMENSIONS.Z_INDEX.CONTENT_SECTION
    }}
  >
    <Container fluid>
      <Row className={`align-items-center ${isMobile ? 'flex-column text-center' : ''} py-2`}>
        <Col xs={12} lg={8}>
          <div className="d-block">
            <i className="ri-map-pin-line me-2"></i>
            {COMPANY_INFO.ADDRESS}
          </div>
          <div className="d-block">
            <i className="ri-time-line me-2"></i>
            {COMPANY_INFO.WORKING_HOURS}
          </div>
        </Col>
        <Col xs={12} lg={4} className="text-lg-end mt-3 mt-lg-0">
          <Button
            as="a"
            href={`tel:${COMPANY_INFO.PHONE_LINK}`}
            className="btn btn-primary me-2 mb-2 mb-lg-0"
            aria-label={`Sună acum la ${COMPANY_INFO.PHONE}`}
          >
            <i className="ri-phone-line me-1"></i> Sună acum
          </Button>
          <Button
            as="a"
            href={COMPANY_INFO.WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-success"
            aria-label="Scrie-ne acum pe WhatsApp"
          >
            <i className="ri-whatsapp-line me-1"></i> WhatsApp
          </Button>
        </Col>
      </Row>
    </Container>
  </div>
));
CompanyInfoSection.displayName = 'CompanyInfoSection';

// Info Banner Component
const InfoBanner = memo(({ isMobile, sidebarOffset }) => (
  <div
    className="bg-warning"
    style={{
      position: 'relative',
      ...sidebarOffset,
      zIndex: LAYOUT_DIMENSIONS.Z_INDEX.INFO_BANNER
    }}
  >
    <Container>
      <p className={`text-center m-0 text-dark fs-6 ${isMobile ? 'py-3' : 'py-2'}`}>
        <i className="ri-information-line me-1"></i>
        {SEO_CONFIG.SITE_INFO_MESSAGE}
      </p>
    </Container>
  </div>
));
InfoBanner.displayName = 'InfoBanner';

// Main TopHeader Component
const TopHeader = memo(({ isAuthenticated, user, onLogout, cartItemsCount }) => {
  const { isMobile } = useResponsive();

  const sidebarOffset = {
    left: isMobile ? '0' : `${LAYOUT_DIMENSIONS.SIDEBAR_WIDTH}px`,
    width: isMobile ? '100%' : `calc(100% - ${LAYOUT_DIMENSIONS.SIDEBAR_WIDTH}px)`
  };

  const headerStyles = {
    position: isMobile ? 'relative' : 'fixed',
    top: '0',
    left: '0',
    height: isMobile ? 
      `${LAYOUT_DIMENSIONS.MOBILE_HEADER_HEIGHT}px` : 
      `${LAYOUT_DIMENSIONS.TOP_HEADER_HEIGHT}px`,
    width: '100%',
    zIndex: LAYOUT_DIMENSIONS.Z_INDEX.TOP_HEADER,
    backgroundColor: THEME_COLORS.DARK,
    color: THEME_COLORS.WHITE
  };

  return (
    <>
      {/* Main Header Section */}
      <div style={headerStyles}>
        <Container fluid>
          <Row className={`align-items-center ${
            isMobile ? 'flex-column text-center py-1' : 'py-4'
          }`}>
            <ContactSection />
            <AuthSection 
              isAuthenticated={isAuthenticated}
              user={user}
              onLogout={onLogout}
              isMobile={isMobile}
              cartItemsCount={cartItemsCount} // 👈 Pasăm cartItemsCount
            />
          </Row>
        </Container>
      </div>

      {/* Company Information Section */}
      <CompanyInfoSection 
        isMobile={isMobile}
        sidebarOffset={sidebarOffset}
      />

      {/* Information Banner */}
      <InfoBanner 
        isMobile={isMobile}
        sidebarOffset={sidebarOffset}
      />
    </>
  );
});

TopHeader.displayName = 'TopHeader';

export default TopHeader;