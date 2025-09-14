import { User } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs, collectionGroup } from "firebase/firestore";
import { db } from "./firebase";

export interface SetupStatus {
  isSetupComplete: boolean;
  redirectTo?: string;
}

/**
 * Checks if a user has completed the company setup process
 * Returns the setup status and where to redirect if incomplete
 */
export async function checkSetupStatus(user: User): Promise<SetupStatus> {
  if (!user) {
    return { isSetupComplete: false, redirectTo: "/login" };
  }

  try {
    // First, check if user is a member of any organization using collection group query
    const usersRef = collectionGroup(db, "users");
    const usersQuery = query(usersRef, where("uid", "==", user.uid));
    const usersSnapshot = await getDocs(usersQuery);

    if (!usersSnapshot.empty) {
      // User is a member of an organization, get the organization document
      const userDoc = usersSnapshot.docs[0];
      const orgRef = userDoc.ref.parent.parent; // organizations/{orgId}
      
      if (orgRef) {
        const orgDoc = await getDoc(orgRef);
        if (orgDoc.exists()) {
          const orgData = orgDoc.data();
          const isSetupComplete = orgData?.setupCompleted === true;

          if (!isSetupComplete) {
            return { isSetupComplete: false, redirectTo: "/onboarding/company-setup" };
          }

          return { isSetupComplete: true };
        }
      }
    }

    // If not found as a member, check if user is the creator of an organization
    const orgsRef = collection(db, "organizations");
    const q = query(orgsRef, where("createdBy", "==", user.uid));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      // Organization doesn't exist, redirect to company setup
      return { isSetupComplete: false, redirectTo: "/onboarding/company-setup" };
    }

    const orgDoc = querySnapshot.docs[0];
    const orgData = orgDoc.data();
    const isSetupComplete = orgData?.setupCompleted === true;

    if (!isSetupComplete) {
      return { isSetupComplete: false, redirectTo: "/onboarding/company-setup" };
    }

    return { isSetupComplete: true };
  } catch (error) {
    console.error("Error checking setup status:", error);
    // On error, assume setup is incomplete for safety
    return { isSetupComplete: false, redirectTo: "/onboarding/company-setup" };
  }
}

/**
 * Hook to check setup status and redirect if needed
 * Use this in layouts or pages that require setup completion
 */
export function useSetupGuard(user: User | null, router: { replace: (path: string) => void }) {
  const checkAndRedirect = async () => {
    if (!user) return;

    const setupStatus = await checkSetupStatus(user);
    
    if (!setupStatus.isSetupComplete && setupStatus.redirectTo) {
      // Only redirect if we're not already on the target page
      if (window.location.pathname !== setupStatus.redirectTo) {
        router.replace(setupStatus.redirectTo);
      }
    }
  };

  return { checkAndRedirect };
}

/**
 * Pages that don't require setup completion
 */
export const ALLOWED_WITHOUT_SETUP = [
  "/login",
  "/register", 
  "/invite",
  "/onboarding/company-setup",
  "/onboarding/select-plan",
  "/onboarding/getting-started",
  "/onboarding/quick-setup",
  "/logout",
  "/forgot",
  "/reset"
];

/**
 * Check if current path is allowed without setup completion
 */
export function isAllowedWithoutSetup(pathname: string): boolean {
  return ALLOWED_WITHOUT_SETUP.some(allowedPath => 
    pathname === allowedPath || pathname.startsWith(allowedPath + "/")
  );
}
