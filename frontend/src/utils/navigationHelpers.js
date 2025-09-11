import { NAVIGATION_CONFIG } from '../components/Layout/constants';

/**
 * Get navigation links based on authentication status and user role
 * @param {boolean} isAuthenticated - User authentication status
 * @param {Object} user - User object with role information
 * @returns {Array} Array of navigation link objects
 */
export const getNavigationLinks = (isAuthenticated, user) => {
  const links = [];

  // Always include public links
  links.push(...NAVIGATION_CONFIG.PUBLIC);

  if (isAuthenticated && user) {
    // Add authenticated user links (excluding role-specific excluded ones)
    const authLinks = NAVIGATION_CONFIG.AUTH_REQUIRED.filter(link => {
      if (link.excludeForRoles && link.excludeForRoles.includes(user.role)) {
        return false;
      }
      return true;
    });
    links.push(...authLinks);

    // Add role-specific links
    switch (user.role) {
      case 'client':
        links.push(...NAVIGATION_CONFIG.CLIENT);
        break;
      case 'admin':
      case 'superadmin':
        links.push(...NAVIGATION_CONFIG.ADMIN);
        break;
      default:
        // Handle any other roles or fallback
        break;
    }
  }

  return links;
};

/**
 * Get authentication-related navigation links
 * @param {boolean} isAuthenticated - User authentication status
 * @returns {Array} Array of auth link objects
 */
export const getAuthLinks = (isAuthenticated) => {
  if (isAuthenticated) {
    return []; // No auth links when authenticated (logout is handled separately)
  }
  
  return NAVIGATION_CONFIG.GUEST;
};

/**
 * Get footer navigation links
 * @returns {Array} Array of footer link objects
 */
export const getFooterLinks = () => {
  return NAVIGATION_CONFIG.FOOTER_LINKS;
};

/**
 * Check if a user has access to a specific navigation item
 * @param {Object} navItem - Navigation item object
 * @param {boolean} isAuthenticated - User authentication status
 * @param {Object} user - User object with role information
 * @returns {boolean} Whether user has access to the navigation item
 */
export const hasAccessToNavItem = (navItem, isAuthenticated, user) => {
  // Public routes are always accessible
  if (NAVIGATION_CONFIG.PUBLIC.includes(navItem)) {
    return true;
  }

  // Guest routes are only accessible when not authenticated
  if (NAVIGATION_CONFIG.GUEST.includes(navItem)) {
    return !isAuthenticated;
  }

  // Auth required routes need authentication
  if (NAVIGATION_CONFIG.AUTH_REQUIRED.includes(navItem)) {
    if (!isAuthenticated) return false;
    
    // Check role exclusions
    if (navItem.excludeForRoles && user && navItem.excludeForRoles.includes(user.role)) {
      return false;
    }
    
    return true;
  }

  // Role-specific routes
  if (!isAuthenticated || !user) return false;

  if (NAVIGATION_CONFIG.CLIENT.includes(navItem)) {
    return user.role === 'client';
  }

  if (NAVIGATION_CONFIG.ADMIN.includes(navItem)) {
    return ['admin', 'superadmin'].includes(user.role);
  }

  return false;
};

/**
 * Get user display name for navigation
 * @param {Object} user - User object
 * @returns {string} Display name for the user
 */
export const getUserDisplayName = (user) => {
  if (!user) return 'Guest';
  
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  
  if (user.name) return user.name;
  if (user.email) return user.email.split('@')[0];
  
  return 'User';
};

/**
 * Get appropriate redirect path after login based on user role
 * @param {Object} user - User object
 * @param {string} savedRedirect - Previously saved redirect path
 * @returns {string} Redirect path
 */
export const getPostLoginRedirect = (user, savedRedirect = null) => {
  // Use saved redirect if it exists and is valid
  if (savedRedirect && 
      savedRedirect !== '/signin' && 
      savedRedirect !== '/register' &&
      savedRedirect !== '/reset-password') {
    return savedRedirect;
  }
  
  // Role-based default redirects
  if (user) {
    switch (user.role) {
      case 'admin':
      case 'superadmin':
        return '/admin/dashboard';
      case 'client':
        return '/my-orders';
      default:
        return '/home';
    }
  }
  
  return '/home';
};

/**
 * Validate navigation path
 * @param {string} path - Navigation path to validate
 * @returns {boolean} Whether the path is valid
 */
export const isValidNavigationPath = (path) => {
  if (!path || typeof path !== 'string') return false;
  
  // Check if path exists in any navigation configuration
  const allNavItems = [
    ...NAVIGATION_CONFIG.PUBLIC,
    ...NAVIGATION_CONFIG.AUTH_REQUIRED,
    ...NAVIGATION_CONFIG.CLIENT,
    ...NAVIGATION_CONFIG.ADMIN,
    ...NAVIGATION_CONFIG.GUEST,
    ...NAVIGATION_CONFIG.FOOTER_LINKS
  ];
  
  return allNavItems.some(item => item.path === path);
};

/**
 * Get navigation item by path
 * @param {string} path - Navigation path
 * @returns {Object|null} Navigation item object or null if not found
 */
export const getNavigationItemByPath = (path) => {
  const allNavItems = [
    ...NAVIGATION_CONFIG.PUBLIC,
    ...NAVIGATION_CONFIG.AUTH_REQUIRED,
    ...NAVIGATION_CONFIG.CLIENT,
    ...NAVIGATION_CONFIG.ADMIN,
    ...NAVIGATION_CONFIG.GUEST,
    ...NAVIGATION_CONFIG.FOOTER_LINKS
  ];
  
  return allNavItems.find(item => item.path === path) || null;
};