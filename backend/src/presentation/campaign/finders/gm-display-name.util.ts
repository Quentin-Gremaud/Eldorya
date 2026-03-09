interface GmUserInfo {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
}

export function resolveGmDisplayName(gmUser: GmUserInfo | null): string {
  if (!gmUser) return 'Unknown';
  return (
    [gmUser.firstName, gmUser.lastName].filter(Boolean).join(' ') ||
    gmUser.email ||
    'Unknown'
  );
}
