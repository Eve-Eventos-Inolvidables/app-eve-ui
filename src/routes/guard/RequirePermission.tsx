import { Navigate, Outlet } from "react-router-dom";
import { useIsAdmin } from "../../utils/permissions";

export const RequirePermission = () => {
  const isAdmin = useIsAdmin();

  return isAdmin ? <Outlet /> : <Navigate to="/dash" replace />;
};
