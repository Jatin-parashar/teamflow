export function getFirebaseAuthErrorMessage(errorString: string): string {
  const errorMap: Record<string, string> = {
    "auth/invalid-email": "The email address is invalid.",
    "auth/invalid-credential": "Incorrect Password.",
    "auth/missing-email": "Please enter an email address.",
    "auth/user-not-found": "No user found with this email.",
    "auth/wrong-password": "Incorrect password.",
    "auth/email-already-in-use": "This email is already registered.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/too-many-requests": "Too many attempts. Try again later.",
    "auth/network-request-failed": "Network error. Check your connection.",
    "auth/popup-closed-by-user": "Sign-in popup was closed.",
    "auth/operation-not-allowed": "This sign-in method is not enabled.",
    "auth/requires-recent-login": "Please log in again to continue.",
    "auth/email-not-verified":
      "Please verify your email before signing in. Check your inbox.",
  };

  if (errorMap[errorString]) return errorMap[errorString];

  const match = errorString.match(/\(auth\/([^)]+)\)/);
  const code = match ? `auth/${match[1]}` : "";

  return errorMap[code] || "An unexpected error occurred. Please try again.";
}
