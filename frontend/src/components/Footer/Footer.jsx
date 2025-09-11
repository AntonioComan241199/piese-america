import React, { memo } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useResponsive, useNavigation } from '../../hooks/useResponsive';
import { getFooterLinks } from '../../utils/navigationHelpers';
import { LAYOUT_DIMENSIONS, COMPANY_INFO } from '../Layout/constants';

// Company Description Component
const CompanyDescription = memo(() => (
  <Col lg={4} md={6} className="mb-4">
    <h5 className="text-uppercase text-white mb-3">
      {COMPANY_INFO.NAME}
    </h5>
    <p className="footer-text">
      Oferim piese auto de cea mai bună calitate, livrate rapid și eficient. 
      Contactați-ne pentru detalii și asistență personalizată.
    </p>
    <p>
      <a
        href={COMPANY_INFO.OLD_WEBSITE}
        target="_blank"
        rel="noopener noreferrer"
        className="text-light text-decoration-none"
        aria-label={`Vizitează ${COMPANY_INFO.SLOGAN}`}
      >
        {COMPANY_INFO.SLOGAN}
      </a>
    </p>
  </Col>
));
CompanyDescription.displayName = 'CompanyDescription';

// Quick Links Component
const QuickLinks = memo(() => {
  const navigate = useNavigate();
  const { handleNavigationClick } = useNavigation();
  const footerLinks = getFooterLinks();

  return (
    <Col lg={2} md={3} sm={6} className="mb-4">
      <h5 className="text-uppercase mb-3">Linkuri Utile</h5>
      <ul className="list-unstyled">
        {footerLinks.map((item, index) => (
          <li key={index} className="mb-2">
            <button
              className="btn btn-link text-light text-decoration-none p-0"
              onClick={() => handleNavigationClick(navigate, item.path)}
              aria-label={`Navigează la ${item.display}`}
            >
              {item.display}
            </button>
          </li>
        ))}
      </ul>
    </Col>
  );
});
QuickLinks.displayName = 'QuickLinks';

// Contact Information Component
const ContactInfo = memo(() => (
  <Col lg={3} md={6} sm={6} className="mb-4">
    <h5 className="text-uppercase mb-3">Contact</h5>
    <ul className="list-unstyled footer-text">
      <li className="mb-2">
        <i className="ri-map-pin-line me-2"></i>
        {COMPANY_INFO.ADDRESS}
      </li>
      <li className="mb-2">
        <i className="ri-phone-line me-2"></i>
        <a 
          href={`tel:${COMPANY_INFO.PHONE_LINK}`} 
          className="text-light text-decoration-none"
          aria-label={`Sună la ${COMPANY_INFO.PHONE}`}
        >
          {COMPANY_INFO.PHONE}
        </a>
      </li>
      <li className="mb-2">
        <i className="ri-mail-line me-2"></i>
        <a 
          href={`mailto:${COMPANY_INFO.EMAIL_PRIMARY}`} 
          className="text-light text-decoration-none"
          aria-label={`Trimite email la ${COMPANY_INFO.EMAIL_PRIMARY}`}
        >
          {COMPANY_INFO.EMAIL_PRIMARY}
        </a>
      </li>
      <li className="mb-2">
        <i className="ri-mail-line me-2"></i>
        <a 
          href={`mailto:${COMPANY_INFO.EMAIL_SECONDARY}`} 
          className="text-light text-decoration-none"
          aria-label={`Trimite email secundar la ${COMPANY_INFO.EMAIL_SECONDARY}`}
        >
          {COMPANY_INFO.EMAIL_SECONDARY}
        </a>
      </li>
      <li>
        <i className="ri-time-line me-2"></i>
        {COMPANY_INFO.WORKING_HOURS}
      </li>
    </ul>
  </Col>
));
ContactInfo.displayName = 'ContactInfo';

// Location and Social Media Component
const LocationAndSocial = memo(() => (
  <Col lg={3} md={6} className="mb-4">
    <h5 className="text-uppercase mb-3">Locație și Social Media</h5>
    
    {/* Google Maps Embed */}
    <div className="mb-3">
      <iframe
        src={COMPANY_INFO.GOOGLE_MAPS_EMBED}
        width="100%"
        height="150"
        style={{ border: 0, borderRadius: '8px' }}
        allowFullScreen=""
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title={`Locația ${COMPANY_INFO.NAME} pe hartă`}
        aria-label={`Hartă interactivă cu locația ${COMPANY_INFO.NAME}`}
      />
    </div>
    
    {/* Social Media Link */}
    <a
      href={COMPANY_INFO.FACEBOOK_LINK}
      target="_blank"
      rel="noopener noreferrer"
      className="text-light text-decoration-none d-flex align-items-center gap-3"
      aria-label={`Vizitează pagina de Facebook ${COMPANY_INFO.NAME}`}
    >
      <i className="ri-facebook-circle-line display-5 text-primary"></i>
      <span>{COMPANY_INFO.NAME} - Pagina oficială</span>
    </a>
  </Col>
));
LocationAndSocial.displayName = 'LocationAndSocial';

// Copyright Component
const Copyright = memo(() => {
  const currentYear = new Date().getFullYear();
  
  return (
    <Row className="mt-4 pt-4 border-top border-secondary">
      <Col>
        <p className="text-center footer-text m-0">
          <i className="ri-copyright-line me-1"></i>
          {currentYear} {COMPANY_INFO.NAME}. Toate drepturile rezervate.
        </p>
      </Col>
    </Row>
  );
});
Copyright.displayName = 'Copyright';

// Main Footer Component
const Footer = memo(() => {
  const { isMobile } = useResponsive();

  const footerStyles = {
    marginLeft: isMobile ? '0' : `${LAYOUT_DIMENSIONS.SIDEBAR_WIDTH}px`,
    transition: 'margin-left 0.3s ease',
    backgroundColor: '#212529',
    color: '#ffffff'
  };

  return (
    <footer className="py-5" style={footerStyles}>
      <Container>
        <Row className="align-items-start">
          <CompanyDescription />
          <QuickLinks />
          <ContactInfo />
          <LocationAndSocial />
        </Row>
        <Copyright />
      </Container>
    </footer>
  );
});

Footer.displayName = 'Footer';

export default Footer;