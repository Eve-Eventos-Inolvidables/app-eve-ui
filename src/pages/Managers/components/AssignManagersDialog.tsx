import {
  Badge,
  Box,
  Button,
  Checkbox,
  Dialog,
  Field,
  Flex,
  Input,
  Portal,
  Stack,
  Text,
} from "@chakra-ui/react";
import { Check, UserPlus } from "lucide-react";
import { useState } from "react";
import type { UserDto } from "../../../types/auth.types";
import type { SimpleEventDto } from "../../../types/event.types";
import {
  DataTable,
  type DataTableColumn,
} from "../../../components/ui/DataTable";
import { EmptyState } from "../../../components/ui/EmptyState";
import { PaginationControl } from "../../../components/ui/PaginationControl";
import { toaster } from "../../../components/ui/chakra-base/toaster-instance";
import {
  EVENT_PICKER_PAGE_SIZE,
  MANAGER_PICKER_PAGE_SIZE,
} from "../../../constants/pagination";
import { MANAGER_ROLE_ID } from "../../../constants/roles";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import {
  useCreateEventManagersBatch,
  useGetEventManagersByEventId,
} from "../../../queries/eventManager.queries";
import { useGetEvents } from "../../../queries/events.queries";
import { useGetUsers } from "../../../queries/users.queries";
import { getErrorMessage } from "../../../utils/error";
import { formatDate } from "../../../utils/date";

