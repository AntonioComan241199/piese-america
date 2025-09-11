// Layout constants and configuration

// Responsive breakpoints
export const BREAKPOINTS = {
  MOBILE: 991,
  TABLET: 768,
  DESKTOP: 1200
};

// Layout dimensions
export const LAYOUT_DIMENSIONS = {
  SIDEBAR_WIDTH: 240,
  TOP_HEADER_HEIGHT: 75,
  MOBILE_HEADER_HEIGHT: 130,
  Z_INDEX: {
    SIDEBAR: 1000,
    TOP_HEADER: 1100,
    MOBILE_NAVBAR: 1050,
    CONTENT_SECTION: 1099,
    INFO_BANNER: 1098
  }
};

// Theme colors
export const THEME_COLORS = {
  PRIMARY: '#0d6efd',
  DARK: '#212529',
  LIGHT: '#f8f9fa',
  WARNING: '#ffc107',
  SUCCESS: '#198754',
  WHITE: '#ffffff'
};

// Company information
export const COMPANY_INFO = {
  NAME: 'Piese Auto America',
  SLOGAN: 'Fostul AutoMed.ro',
  PHONE: '0740 121 689',
  PHONE_LINK: '+40740121689',
  EMAIL_PRIMARY: 'costel.barbu@artri.ro',
  EMAIL_SECONDARY: 'automed.piese@gmail.com',
  ADDRESS: 'București, Bd. Mărăști Nr.25, Sector 1',
  WORKING_HOURS: 'Luni - Vineri, 08:00 - 16:30',
  WHATSAPP_LINK: 'https://wa.me/40740121689',
  FACEBOOK_LINK: 'https://www.facebook.com/pieseautoamerica?locale=ro_RO',
  OLD_WEBSITE: 'https://automed.ro/',
  GOOGLE_MAPS_EMBED: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2847.3280523795843!2d26.071459476662657!3d44.467447999388284!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40b2038ae9cd8969%3A0x35844ec921fc4cea!2sPIESE%20AUTO%20AMERICA%20(Quality%20Global%20Solutions%20SRL)!5e0!3m2!1sro!2sro!4v1737336717588!5m2!1sro!2sro'
};

// Navigation configuration
export const NAVIGATION_CONFIG = {
  PUBLIC: [
    { path: '/home', display: 'Home', icon: 'ri-home-line' },
    { path: '/contact', display: 'Contact', icon: 'ri-phone-line' },
    { path: '/request-order', display: 'Solicita oferta', icon: 'ri-add-circle-line', excludeForRoles: ['admin'] },
    { path: '/oil-products', display: 'Uleiuri si Lubrifianti', icon: 'ri-drop-line' },
    { path: '/fire-products', display: 'Stingatoare', icon: 'ri-fire-line' },

  ],
  
  AUTH_REQUIRED: [
    { path: '/request-order', display: 'Solicita oferta', icon: 'ri-add-circle-line', excludeForRoles: ['admin'] },
    { path: '/my-profile', display: 'Contul meu', icon: 'ri-user-line' }
  ],
  
  CLIENT: [
    { path: '/my-orders', display: 'Evidenta oferte', icon: 'ri-file-list-line' },
    { path: '/my-offers', display: 'Evidenta Comenzi', icon: 'ri-shopping-cart-line' }
  ],
  
  ADMIN: [
    { path: '/admin/dashboard', display: 'Panou de Administrare', icon: 'ri-dashboard-line' },
  ],
  
  GUEST: [
    { path: '/signin', display: 'Login', icon: 'ri-login-box-line' },
    { path: '/register', display: 'Register', icon: 'ri-user-add-line' }
  ],
  
  FOOTER_LINKS: [
    { path: '/home', display: 'Home' },
    { path: '/contact', display: 'Contact' },
    { path: '/request-order', display: 'Cere ofertă' },
    { path: '/terms', display: 'Termeni și Condiții' }
  ]
};

// Animation and transition settings
export const ANIMATIONS = {
  SIDEBAR_TRANSITION: 'margin-left 0.3s ease',
  SCROLL_BEHAVIOR: 'smooth',
  RESIZE_DEBOUNCE: 250, // ms
  LOADING_DELAY: 300 // ms
};

// SEO and meta information
export const SEO_CONFIG = {
  DEFAULT_TITLE: 'Piese Auto America',
  DEFAULT_DESCRIPTION: 'Piese auto de calitate pentru toate tipurile de vehicule',
  SITE_INFO_MESSAGE: 'Acest site este destinat solicitării ofertelor pentru piese auto. Nu avem un catalog de produse, dar suntem aici să te ajutăm!'
};