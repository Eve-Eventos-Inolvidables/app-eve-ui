import {
  Box,
  Button,
  Dialog,
  Portal,
  Stack,
  Text,
} from "@chakra-ui/react";
import { UserX } from "lucide-react";
import { useState } from "react";
import type { EventManager } from "../../../api/eventManager.api";
import {
  DataTable,
  type DataTableColumn,
} from "../../../components/ui/DataTable";
import { DestructiveConfirmDialog } from "../../../components/ui/DestructiveConfirmDialog";
import { EmptyState } from "../../../components/ui/EmptyState";
import { toaster } from "../../../components/ui/chakra-base/toaster-instance";
import { useDeleteEventManager } from "../../../queries/eventManager.queries";
import type { SimpleEventDto } from "../../../types/event.types";
import type { UserDto } from "../../../types/auth.types";
import { formatDate } from "../../../utils/date";
import { getErrorMessage } from "../../../utils/error";

interface ManagerDetailsDialogProps {
  manager: UserDto | null;
  assignments: EventManager[];
  assignmentsLoading: boolean;
  assignmentsErrorMessage?: string;
  eventsById: Map<number, SimpleEventDto>;
  eventsLoading: boolean;
  eventsErrorMessage?: string;
  onRetry: () => void;
  onClose: () => void;
}

interface AssignmentRow extends EventManager {
  event?: SimpleEventDto;
}

export function ManagerDetailsDialog({
  manager,
  assignments,
  assignmentsLoading,
  assignmentsErrorMessage,
  eventsById,
  eventsLoading,
  eventsErrorMessage,
  onRetry,
  onClose,
}: ManagerDetailsDialogProps) {
  const [assignmentToRemove, setAssignmentToRemove] =
    useState<AssignmentRow | null>(null);
  const deleteMutation = useDeleteEventManager();

  const rows: AssignmentRow[] = assignments.map((assignment) => ({
    ...assignment,
    event: eventsById.get(assignment.eventId),
  }));

  const columns: DataTableColumn<AssignmentRow>[] = [
    {
      key: "event",
      header: "Evento",
      render: (assignment) => (
        <Text fontWeight="medium">
          {assignment.event?.name ?? "Evento no disponible"}
        </Text>
      ),
    },
    {
      key: "date",
      header: "Fecha del evento",
      render: (assignment) => (
        <Text color="fg.muted">
          {assignment.event ? formatDate(assignment.event.date) : "-"}
        </Text>
      ),
    },
    {
      key: "assignedAt",
      header: "Fecha de asignación",
      render: (assignment) => (
        <Text color="fg.muted">{formatDate(assignment.assignedAt)}</Text>
      ),
    },
    {
      key: "actions",
      header: "Acciones",
      align: "end",
      render: (assignment) => (
        <Button
          colorPalette="red"
          onClick={() => setAssignmentToRemove(assignment)}
          size="xs"
          variant="ghost"
        >
          <UserX /> Desasignar
        </Button>
      ),
    },
  ];

  const errorMessage = assignmentsErrorMessage ?? eventsErrorMessage;

  const handleConfirmRemove = async () => {
    if (!assignmentToRemove || deleteMutation.isPending) {
      return;
    }

    const assignment = assignmentToRemove;
    const eventName = assignment.event?.name;

    try {
      const response = await deleteMutation.mutateAsync(assignment.id);
      if (deleteMutation.isError && response?.message) {
        throw new Error(
          response.message ?? "No se pudo desasignar el manager.",
        );
      }

      toaster.create({
        title: "Manager desasignado",
        description: eventName
          ? `${manager?.name} ya no está asignado al evento ${eventName}.`
          : "La asignación al evento fue eliminada.",
        type: "success",
      });
    } catch (error) {
      toaster.create({
        title: "No se pudo desasignar",
        description: getErrorMessage(
          error,
          "No se pudo desasignar el manager del evento.",
        ),
        type: "error",
      });
    } finally {
      setAssignmentToRemove(null);
    }
  };

  return (
    <>
      <Dialog.Root
        onOpenChange={({ open }) => {
          if (!open) {
            onClose();
          }
        }}
        open={Boolean(manager)}
        size="lg"
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content maxH="85vh" overflowY="auto">
              <Dialog.Header>
                <Dialog.Title>
                  Eventos asignados a {manager?.name}
                </Dialog.Title>
              </Dialog.Header>

              <Dialog.Body>
                <Stack gap="4">
                  <Text color="fg.muted">{manager?.email}</Text>

                  <Box>
                    <DataTable
                      columns={columns}
                      emptyState={
                        <EmptyState title="Este manager todavía no tiene eventos asignados" />
                      }
                      errorMessage={errorMessage}
                      isLoading={
                        assignmentsLoading ||
                        (rows.length > 0 && eventsLoading)
                      }
                      loadingMessage="Cargando eventos asignados..."
                      onRetry={onRetry}
                      rows={rows}
                      size="sm"
                    />
                  </Box>
                </Stack>
              </Dialog.Body>

              <Dialog.Footer>
                <Button onClick={onClose} variant="outline">
                  Cerrar
                </Button>
              </Dialog.Footer>

              <Dialog.CloseTrigger />
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      <DestructiveConfirmDialog
        confirmLabel="Desasignar"
        description={
          assignmentToRemove
            ? `¿Seguro que quieres desasignar a ${manager?.name} del evento ${
                assignmentToRemove.event?.name ??
                `#${assignmentToRemove.eventId}`
              }? Esta acción no se puede deshacer.`
            : undefined
        }
        isLoading={deleteMutation.isPending}
        onConfirm={() => void handleConfirmRemove()}
        onOpenChange={(open) => {
          if (!open) {
            setAssignmentToRemove(null);
          }
        }}
        open={Boolean(assignmentToRemove)}
        title="Desasignar event manager"
      />
    </>
  );
}
