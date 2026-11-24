import { Navigate, Outlet } from "react-router-dom";
import { useIsManager } from "../../utils/permissions";

export const RequireManager = () => {
  const isManager = useIsManager();

  return isManager ? <Outlet /> : <Navigate to="/dash" replace />;
};
