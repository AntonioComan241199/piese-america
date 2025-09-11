import { lazy } from 'react';

// Lazy loaded components pentru performance
const Home = lazy(() => import('../pages/Home'));
const Contact = lazy(() => import('../pages/Contact'));
const Signin = lazy(() => import('../pages/Account/Signin'));
const Register = lazy(() => import('../pages/Account/Register'));
const ResetPasswordRequest = lazy(() => import('../pages/ResetPasswordRequest'));
const ResetPassword = lazy(() => import('../pages/ResetPassword'));
const TermsAndConditions = lazy(() => import('../pages/TermsAndConditions'));
const MyProfile = lazy(() => import('../pages/MyProfile'));

// Product pages
const OilProducts = lazy(() => import('../pages/Products/Oils/OilProducts'));
const FireExtinguisherProducts = lazy(() => import('../pages/Products/FireExtinghuishers/FireExtinguisherProducts'));
const FordMustangPage = lazy(() => import('../pages/DedicatedCars/FordMustangPage'));

// Order pages
const MyOrders = lazy(() => import('../pages/Orders/MyOrders'));
const RequestOrder = lazy(() => import('../pages/Orders/RequestOrder'));
const OrderDetails = lazy(() => import('../pages/Orders/OrderDetails'));

// Offer pages
const MyOffers = lazy(() => import('../pages/Offers/MyOffers'));
const OfferDetail = lazy(() => import('../pages/Offers/OfferDetail'));

// Admin pages - separate chunks pentru admin
const AdminDashboard = lazy(() => import('../pages/Admin/AdminDashboard'));
const AdminOrders = lazy(() => import('../pages/Orders/AdminOrders'));
const AdminOffers = lazy(() => import('../pages/Offers/AdminOffers'));
const AdminOilProducts = lazy(() => import('../pages/Admin/AdminOilProducts'));
const AdminFireExtinguishers = lazy(() => import('../pages/Admin/AdminFireExtinguishers'));
const RealtimeStats = lazy(() => import('../pages/Admin/RealtimeStats'));
const OfferGenerator = lazy(() => import('../pages/Offers/OfferGenerator'));

// Route configuration
export const routeConfig = [
  // Public routes
  {
    path: '/',
    component: Home,
    layout: true,
    protection: 'public'
  },
  {
    path: '/home',
    component: Home,
    layout: true,
    protection: 'public'
  },
  {
    path: '/contact',
    component: Contact,
    layout: true,
    protection: 'public'
  },
  {
    path: '/ford-mustang',
    component: FordMustangPage,
    layout: true,
    protection: 'public'
  },
  {
    path: '/terms',
    component: TermsAndConditions,
    layout: true,
    protection: 'public'
  },
  {
    path: '/oil-products',
    component: OilProducts,
    layout: true,
    protection: 'public'
  },
  {
    path: '/fire-products',
    component: FireExtinguisherProducts,
    layout: true,
    protection: 'public'
  },

  // Auth routes - no layout for cleaner auth experience
  {
    path: '/signin',
    component: Signin,
    layout: true,
    protection: 'guest'
  },
  {
    path: '/register',
    component: Register,
    layout: true,
    protection: 'guest'
  },
  {
    path: '/reset-password',
    component: ResetPasswordRequest,
    layout: false,
    protection: 'guest'
  },
  {
    path: '/reset-password/:token',
    component: ResetPassword,
    layout: false,
    protection: 'guest'
  },

  // Protected user routes
  {
    path: '/my-profile',
    component: MyProfile,
    layout: true,
    protection: 'auth'
  },
  {
    path: '/my-orders',
    component: MyOrders,
    layout: true,
    protection: 'public' // Can be viewed without auth, but with limited functionality
  },
  {
    path: '/my-orders/:id',
    component: MyOrders,
    layout: true,
    protection: 'public'
  },
  {
    path: '/my-offers',
    component: MyOffers,
    layout: true,
    protection: 'public'
  },
  {
    path: '/request-order',
    component: RequestOrder,
    layout: true,
    protection: 'auth'
  },
  {
    path: '/orders/:id',
    component: OrderDetails,
    layout: true,
    protection: 'auth'
  },
  {
    path: '/offer/:offerId',
    component: OfferDetail,
    layout: true,
    protection: 'auth'
  },

  // Admin routes
  {
    path: '/admin/dashboard',
    component: AdminDashboard,
    layout: true,
    protection: 'admin',
    title: 'Dashboard Admin'
  },
  {
    path: '/admin-orders',
    component: AdminOrders,
    layout: true,
    protection: 'admin',
    title: 'Gestionare Comenzi'
  },
  {
    path: '/admin-offers',
    component: AdminOffers,
    layout: true,
    protection: 'admin',
    title: 'Gestionare Oferte'
  },
  {
    path: '/admin/oil-products',
    component: AdminOilProducts,
    layout: true,
    protection: 'admin',
    title: 'Produse Uleiuri'
  },
  {
    path: '/admin/fire-extinguishers',
    component: AdminFireExtinguishers,
    layout: true,
    protection: 'admin',
    title: 'Stingătoare'
  },
  {
    path: '/admin/reports',
    component: RealtimeStats,
    layout: true,
    protection: 'admin',
    title: 'Rapoarte și Statistici'
  },
  {
    path: '/offer-generator/:orderId',
    component: OfferGenerator,
    layout: true,
    protection: 'admin',
    title: 'Generator Oferte'
  }
];

