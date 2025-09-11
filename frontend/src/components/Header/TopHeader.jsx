import React, { memo } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
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
const AuthSection = memo(({ isAuthenticated, user, onLogout, isMobile }) => {
  const navigate = useNavigate();
  const { handleNavigationClick } = useNavigation();

  const handleLogout = () => {
    handleNavigationClick(navigate, '/home');
    onLogout();
  };

  const colClass = `d-flex ${
    isMobile ? 'flex-column text-center mt-3' : 'justify-content-end'
  } gap-2`;

  if (isAuthenticated) {
    return (
      <Col xs={12} md={6} className={colClass}>
        <span className={isMobile ? 'd-block mb-2' : 'align-self-center me-3'}>
          Salut, {getUserDisplayName(user)}!
        </span>
        <Button
          onClick={handleLogout}
          variant="outline-light"
          size="sm"
          className={isMobile ? 'w-50 mx-auto' : ''}
          aria-label="Logout din cont"
        >
          Logout
        </Button>
      </Col>
    );
  }

  return (
    <Col xs={12} md={6} className={colClass}>
      <Button
        onClick={() => handleNavigationClick(navigate, '/signin')}
        variant="outline-light"
        size="sm"
        className={isMobile ? 'w-50 mx-auto' : 'me-2'}
        aria-label="Conectează-te în cont"
      >
        Conectare
      </Button>
      <Button
        onClick={() => handleNavigationClick(navigate, '/register')}
        variant="outline-light"
        size="sm"
        className={isMobile ? 'w-50 mx-auto' : ''}
        aria-label="Creează cont nou"
      >
        Înregistrare
      </Button>
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
const TopHeader = memo(({ isAuthenticated, user, onLogout }) => {
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