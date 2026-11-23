import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../stores/auth.store";
import { getLandingPath } from "../../utils/roleNavigation";

export function RoleHomeRedirect() {
  const user = useAuthStore((state) => state.user);
  return <Navigate to={getLandingPath(user?.roleName)} replace />;
}
