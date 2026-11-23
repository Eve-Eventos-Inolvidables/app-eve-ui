import { queryClient } from "../api/queryClient";
import { toaster } from "../components/ui/chakra-base/toaster-instance";
import { useAuthStore } from "../stores/auth.store";

const SESSION_EXPIRED_TOAST_ID = "session-expired";

export function clearSession({ expired = false }: { expired?: boolean } = {}) {
  const hadToken = Boolean(useAuthStore.getState().token);

  useAuthStore.getState().clearAuth();

  if (!hadToken) {
    return;
  }

  queryClient.clear();

  if (expired && !toaster.isVisible(SESSION_EXPIRED_TOAST_ID)) {
    toaster.create({
      id: SESSION_EXPIRED_TOAST_ID,
      title: "Sesión expirada",
      description: "Vuelve a iniciar sesión para continuar.",
      type: "warning",
    });
  }
}
