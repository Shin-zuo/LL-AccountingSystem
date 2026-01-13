import { useAuth } from "./useAuth";
import { ROLE_PERMISSIONS, hasPermission, type Permission, type UserRole } from "@shared/schema";

export function usePermissions() {
  const { user } = useAuth();

  const checkPermission = (permission: Permission): boolean => {
    if (!user?.role) return false;
    return hasPermission(user.role as UserRole, permission);
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some(permission => checkPermission(permission));
  };

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every(permission => checkPermission(permission));
  };

  return {
    checkPermission,
    hasAnyPermission,
    hasAllPermissions,
    userRole: user?.role,
  };
}
