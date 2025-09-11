import { FirebaseError } from "firebase/app";

/**
 * Converts Firebase auth error codes to user-friendly messages
 */
export function getAuthErrorMessage(error: unknown): string {
  if (!(error instanceof FirebaseError)) {
    return error instanceof Error ? error.message : "An unexpected error occurred";
  }

  switch (error.code) {
    // Login errors
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Invalid email or password. Please check your credentials and try again.";
    
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    
    case "auth/user-disabled":
      return "This account has been disabled. Please contact support for assistance.";
    
    case "auth/too-many-requests":
      return "Too many failed attempts. Please wait a few minutes before trying again.";

    // Registration errors
    case "auth/email-already-in-use":
      return "An account with this email already exists. Try signing in instead.";
    
    case "auth/weak-password":
      return "Password is too weak. Please use at least 6 characters with a mix of letters and numbers.";
    
    case "auth/operation-not-allowed":
      return "Account creation is currently disabled. Please contact support.";

    // Password reset errors
    case "auth/user-not-found":
      return "No account found with this email address.";
    
    case "auth/invalid-action-code":
    case "auth/expired-action-code":
      return "This reset link is invalid or has expired. Please request a new one.";

    // Network errors
    case "auth/network-request-failed":
      return "Network error. Please check your internet connection and try again.";
    
    case "auth/timeout":
      return "Request timed out. Please try again.";

    // Generic errors
    case "auth/internal-error":
      return "Something went wrong on our end. Please try again later.";
    
    case "auth/invalid-api-key":
    case "auth/app-deleted":
      return "Service configuration error. Please contact support.";

    default:
      // For unknown errors, return a generic message but log the actual error for debugging
      console.error("Unknown Firebase auth error:", error.code, error.message);
      return "Unable to complete this action. Please try again or contact support if the problem persists.";
  }
}
