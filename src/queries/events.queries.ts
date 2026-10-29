import { useMutation } from "@tanstack/react-query";
import { createEvent } from "../api/events.api";
import type { CreateEventRequest } from "../types/event.types";
import type { ApiErrorResponse } from "../types/responses";

export function useCreateEventMutation() {
  return useMutation({
    mutationFn: async (payload: CreateEventRequest) => {
      const response = await createEvent(payload);

      if (!response.success) {
        throw new Error(
          (response as ApiErrorResponse).data?.message ||
            response.message ||
            "No se pudo crear el evento.",
        );
      }

      return response;
    },
  });
}
