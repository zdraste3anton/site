
export function resolvePostAuthDestination(fromPathname) {
  if (typeof fromPathname !== 'string' || !fromPathname.startsWith('/')) {
    return '/dashboard';
  }
  const publicOnly = new Set(['/', '/login', '/register']);
  if (publicOnly.has(fromPathname)) {
    return '/dashboard';
  }
  return fromPathname;
}
