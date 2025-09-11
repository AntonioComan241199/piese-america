import { useState, useEffect, useCallback } from 'react';
import { BREAKPOINTS, ANIMATIONS } from '../components/Layout/constants';

// Debounce utility function
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Custom hook for responsive behavior
export const useResponsive = () => {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });

  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= BREAKPOINTS.MOBILE : false
  );

  const [isTablet, setIsTablet] = useState(
    typeof window !== 'undefined' ? 
      window.innerWidth > BREAKPOINTS.MOBILE && window.innerWidth <= BREAKPOINTS.DESKTOP : false
  );

  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.innerWidth > BREAKPOINTS.DESKTOP : false
  );

  // Debounced resize handler
  const debouncedHandleResize = useCallback(
    debounce(() => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      
      setScreenSize({ width: newWidth, height: newHeight });
      setIsMobile(newWidth <= BREAKPOINTS.MOBILE);
      setIsTablet(newWidth > BREAKPOINTS.MOBILE && newWidth <= BREAKPOINTS.DESKTOP);
      setIsDesktop(newWidth > BREAKPOINTS.DESKTOP);
    }, ANIMATIONS.RESIZE_DEBOUNCE),
    []
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.addEventListener('resize', debouncedHandleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', debouncedHandleResize);
    };
  }, [debouncedHandleResize]);

  return {
    screenSize,
    isMobile,
    isTablet,
    isDesktop,
    breakpoints: BREAKPOINTS
  };
};

// Custom hook for scroll utilities
export const useScrollUtils = () => {
  const scrollToTop = useCallback((behavior = ANIMATIONS.SCROLL_BEHAVIOR) => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior });
    }
  }, []);

  const scrollToElement = useCallback((elementId, behavior = ANIMATIONS.SCROLL_BEHAVIOR) => {
    if (typeof window !== 'undefined') {
      const element = document.getElementById(elementId);
      if (element) {
        element.scrollIntoView({ behavior });
      }
    }
  }, []);

  return {
    scrollToTop,
    scrollToElement
  };
};

// Custom hook for navigation utilities
export const useNavigation = () => {
  const { scrollToTop } = useScrollUtils();

  const handleNavigationClick = useCallback((navigate, path) => {
    navigate(path);
    scrollToTop();
  }, [scrollToTop]);

  return {
    handleNavigationClick,
    scrollToTop
  };
};