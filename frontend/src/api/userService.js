import { request } from './client';
import { mockUser } from '../data/mockData';

// GET /api/me — returns the current user's profile (without password)
export const getCurrentUser = () =>
  request(() => {
    const { password: _, ...profile } = mockUser;
    return profile;
  });

// PATCH /api/me — merges updates into the user profile
// Mutating the module-level mockUser is the seam that becomes a real
// PATCH /api/me call later — the contract stays the same.
export const updateProfile = (updates) =>
  request(() => {
    Object.assign(mockUser, updates);
    const { password: _, ...profile } = mockUser;
    return profile;
  });

// POST /api/me/password — validates current, sets new
export const updatePassword = ({ currentPassword, newPassword }) =>
  request(() => {
    if (currentPassword !== mockUser.password) {
      throw new Error('Current password is incorrect');
    }
    mockUser.password = newPassword;
    return { success: true };
  });
