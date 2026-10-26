import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../stores/auth.store";

export const PublicRoute = () => {
  const user = useAuthStore((s) => s.user);
  return user ? <Navigate to="/dash" replace /> : <Outlet />;
};
