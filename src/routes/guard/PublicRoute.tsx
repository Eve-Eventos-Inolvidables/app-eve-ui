import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../stores/auth.store";
import { getLandingPath } from "../../utils/roleNavigation";

export const PublicRoute = () => {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  return token ? (
    <Navigate to={getLandingPath(user?.roleName)} replace />
  ) : (
    <Outlet />
  );
};
