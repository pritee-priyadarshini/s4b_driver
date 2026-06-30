import {
  AuthDriver,
  AuthProfile,
  LoginResponse,
  SiteAccess,
} from '../types/auth';

export function isDriverSiteRole(siteRole?: string | null): boolean {
  return siteRole?.toUpperCase() === 'DRIVER';
}

export function resolveSiteAccess(
  profile: AuthProfile,
  siteAccessFromLogin?: SiteAccess,
): SiteAccess | undefined {
  if (siteAccessFromLogin) {
    return siteAccessFromLogin;
  }

  const primarySite = profile.sites[0];
  if (!primarySite) {
    return undefined;
  }

  return {
    siteId: primarySite.id,
    siteRole: primarySite.siteRole,
    siteName: primarySite.name,
    address: primarySite.address,
  };
}

export function buildAuthDriver(
  profile: AuthProfile,
  accessToken: string,
  siteAccessFromLogin?: SiteAccess,
): AuthDriver {
  const siteAccess = resolveSiteAccess(profile, siteAccessFromLogin);
  const siteRole = profile.role.siteRole ?? siteAccess?.siteRole ?? null;

  return {
    id: profile.user.id,
    firstName: profile.user.firstName,
    lastName: profile.user.lastName,
    email: profile.user.email,
    phoneNumber: profile.user.phoneNumber ?? '',
    platformRole: profile.user.platformRole,
    orgRole: profile.role.orgRole,
    siteRole,
    profile,
    siteAccess,
    accessToken,
  };
}

export function assertDriverAccount(
  loginResponse: LoginResponse,
  profile: AuthProfile,
): void {
  const siteRole =
    loginResponse.siteAccess?.siteRole ??
    profile.role.siteRole ??
    profile.sites[0]?.siteRole;

  if (!isDriverSiteRole(siteRole)) {
    throw new Error('NOT_A_DRIVER');
  }
}
