// Authentication helper utilities

// Role hierarchy for permission checking
const ROLE_HIERARCHY = {
  'user': 1,
  'moderator': 2,
  'admin': 3,
  'superadmin': 4
};

// Permission sets for different roles
const ROLE_PERMISSIONS = {
  'user': ['read:own', 'update:own'],
  'moderator': ['read:own', 'update:own', 'read:others', 'moderate:content'],
  'admin': ['read:own', 'update:own', 'read:others', 'moderate:content', 'manage:users', 'manage:orders'],
  'superadmin': ['*'] // All permissions
};

/**
 * Check if user has required role or higher
 * @param {string} userRole - User's current role
 * @param {string} requiredRole - Required minimum role
 * @returns {boolean}
 */
export const hasRole = (userRole, requiredRole) => {
  if (!userRole || !requiredRole) return false;
  
  const userLevel = ROLE_HIERARCHY[userRole.toLowerCase()] || 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole.toLowerCase()] || 0;
  
  return userLevel >= requiredLevel;
};

/**
 * Check if user has specific permission
 * @param {string} userRole - User's current role
 * @param {string} permission - Permission to check
 * @returns {boolean}
 */
export const hasPermission = (userRole, permission) => {
  if (!userRole || !permission) return false;
  
  const rolePermissions = ROLE_PERMISSIONS[userRole.toLowerCase()] || [];
  
  // Check for wildcard permission (superadmin)
  if (rolePermissions.includes('*')) return true;
  
  // Check for exact permission match
  return rolePermissions.includes(permission);
};

/**
 * Check if user can access a specific resource
 * @param {Object} user - User object
 * @param {string} resourceType - Type of resource ('order', 'offer', etc.)
 * @param {Object} resource - Resource object
 * @param {string} action - Action to perform ('read', 'update', 'delete')
 * @returns {boolean}
 */
export const canAccessResource = (user, resourceType, resource, action) => {
  if (!user || !resource) return false;
  
  // Superadmin can access everything
  if (user.role === 'superadmin') return true;
  
  // Admin can access most things
  if (user.role === 'admin' && ['read', 'update'].includes(action)) return true;
  
  // Resource owner can access their own resources
  if (resource.userId === user.id || resource.createdBy === user.id) {
    return true;
  }
  
  // Additional role-based checks
  switch (resourceType) {
    case 'order':
      return user.role === 'admin' || user.role === 'moderator';
    case 'offer':
      return user.role === 'admin';
    default:
      return false;
  }
};

/**
 * Get redirect path after login based on user role
 * @param {Object} user - User object
 * @param {string} defaultPath - Default redirect path
 * @returns {string}
 */
export const getRedirectPath = (user, defaultPath = '/') => {
  if (!user) return defaultPath;
  
  // Check for saved redirect path
  const savedRedirect = localStorage.getItem('redirectTo');
  if (savedRedirect && savedRedirect !== '/signin' && savedRedirect !== '/register') {
    localStorage.removeItem('redirectTo');
    return savedRedirect;
  }
  
  // Role-based default redirects
  switch (user.role) {
    case 'admin':
    case 'superadmin':
      return '/admin/dashboard';
    case 'moderator':
      return '/admin/orders';
    default:
      return defaultPath;
  }
};

/**
 * Format user display name
 * @param {Object} user - User object
 * @returns {string}
 */
export const formatUserName = (user) => {
  if (!user) return 'Guest';
  
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  
  if (user.name) return user.name;
  if (user.email) return user.email.split('@')[0];
  
  return 'User';
};

/**
 * Get user avatar URL or initials
 * @param {Object} user - User object
 * @returns {Object} - {type: 'url'|'initials', value: string}
 */
export const getUserAvatar = (user) => {
  if (!user) {
    return { type: 'initials', value: 'G' };
  }
  
  // Return avatar URL if available
  if (user.avatar || user.profileImage) {
    return { type: 'url', value: user.avatar || user.profileImage };
  }
  
  // Generate initials
  const name = formatUserName(user);
  const initials = name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
    
  return { type: 'initials', value: initials || 'U' };
};

/**
 * Check if current session is close to expiry
 * @param {string} token - JWT access token
 * @param {number} warningMinutes - Minutes before expiry to show warning
 * @returns {Object} - {isExpiring: boolean, minutesLeft: number}
 */
export const checkTokenExpiry = (token, warningMinutes = 5) => {
  if (!token) return { isExpiring: false, minutesLeft: 0 };
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    const expiryTime = payload.exp;
    
    if (!expiryTime) return { isExpiring: false, minutesLeft: 0 };
    
    const secondsLeft = expiryTime - currentTime;
    const minutesLeft = Math.floor(secondsLeft / 60);
    
    return {
      isExpiring: minutesLeft <= warningMinutes && minutesLeft > 0,
      minutesLeft: Math.max(0, minutesLeft)
    };
  } catch {
    return { isExpiring: false, minutesLeft: 0 };
  }
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} - {isValid: boolean, errors: string[], score: number}
 */
export const validatePassword = (password) => {
  const errors = [];
  let score = 0;
  
  if (!password) {
    return { isValid: false, errors: ['Password is required'], score: 0 };
  }
  
  // Length check
  if (password.length < 8) {
    errors.push('Minimum 8 characters required');
  } else {
    score += 1;
  }
  
  // Uppercase check
  if (!/[A-Z]/.test(password)) {
    errors.push('At least one uppercase letter required');
  } else {
    score += 1;
  }
  
  // Lowercase check
  if (!/[a-z]/.test(password)) {
    errors.push('At least one lowercase letter required');
  } else {
    score += 1;
  }
  
  // Number check
  if (!/\d/.test(password)) {
    errors.push('At least one number required');
  } else {
    score += 1;
  }
  
  // Special character check
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('At least one special character required');
  } else {
    score += 1;
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    score
  };
};

/**
 * Safe localStorage operations for authentication
 */
export const authStorage = {
  setTokens: (accessToken, refreshToken) => {
    try {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
    } catch (error) {
      console.warn('Failed to save tokens:', error);
    }
  },
  
  getTokens: () => {
    try {
      return {
        accessToken: localStorage.getItem('accessToken'),
        refreshToken: localStorage.getItem('refreshToken')
      };
    } catch {
      return { accessToken: null, refreshToken: null };
    }
  },
  
  clearTokens: () => {
    try {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('redirectTo');
    } catch (error) {
      console.warn('Failed to clear tokens:', error);
    }
  },
  
  setRedirectPath: (path) => {
    try {
      localStorage.setItem('redirectTo', path);
    } catch (error) {
      console.warn('Failed to save redirect path:', error);
    }
  },
  
  getRedirectPath: () => {
    try {
      return localStorage.getItem('redirectTo');
    } catch {
      return null;
    }
  }
};