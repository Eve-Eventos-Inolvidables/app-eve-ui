import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../stores/auth.store";

export const PublicRoute = () => {
  const token = useAuthStore((state) => state.token);
  return token ? <Navigate to="/dash" replace /> : <Outlet />;
};
