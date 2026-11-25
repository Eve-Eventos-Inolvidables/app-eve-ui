import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../stores/auth.store";
import { getLandingPath } from "../../utils/roleNavigation";

export const PublicRoute = () => {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const onboardingPending = useAuthStore((state) => state.onboardingPending);

  if (!token) {
    return <Outlet />;
  }

  const target = onboardingPending
    ? "/onboarding/interests"
    : getLandingPath(user?.roleName);

  return <Navigate to={target} replace />;
};
