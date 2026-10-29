import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../stores/auth.store";

export const RequirePermission = () => {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const roleName = user.roleName?.toLowerCase() ?? "";
  const hasPermission = roleName === "administrador";

  return hasPermission ? <Outlet /> : <Navigate to="/dash" replace />;
};
