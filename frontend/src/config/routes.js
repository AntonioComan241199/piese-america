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
const MyOrdersCatalog = lazy(() => import('../pages/Catalog/UserOrders.jsx'));
const MyOrdersCatalogDetails = lazy(() => import('../pages/Catalog/UserOrdersDetail.jsx'));

// Offer pages
const MyOffers = lazy(() => import('../pages/Offers/MyOffers'));
const OfferDetail = lazy(() => import('../pages/Offers/OfferDetail'));

// Admin pages - separate chunks pentru admin
const AdminDashboard = lazy(() => import('../pages/Admin/AdminDashboard'));
const AdminOrders = lazy(() => import('../pages/Orders/AdminOrders'));
const AdminCatalogOrders = lazy(() => import('../pages/Orders/AdminCatalogOrders'));
const AdminCatalogOrdersDetail = lazy(() => import('../pages/Orders/AdminCatalogOrdersDetail'));
const AdminOffers = lazy(() => import('../pages/Offers/AdminOffers'));
const AdminOilProducts = lazy(() => import('../pages/Admin/AdminOilProducts'));
const AdminFireExtinguishers = lazy(() => import('../pages/Admin/AdminFireExtinguishers'));
const RealtimeStats = lazy(() => import('../pages/Admin/RealtimeStats'));
const OfferGenerator = lazy(() => import('../pages/Offers/OfferGenerator'));

const CatalogPage = lazy(() => import('../pages/Catalog/CatalogPage'));
const CatalogDetail = lazy(() => import('../pages/Catalog/CatalogDetail'));
const AdminCatalog = lazy(() => import('../pages/Admin/AdminCatalog'));
const AdminCatalogForm = lazy(() => import('../pages/Admin/AdminCatalogForm'));
const cart = lazy(() => import('../pages/Cart/CartPage'));
const CheckoutPage = lazy(() => import('../pages/Cart/CheckoutPage'));

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
    path: '/checkout', 
    component: CheckoutPage,
    title: 'Finalizare Comandă',
    protection: 'auth' // Recomandat să fie doar pentru utilizatori logați
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
    path: '/my-orders-catalog',
    component: MyOrdersCatalog,
    layout: 'true',
    protected: 'public'
  },
  {
    path: '/my-orders-catalog/:id',
    component: MyOrdersCatalogDetails,
    layout: 'true',
    protected: 'public'
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
  // În routeConfig (partea de admin)
  {
    path: '/admin/catalog-orders',
    component: AdminCatalogOrders,
    layout: true, // sau layout-ul tău de admin
    protection: 'admin',
    title: 'Gestionare Comenzi Catalog'
  },
  {
    path: '/admin/catalog-orders/:id',
    component: AdminCatalogOrdersDetail, // Pagina de detalii pe care o putem face imediat
    layout: true,
    protection: 'admin',
    title: 'Detalii Comandă Catalog'
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
  },

  { path: "/cart", component: cart, layout: true, protection: "public" },
  { path: "/catalog", component: CatalogPage, layout: true, protection: "public" },
  { path: "/catalog/:id", component: CatalogDetail, layout: true, protection: "public" },
  { path: "/admin/catalog", component: AdminCatalog, layout: true, protection: "admin" },
  { path: "/admin/catalog/add", component: AdminCatalogForm, layout: true, protection: "admin" },
  { path: "/admin/catalog/:id/edit", component: AdminCatalogForm, layout: true, protection: "admin" },
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
    { path: '/catalog', label: 'Catalog Stoc', icon: 'ri-store-2-line' },
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
  '/catalog': {
    title: 'Catalog Piese în Stoc - Piese Auto America',
    description: 'Catalog complet de piese auto disponibile în stoc. Găsește rapid piesa de care ai nevoie.'
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