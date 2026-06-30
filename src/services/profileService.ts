import api from './api';

export type UpdateProfilePayload = {
  firstName?: string;
  lastName?: string;
  mobile?: string;
};

export const profileService = {
  updateProfile: (userId: number, data: UpdateProfilePayload) =>
    api.patch(`/charity/users/${userId}`, data),
};
