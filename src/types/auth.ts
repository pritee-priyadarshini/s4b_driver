export type LoginUser = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  platformRole: string;
};

export type SiteAccess = {
  siteId: number;
  siteRole: string;
  siteName: string;
  address: string;
};

export type LoginResponse = {
  accessToken: string;
  user: LoginUser;
  siteAccess?: SiteAccess;
};

export type AuthProfileUser = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  platformRole: string;
  memberSince?: number;
  createdAt?: string;
};

export type AuthProfileOrganisation = {
  id: number;
  name: string;
  type: string;
  registrationNumber?: string;
  address?: string;
  brandName?: string;
  venueType?: string;
  logoUrl?: string;
  region?: string;
  createdAt?: string;
};

export type AuthProfileRole = {
  platformRole: string;
  orgRole: string | null;
  siteRole: string | null;
};

export type AuthProfileSite = {
  id: number;
  name: string;
  address: string;
  postcode?: string;
  contactEmail?: string;
  contactMobile?: string;
  isActive?: boolean;
  siteRole: string;
  grantedAt?: string;
  latitude?: number;
  longitude?: number;
};

export type AuthProfile = {
  user: AuthProfileUser;
  organisation: AuthProfileOrganisation | null;
  role: AuthProfileRole;
  subscription?: unknown;
  sites: AuthProfileSite[];
};

export type AuthDriver = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  platformRole: string;
  orgRole: string | null;
  siteRole: string | null;
  profile: AuthProfile;
  siteAccess?: SiteAccess;
  accessToken: string;
};
