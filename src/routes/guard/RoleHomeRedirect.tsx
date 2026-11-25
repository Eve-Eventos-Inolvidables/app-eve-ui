import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../stores/auth.store";
import { getLandingPath } from "../../utils/roleNavigation";

export function RoleHomeRedirect() {
  const user = useAuthStore((state) => state.user);
  const onboardingPending = useAuthStore((state) => state.onboardingPending);

  const target = onboardingPending
    ? "/onboarding/interests"
    : getLandingPath(user?.roleName);

  return <Navigate to={target} replace />;
}
