export interface CurrentUser {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user';
  createdAt: Date;
}

export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem("auth_token");
  return token !== null && token !== "";
};

export const getCurrentUser = (): CurrentUser | null => {
  const userStr = localStorage.getItem("current_user");
  if (!userStr) return null;
  
  try {
    const user = JSON.parse(userStr);
    return {
      ...user,
      createdAt: new Date(user.createdAt)
    };
  } catch {
    return null;
  }
};

export const isAdmin = (): boolean => {
  const user = getCurrentUser();
  return user?.role === 'admin';
};

export const getFullName = (): string => {
  const user = getCurrentUser();
  return user ? `${user.firstName} ${user.lastName}` : 'Kullanıcı';
};

export const logout = (): void => {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("current_user");
  window.location.href = "/auth";
};

export const requireAuth = (component: () => React.JSX.Element) => {
  if (!isAuthenticated()) {
    window.location.href = "/auth";
    return null;
  }
  return component();
};