import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../stores/auth.store";

// interface RequirePermissionProps {
//   permission: string;
// }

export const RequirePermission = () => {
  const user = useAuthStore((s) => s.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const hasPermission =
    user.roleName.toLowerCase() === "admin" 
    // ||
    // (user.permissions && user.permissions.includes(permission));

  return hasPermission ? <Outlet /> : <Navigate to="/dash" replace />;
};