// Helper functions pentru routing
export const getRoutesByProtection = (protection) => {
  return routeConfig.filter(route => route.protection === protection);
};

export const getPublicRoutes = () => getRoutesByProtection('public');
export const getAuthRoutes = () => getRoutesByProtection('auth');
export const getAdminRoutes = () => getRoutesByProtection('admin');
export const getGuestRoutes = () => getRoutesByProtection('guest');

// Route groups pentru better organization
export const routeGroups = {
  public: getPublicRoutes(),
  auth: getAuthRoutes(),
  admin: getAdminRoutes(),
  guest: getGuestRoutes()
};

// Navigation items pentru menu-uri
export const navigationConfig = {
  main: [
    { path: '/', label: 'Acasă', icon: 'ri-home-line' },
    { path: '/oil-products', label: 'Uleiuri', icon: 'ri-drop-line' },
    { path: '/fire-products', label: 'Stingătoare', icon: 'ri-fire-line' },
    { path: '/contact', label: 'Contact', icon: 'ri-phone-line' }
  ],
  user: [
    { path: '/my-profile', label: 'Profilul meu', icon: 'ri-user-line' },
    { path: '/my-orders', label: 'Comenzile mele', icon: 'ri-shopping-cart-line' },
    { path: '/my-offers', label: 'Ofertele mele', icon: 'ri-file-list-line' },
    { path: '/request-order', label: 'Cerere ofertă', icon: 'ri-add-circle-line' }
  ],
  admin: [
    { path: '/admin/dashboard', label: 'Dashboard', icon: 'ri-dashboard-line' },
    { path: '/admin-orders', label: 'Comenzi', icon: 'ri-shopping-cart-line' },
    { path: '/admin-offers', label: 'Oferte', icon: 'ri-file-list-line' },
    { path: '/admin/oil-products', label: 'Produse Uleiuri', icon: 'ri-drop-line' },
    { path: '/admin/fire-extinguishers', label: 'Stingătoare', icon: 'ri-fire-line' },
    { path: '/admin/reports', label: 'Rapoarte', icon: 'ri-bar-chart-line' }
  ]
};

// Meta information pentru SEO
export const routeMeta = {
  '/': {
    title: 'Piese Auto America - Piese auto de calitate',
    description: 'Cele mai bune piese auto și uleiuri pentru vehiculul tău. Livrare rapidă în toată România.'
  },
  '/oil-products': {
    title: 'Uleiuri Auto - Piese Auto America',
    description: 'Uleiuri motor de calitate superioară pentru toate tipurile de vehicule.'
  },
  '/fire-products': {
    title: 'Stingătoare Auto - Piese Auto America',
    description: 'Stingătoare auto certificate pentru siguranța ta în trafic.'
  },
  '/contact': {
    title: 'Contact - Piese Auto America',
    description: 'Contactează-ne pentru orice întrebări despre piese auto și servicii.'
  }
};