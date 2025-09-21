import { User, onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

interface AuthGuardOptions {
  debounceMs?: number;
  maxRetries?: number;
}

/**
 * Debounced authentication state checker to prevent race conditions
 * when auth state changes across multiple tabs
 */
export function createDebouncedAuthGuard(options: AuthGuardOptions = {}) {
  const { debounceMs = 200, maxRetries = 3 } = options;
  
  let authCheckTimeout: NodeJS.Timeout | null = null;
  let retryCount = 0;
  
  return (callback: (user: User | null) => void | Promise<void>) => {
    // Clear any existing timeout
    if (authCheckTimeout) {
      clearTimeout(authCheckTimeout);
    }
    
    // Set up debounced auth check
    authCheckTimeout = setTimeout(() => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        try {
          await callback(user);
          retryCount = 0; // Reset retry count on success
        } catch (error) {
          console.error("Auth guard callback error:", error);
          
          // Retry logic for transient errors
          if (retryCount < maxRetries) {
            retryCount++;
            console.log(`Retrying auth check (attempt ${retryCount}/${maxRetries})`);
            
            // Retry after a short delay
            setTimeout(() => {
              createDebouncedAuthGuard(options)(callback);
            }, 1000);
          }
        }
        
        unsubscribe();
      });
    }, debounceMs);
    
    // Return cleanup function
    return () => {
      if (authCheckTimeout) {
        clearTimeout(authCheckTimeout);
      }
    };
  };
}

/**
 * Hook for stable authentication state with cross-tab synchronization
 */
export function useStableAuth(callback: (user: User | null) => void | Promise<void>) {
  const debouncedAuthGuard = createDebouncedAuthGuard({ debounceMs: 200 });
  return debouncedAuthGuard(callback);
}

/**
 * Check if current tab is the "primary" tab for auth state
 * This helps prevent multiple tabs from interfering with each other
 */
export function isPrimaryAuthTab(): boolean {
  if (typeof window === 'undefined') return true;
  
  // Simple heuristic: first tab or tab with focus
  return document.hasFocus() || !document.hidden;
}
