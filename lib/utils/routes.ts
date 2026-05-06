const PROTECTED_PREFIXES = ['/dashboard', '/progress', '/badges', '/craving-toolkit'];
const AUTH_ROUTES = ['/login', '/register'];
const ONBOARDING_PREFIX = '/onboarding';

export const isProtectedRoute = (path: string) =>
  PROTECTED_PREFIXES.some((p) => path.startsWith(p));

export const isAuthRoute = (path: string) => AUTH_ROUTES.includes(path);

export const isOnboardingRoute = (path: string) => path.startsWith(ONBOARDING_PREFIX);
