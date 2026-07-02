import { request } from './client';
import { mockUser } from '../data/mockData';

export const login = ({ email, password }) =>
  request(() => {
    if (email === mockUser.email && password === mockUser.password) {
      const { password: _, ...userWithoutPassword } = mockUser;
      return {
        user: userWithoutPassword,
        token: 'mock-jwt-' + Date.now(),
      };
    }
    throw new Error('Invalid email or password');
  });

export const signup = ({ name, email, password }) =>
  request(() => {
    const initials = name
      ? name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : 'U';
    const newUser = {
      id: Date.now(),
      name,
      email,
      role: 'Recruiter',
      avatarInitials: initials,
    };
    return {
      user: newUser,
      token: 'mock-jwt-' + Date.now(),
    };
  });

export const logout = () => Promise.resolve();

export const loginWithProvider = (provider) =>
  request(async () => {
    // real OAuth popups take time, add ~250ms extra delay on top of client's 350ms
    await new Promise((resolve) => setTimeout(resolve, 250));
    const { password: _, ...userWithoutPassword } = mockUser;
    return {
      user: userWithoutPassword,
      token: `mock-jwt-${provider}-${Date.now()}`,
    };
  });