interface AssignManagersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssignManagersDialog({
  open,
  onOpenChange,
}: AssignManagersDialogProps) {
  const [eventSearch, setEventSearch] = useState("");
  const debouncedEventSearch = useDebouncedValue(eventSearch.trim());
  const [eventPageIndex, setEventPageIndex] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<SimpleEventDto | null>(
    null,
  );
  const [userSearch, setUserSearch] = useState("");
  const debouncedUserSearch = useDebouncedValue(userSearch.trim());
  const [userPageIndex, setUserPageIndex] = useState(0);
  const [selectedManagers, setSelectedManagers] = useState<UserDto[]>([]);

  const eventsQuery = useGetEvents(
    {
      page: eventPageIndex,
      size: EVENT_PICKER_PAGE_SIZE,
      name: debouncedEventSearch || undefined,
    },
    open,
  );
  const events = eventsQuery.data?.data ?? [];
  const eventsPagination = eventsQuery.data?.pagination;

  const dialogUsersQuery = useGetUsers(
    {
      roleId: MANAGER_ROLE_ID,
      page: userPageIndex,
      size: MANAGER_PICKER_PAGE_SIZE,
      name: debouncedUserSearch || undefined,
    },
    open,
  );
  const dialogUsers = dialogUsersQuery.data?.data ?? [];
  const usersPagination = dialogUsersQuery.data?.pagination;

  const eventAssignmentsQuery = useGetEventManagersByEventId(
    selectedEvent?.id ?? 0,
  );
  const assignedManagerIds = new Set(
    (eventAssignmentsQuery.data?.data ?? []).map(
      (assignment) => assignment.managerId,
    ),
  );

  const batchMutation = useCreateEventManagersBatch();
  const isAssigning = batchMutation.isPending;

  const eventsErrorMessage = eventsQuery.isError
    ? getErrorMessage(
        eventsQuery.error,
        "No se pudieron cargar los eventos.",
      )
    : undefined;
  const usersErrorMessage = dialogUsersQuery.isError
    ? getErrorMessage(
        dialogUsersQuery.error,
        "No se pudieron cargar los usuarios.",
      )
    : undefined;

  const resetState = () => {
    setEventSearch("");
    setEventPageIndex(0);
    setSelectedEvent(null);
    setUserSearch("");
    setUserPageIndex(0);
    setSelectedManagers([]);
  };

  const handleOpenChange = (details: { open: boolean }) => {
    if (!details.open && isAssigning) {
      return;
    }

    onOpenChange(details.open);

    if (!details.open) {
      resetState();
    }
  };

  const handleEventSearchChange = (value: string) => {
    setEventSearch(value);
    setEventPageIndex(0);
  };

  const handleUserSearchChange = (value: string) => {
    setUserSearch(value);
    setUserPageIndex(0);
  };

  const toggleEvent = (event: SimpleEventDto) => {
    setSelectedEvent((current) =>
      current?.id === event.id ? null : event,
    );
    setSelectedManagers([]);
  };

  const handleManagerToggle = (manager: UserDto, checked: boolean) => {
    if (checked && assignedManagerIds.has(manager.id)) {
      return;
    }

    setSelectedManagers((current) =>
      checked
        ? current.some((selected) => selected.id === manager.id)
          ? current
          : [...current, manager]
        : current.filter((selected) => selected.id !== manager.id),
    );
  };

  const handleAssignSelected = async () => {
    if (!selectedEvent || selectedManagers.length === 0 || isAssigning) {
      return;
    }

    const event = selectedEvent;
    const managersToAssign = selectedManagers.filter(
      (manager) => !assignedManagerIds.has(manager.id),
    );

    if (managersToAssign.length === 0) {
      handleOpenChange({ open: false });
      return;
    }

    const managersById = new Map(
      managersToAssign.map((manager) => [manager.id, manager]),
    );

    try {
      const results = await batchMutation.mutateAsync(
        managersToAssign.map((manager) => ({
          managerId: manager.id,
          eventId: event.id,
        })),
      );

      const succeeded: UserDto[] = [];
      const failed: { manager: UserDto; message: string }[] = [];

      results.forEach(({ request, response, error }) => {
        const manager = managersById.get(request.managerId);

        if (!manager) {
          return;
        }

        if (response?.success) {
          succeeded.push(manager);
          return;
        }

        failed.push({
          manager,
          message: error
            ? getErrorMessage(error, "No se pudo asignar el manager.")
            : response?.message ?? "No se pudo asignar el manager.",
        });
      });

      handleOpenChange({ open: false });

      const descriptionParts = [
        `${succeeded.length} de ${managersToAssign.length} managers asignados a ${event.name}.`,
      ];

      if (failed.length > 0) {
        const failedDetails = failed
          .slice(0, 3)
          .map(({ manager, message }) => `${manager.name}: ${message}`)
          .join("; ");
        const remainingFailures = failed.length - 3;
        descriptionParts.push(
          `No se pudieron asignar: ${failedDetails}${
            remainingFailures > 0 ? `; y ${remainingFailures} más` : ""
          }.`,
        );
      }

      toaster.create({
        title:
          failed.length === 0
            ? "Asignación completada"
            : succeeded.length > 0
              ? "Asignación parcial"
              : "No se pudo completar la asignación",
        description: descriptionParts.join(" "),
        type:
          failed.length === 0
            ? "success"
            : succeeded.length > 0
              ? "warning"
              : "error",
      });
    } catch (error) {
      handleOpenChange({ open: false });
      toaster.create({
        title: "No se pudo completar la asignación",
        description: getErrorMessage(
          error,
          "No se pudo completar la asignación.",
        ),
        type: "error",
      });
    }
  };

  const eventColumns: DataTableColumn<SimpleEventDto>[] = [
    {
      key: "name",
      header: "Nombre",
      render: (event) => <Text fontWeight="medium">{event.name}</Text>,
    },
    {
      key: "date",
      header: "Fecha",
      render: (event) => (
        <Text color="fg.muted">{formatDate(event.date)}</Text>
      ),
    },
    {
      key: "time",
      header: "Hora",
      render: (event) => (
        <Text color="fg.muted">{event.kickOffTime}</Text>
      ),
    },
    {
      key: "action",
      header: "Acción",
      align: "end",
      render: (event) => {
        const isSelected = selectedEvent?.id === event.id;

        return (
          <Button
            colorPalette="brand"
            onClick={() => toggleEvent(event)}
            size="xs"
            variant={isSelected ? "solid" : "outline"}
          >
            {isSelected ? (
              <>
                <Check /> Quitar selección
              </>
            ) : (
              "Seleccionar"
            )}
          </Button>
        );
      },
    },
  ];

  const userColumns: DataTableColumn<UserDto>[] = [
    {
      key: "name",
      header: "Nombre",
      render: (user) => <Text fontWeight="medium">{user.name}</Text>,
    },
    {
      key: "email",
      header: "Email",
      render: (user) => <Text color="fg.muted">{user.email}</Text>,
    },
    {
      key: "role",
      header: "Rol",
      render: (user) => (
        <Badge colorPalette="brand" variant="subtle">
          {user.roleName || "Sin rol"}
        </Badge>
      ),
    },
    {
      key: "select",
      header: "Seleccionar",
      align: "end",
      render: (user) => (
        <Checkbox.Root
          aria-label={`Seleccionar a ${user.name}`}
          checked={selectedManagers.some(
            (selected) => selected.id === user.id,
          )}
          disabled={
            !selectedEvent ||
            isAssigning ||
            assignedManagerIds.has(user.id) ||
            eventAssignmentsQuery.isPending
          }
          onCheckedChange={(details) =>
            handleManagerToggle(user, details.checked === true)
          }
        >
          <Checkbox.HiddenInput />
          <Checkbox.Control>
            <Checkbox.Indicator />
          </Checkbox.Control>
        </Checkbox.Root>
      ),
    },
  ];

  return (
    <Dialog.Root
      onOpenChange={handleOpenChange}
      open={open}
      size="xl"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxH="90vh" maxW="4xl" overflowY="auto">
            <Dialog.Header>
              <Dialog.Title>Asignar event managers</Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <Stack gap="5">
                <Dialog.Description color="fg.muted">
                  Selecciona el evento y luego el usuario que será su manager.
                </Dialog.Description>

                <Box
                  bg="bg.panel"
                  borderColor="border"
                  borderRadius="xl"
                  borderWidth="1px"
                  overflow="hidden"
                >
                  <Box
                    borderBottomColor="border"
                    borderBottomWidth="1px"
                    p="4"
                  >
                    <Box mb="3">
                      <Text fontWeight="semibold">
                        1. Selecciona un evento
                      </Text>
                      <Text color="fg.muted" fontSize="sm">
                        Busca por nombre y elige el evento a administrar.
                      </Text>
                    </Box>
                    <Field.Root>
                      <Field.Label>Buscar evento</Field.Label>
                      <Input
                        onChange={(event) =>
                          handleEventSearchChange(event.target.value)
                        }
                        placeholder="Buscar evento por nombre"
                        value={eventSearch}
                      />
                    </Field.Root>
                  </Box>

                  <DataTable
                    bordered={false}
                    columns={eventColumns}
                    emptyState={
                      <EmptyState title="No se encontraron eventos" />
                    }
                    errorMessage={eventsErrorMessage}
                    isRowActive={(event) =>
                      selectedEvent?.id === event.id
                    }
                    isLoading={eventsQuery.isPending}
                    loadingMessage="Cargando eventos..."
                    maxHeight="xs"
                    onRetry={() => void eventsQuery.refetch()}
                    rows={events}
                    size="sm"
                  />

                  <PaginationControl
                    isFetching={eventsQuery.isFetching}
                    itemLabel="eventos"
                    onPageChange={setEventPageIndex}
                    pagination={eventsPagination}
                  />
                </Box>

                {selectedEvent && (
                  <Box
                    bg="bg.panel"
                    borderColor="border"
                    borderRadius="xl"
                    borderWidth="1px"
                    p="4"
                  >
                    <Flex align="center" gap="3" justify="space-between">
                      <Box>
                        <Text
                          color="fg.muted"
                          fontSize="xs"
                          fontWeight="semibold"
                          textTransform="uppercase"
                        >
                          Evento seleccionado
                        </Text>
                        <Text color="fg" fontWeight="medium">
                          {selectedEvent.name}
                        </Text>
                        <Text color="fg.muted" fontSize="sm">
                          {formatDate(selectedEvent.date)} ·{" "}
                          {selectedEvent.kickOffTime}
                        </Text>
                      </Box>
                      <Badge colorPalette="brand" variant="subtle">
                        Seleccionado
                      </Badge>
                    </Flex>
                  </Box>
                )}

                <Box borderTopColor="border" borderTopWidth="1px" pt="5">
                  <Stack gap="3">
                    <Box>
                      <Text fontWeight="semibold">
                        2. Selecciona un usuario
                      </Text>
                      <Text color="fg.muted" fontSize="sm" mb="3">
                        Marca uno o más managers para el evento seleccionado.
                        Los managers ya asignados aparecen deshabilitados.
                      </Text>
                      <Field.Root>
                        <Field.Label>Buscar manager</Field.Label>
                        <Input
                          onChange={(event) =>
                            handleUserSearchChange(event.target.value)
                          }
                          placeholder="Buscar por nombre"
                          value={userSearch}
                        />
                      </Field.Root>
                    </Box>

                    <Box
                      bg="bg.panel"
                      borderColor="border"
                      borderRadius="xl"
                      borderWidth="1px"
                      overflow="hidden"
                    >
                      <DataTable
                        bordered={false}
                        columns={userColumns}
                        emptyState={
                          <EmptyState title="No se encontraron managers" />
                        }
                        errorMessage={usersErrorMessage}
                        isLoading={dialogUsersQuery.isPending}
                        isRowDisabled={(user) =>
                          assignedManagerIds.has(user.id)
                        }
                        loadingMessage="Cargando managers..."
                        maxHeight="sm"
                        onRetry={() => void dialogUsersQuery.refetch()}
                        rows={dialogUsers}
                        size="sm"
                      />

                      <PaginationControl
                        isFetching={dialogUsersQuery.isFetching}
                        itemLabel="managers"
                        onPageChange={setUserPageIndex}
                        pagination={usersPagination}
                      />
                    </Box>
                  </Stack>
                </Box>
              </Stack>
            </Dialog.Body>

            <Dialog.Footer>
              <Button
                disabled={isAssigning}
                onClick={() => handleOpenChange({ open: false })}
                variant="outline"
              >
                Cancelar
              </Button>
              <Button
                colorPalette="brand"
                disabled={
                  !selectedEvent ||
                  selectedManagers.length === 0 ||
                  isAssigning
                }
                loading={isAssigning}
                onClick={() => void handleAssignSelected()}
              >
                <UserPlus /> Asignar {selectedManagers.length}{" "}
                {selectedManagers.length === 1 ? "manager" : "managers"} y
                cerrar
              </Button>
            </Dialog.Footer>

            <Dialog.CloseTrigger disabled={isAssigning} />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
