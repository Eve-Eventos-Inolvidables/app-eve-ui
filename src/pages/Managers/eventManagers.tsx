import {
  Badge,
  Box,
  Button,
  Checkbox,
  Dialog,
  Field,
  Flex,
  Heading,
  Input,
  Portal,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import { useQueries } from "@tanstack/react-query";
import { Check, Eye, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { getEventById } from "../../api/events.api";
import { toaster } from "../../components/ui/chakra-base/toaster-instance";
import { MANAGER_ROLE_ID } from "../../constants/roles";
import {
  useCreateEventManager,
  useGetEventManagersByEventId,
  useGetEventManagersByManagerId,
} from "../../queries/eventManager.queries";
import { eventKeys, useGetEvents } from "../../queries/events.queries";
import { useGetUsers } from "../../queries/users.queries";
import type { UserDto } from "../../types/auth.types";
import type { SimpleEventDto } from "../../types/event.types";
import { getErrorMessage } from "../../utils/error";

const USER_PAGE_SIZE = 8;
const EVENT_PAGE_SIZE = 6;
const MANAGER_TABLE_PAGE_SIZE = 5;

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function formatDate(value: string): string {
  return dateFormatter.format(new Date(value));
}

export default function EventManagers() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [eventSearch, setEventSearch] = useState("");
  const [debouncedEventSearch, setDebouncedEventSearch] = useState("");
  const [eventPageIndex, setEventPageIndex] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<SimpleEventDto | null>(
    null,
  );
  const [userSearch, setUserSearch] = useState("");
  const [debouncedUserSearch, setDebouncedUserSearch] = useState("");
  const [userPageIndex, setUserPageIndex] = useState(0);
  const [selectedManagers, setSelectedManagers] = useState<UserDto[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [managerDetails, setManagerDetails] = useState<UserDto | null>(null);
  const [managerTablePageIndex, setManagerTablePageIndex] = useState(0);

  const eventsQuery = useGetEvents(
    {
      page: eventPageIndex,
      size: EVENT_PAGE_SIZE,
      name: debouncedEventSearch || undefined,
    },
    isDialogOpen,
  );

  const events = eventsQuery.data?.data ?? [];
  const eventsPagination = eventsQuery.data?.pagination;
  const eventsTotalPages = eventsPagination?.totalPages ?? 0;
  const currentEventsPage =
    eventsTotalPages > 0 ? Math.min(eventPageIndex + 1, eventsTotalPages) : 1;

  const managersQuery = useGetUsers({
    roleId: MANAGER_ROLE_ID,
    page: managerTablePageIndex,
    size: MANAGER_TABLE_PAGE_SIZE,
  });
  const managers = managersQuery.data?.data ?? [];
  const managersPagination = managersQuery.data?.pagination;
  const managerTableTotalPages = managersPagination?.totalPages ?? 0;
  const managersTotalItems = managersPagination?.totalItems ?? 0;
  const currentManagerTablePage =
    managerTableTotalPages > 0
      ? Math.min(managerTablePageIndex + 1, managerTableTotalPages)
      : 1;

  const dialogUsersQuery = useGetUsers(
    {
      roleId: MANAGER_ROLE_ID,
      page: userPageIndex,
      size: USER_PAGE_SIZE,
      name: debouncedUserSearch || undefined,
    },
    isDialogOpen,
  );
  const dialogUsers = dialogUsersQuery.data?.data ?? [];
  const usersPagination = dialogUsersQuery.data?.pagination;
  const usersTotalPages = usersPagination?.totalPages ?? 0;
  const usersTotalItems = usersPagination?.totalItems ?? 0;
  const currentUsersPage =
    usersTotalPages > 0 ? Math.min(userPageIndex + 1, usersTotalPages) : 1;

  const managerAssignmentsQuery = useGetEventManagersByManagerId(
    managerDetails?.id ?? 0,
  );
  const assignments = managerAssignmentsQuery.data?.data ?? [];
  const managerAssignmentsHasError =
    managerAssignmentsQuery.isError ||
    managerAssignmentsQuery.data?.success === false;
  const managerAssignmentsErrorMessage =
    managerAssignmentsHasError
      ? getErrorMessage(
          managerAssignmentsQuery.error,
          managerAssignmentsQuery.data?.message ??
            "No se pudieron cargar las asignaciones.",
        )
      : null;

  const assignmentEventsQueries = useQueries({
    queries: assignments.map((assignment) => ({
      queryKey: eventKeys.detail(assignment.eventId),
      queryFn: () => getEventById(assignment.eventId),
      enabled: Boolean(managerDetails),
    })),
  });
  const eventsById = new Map<number, SimpleEventDto>();
  assignmentEventsQueries.forEach((query) => {
    const event = query.data?.data;
    if (event) eventsById.set(event.id, event);
  });
  const eventsLookupIsPending = assignmentEventsQueries.some(
    (query) => query.isPending,
  );
  const eventsLookupIsFetching = assignmentEventsQueries.some(
    (query) => query.isFetching,
  );
  const eventsLookupHasError = assignmentEventsQueries.some(
    (query) => query.isError || query.data?.success === false,
  );
  const retryEventLookup = () => {
    assignmentEventsQueries.forEach((query) => {
      if (query.isError || query.data?.success === false) {
        query.refetch();
      }
    });
  };

  const eventAssignmentsQuery = useGetEventManagersByEventId(
    selectedEvent?.id ?? 0,
  );
  const assignedManagerIds = new Set(
    (eventAssignmentsQuery.data?.data ?? []).map(
      (assignment) => assignment.managerId,
    ),
  );

  const createMutation = useCreateEventManager();

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedEventSearch(eventSearch.trim());
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [eventSearch]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedUserSearch(userSearch.trim());
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [userSearch]);

  const handleDialogOpenChange = (details: { open: boolean }) => {
    if (!details.open && isAssigning) return;

    setIsDialogOpen(details.open);

    if (!details.open) {
      setEventSearch("");
      setDebouncedEventSearch("");
      setEventPageIndex(0);
      setSelectedEvent(null);
      setUserSearch("");
      setDebouncedUserSearch("");
      setUserPageIndex(0);
      setSelectedManagers([]);
      setIsAssigning(false);
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

  const handleManagerToggle = (manager: UserDto, checked: boolean) => {
    if (checked && assignedManagerIds.has(manager.id)) return;

    setSelectedManagers((current) =>
      checked
        ? current.some((selected) => selected.id === manager.id)
          ? current
          : [...current, manager]
        : current.filter((selected) => selected.id !== manager.id),
    );
  };

  const handleAssignSelected = async () => {
    if (!selectedEvent || selectedManagers.length === 0 || isAssigning) return;

    const event = selectedEvent;
    const managersToAssign = selectedManagers.filter(
      (manager) => !assignedManagerIds.has(manager.id),
    );

    if (managersToAssign.length === 0) {
      handleDialogOpenChange({ open: false });
      return;
    }

    const succeeded: UserDto[] = [];
    const failed: { manager: UserDto; message: string }[] = [];

    setIsAssigning(true);

    for (const manager of managersToAssign) {
      try {
        const response = await createMutation.mutateAsync({
          managerId: manager.id,
          eventId: event.id,
        });

        if (!response.success) {
          throw new Error(
            response.message || "No se pudo asignar el manager.",
          );
        }

        succeeded.push(manager);
      } catch (mutationError) {
        failed.push({
          manager,
          message: getErrorMessage(
            mutationError,
            "No se pudo asignar el manager.",
          ),
        });
      }
    }

    setIsAssigning(false);
    handleDialogOpenChange({ open: false });

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
        `No se pudieron asignar: ${failedDetails}${remainingFailures > 0 ? `; y ${remainingFailures} más` : ""}.`,
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
  };

  return (
    <Stack gap="8">
      <Flex
        align={{ base: "flex-start", md: "center" }}
        direction={{ base: "column", md: "row" }}
        gap="4"
        justify="space-between"
      >
        <Box>
          <Heading color="fg" size="2xl">
            Event Managers
          </Heading>
          <Text color="fg.muted" mt="2">
            Consulta managers y eventos asignados, o asigna managers a eventos.
          </Text>
        </Box>

        <Button
          colorPalette="brand"
          onClick={() => setIsDialogOpen(true)}
        >
          <UserPlus /> Asignar event managers
        </Button>
      </Flex>

      <Box
        bg="bg.panel"
        borderColor="border"
        borderRadius="xl"
        borderWidth="1px"
        overflow="hidden"
      >
        <Table.ScrollArea>
          <Table.Root size="md" variant="line">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Nombre</Table.ColumnHeader>
                <Table.ColumnHeader>Email</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">Acciones</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {managersQuery.isPending ? (
                <Table.Row>
                  <Table.Cell colSpan={3} color="fg.muted" textAlign="center">
                    Cargando managers...
                  </Table.Cell>
                </Table.Row>
              ) : managersQuery.isError ? (
                <Table.Row>
                  <Table.Cell colSpan={3} color="fg.muted" textAlign="center">
                    {getErrorMessage(
                      managersQuery.error,
                      "No se pudieron cargar los usuarios.",
                    )}
                  </Table.Cell>
                </Table.Row>
              ) : managers.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={3} color="fg.muted" textAlign="center">
                    No hay usuarios con rol Manager.
                  </Table.Cell>
                </Table.Row>
              ) : (
                managers.map((manager) => (
                  <Table.Row key={manager.id}>
                    <Table.Cell fontWeight="medium">{manager.name}</Table.Cell>
                    <Table.Cell color="fg.muted">{manager.email}</Table.Cell>
                    <Table.Cell textAlign="end">
                      <Button
                        aria-label={`Ver eventos asignados a ${manager.name}`}
                        onClick={() => setManagerDetails(manager)}
                        size="sm"
                        variant="outline"
                      >
                        <Eye /> Detalles
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table.Root>
        </Table.ScrollArea>

        {!managersQuery.isPending &&
          !managersQuery.isError &&
          managers.length > 0 && (
            <Flex
              align="center"
              borderTopColor="border"
              borderTopWidth="1px"
              gap="3"
              justify="space-between"
              px="4"
              py="3"
            >
              <Text color="fg.muted" fontSize="sm">
                Página {currentManagerTablePage} de{" "}
                {Math.max(managerTableTotalPages, 1)} · {managersTotalItems}{" "}
                managers
              </Text>
              <Flex gap="2">
                <Button
                  disabled={
                    managerTablePageIndex <= 0 || managersQuery.isFetching
                  }
                  onClick={() =>
                    setManagerTablePageIndex((current) =>
                      Math.max(current - 1, 0),
                    )
                  }
                  size="sm"
                  variant="outline"
                >
                  Anterior
                </Button>
                <Button
                  disabled={
                    managersQuery.isFetching ||
                    currentManagerTablePage >= managerTableTotalPages
                  }
                  onClick={() =>
                    setManagerTablePageIndex((current) => current + 1)
                  }
                  size="sm"
                  variant="outline"
                >
                  Siguiente
                </Button>
              </Flex>
            </Flex>
          )}
      </Box>

      <Dialog.Root
        onOpenChange={({ open }) => {
          if (!open) setManagerDetails(null);
        }}
        open={Boolean(managerDetails)}
        size="lg"
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content maxH="85vh" overflowY="auto">
              <Dialog.Header>
                <Dialog.Title>
                  Eventos asignados a {managerDetails?.name}
                </Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Stack gap="4">
                  <Text color="fg.muted">{managerDetails?.email}</Text>
                  <Box
                    borderColor="border"
                    borderRadius="lg"
                    borderWidth="1px"
                    overflow="hidden"
                  >
                    <Table.ScrollArea>
                      <Table.Root size="sm" variant="line">
                        <Table.Header>
                          <Table.Row>
                            <Table.ColumnHeader>Evento</Table.ColumnHeader>
                            <Table.ColumnHeader>Fecha del evento</Table.ColumnHeader>
                            <Table.ColumnHeader>Fecha de asignación</Table.ColumnHeader>
                          </Table.Row>
                        </Table.Header>
                        <Table.Body>
                          {managerAssignmentsQuery.isPending ? (
                            <Table.Row>
                              <Table.Cell
                                colSpan={3}
                                color="fg.muted"
                                textAlign="center"
                              >
                                Cargando eventos asignados...
                              </Table.Cell>
                            </Table.Row>
                          ) : managerAssignmentsHasError ? (
                            <Table.Row>
                              <Table.Cell
                                colSpan={3}
                                color="fg.muted"
                                textAlign="center"
                              >
                                {managerAssignmentsErrorMessage}
                              </Table.Cell>
                            </Table.Row>
                          ) : assignments.length === 0 ? (
                            <Table.Row>
                              <Table.Cell
                                colSpan={3}
                                color="fg.muted"
                                textAlign="center"
                              >
                                Este manager todavía no tiene eventos asignados.
                              </Table.Cell>
                            </Table.Row>
                          ) : eventsLookupIsPending ? (
                            <Table.Row>
                              <Table.Cell
                                colSpan={3}
                                color="fg.muted"
                                textAlign="center"
                              >
                                Cargando eventos asignados...
                              </Table.Cell>
                            </Table.Row>
                          ) : eventsLookupHasError ? (
                            <Table.Row>
                              <Table.Cell colSpan={3} textAlign="center">
                                <Stack align="center" gap="3">
                                  <Text color="fg.muted">
                                    Los eventos no están disponibles en este
                                    momento.
                                  </Text>
                                  <Button
                                    loading={eventsLookupIsFetching}
                                    onClick={retryEventLookup}
                                    size="sm"
                                    variant="outline"
                                  >
                                    Reintentar
                                  </Button>
                                </Stack>
                              </Table.Cell>
                            </Table.Row>
                          ) : (
                            assignments.map((assignment) => {
                              const event = eventsById.get(assignment.eventId);

                              return (
                                <Table.Row key={assignment.id}>
                                  <Table.Cell fontWeight="medium">
                                    {event?.name ?? "Evento no disponible"}
                                  </Table.Cell>
                                  <Table.Cell color="fg.muted">
                                    {event ? formatDate(event.date) : "-"}
                                  </Table.Cell>
                                  <Table.Cell color="fg.muted">
                                    {formatDate(assignment.assignedAt)}
                                  </Table.Cell>
                                </Table.Row>
                              );
                            })
                          )}
                        </Table.Body>
                      </Table.Root>
                    </Table.ScrollArea>
                  </Box>
                </Stack>
              </Dialog.Body>
              <Dialog.Footer>
                <Button
                  onClick={() => setManagerDetails(null)}
                  variant="outline"
                >
                  Cerrar
                </Button>
              </Dialog.Footer>
              <Dialog.CloseTrigger />
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      <Dialog.Root
        onOpenChange={handleDialogOpenChange}
        open={isDialogOpen}
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
                        <Text fontWeight="semibold">1. Selecciona un evento</Text>
                        <Text color="fg.muted" fontSize="sm">
                          Busca por nombre y elige el evento a administrar. Puedes
                          volver a pulsar el evento seleccionado para quitar la
                          selección.
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

                    <Table.ScrollArea maxH="xs">
                      <Table.Root size="sm" variant="line">
                        <Table.Header>
                          <Table.Row>
                            <Table.ColumnHeader>Nombre</Table.ColumnHeader>
                            <Table.ColumnHeader>Fecha</Table.ColumnHeader>
                            <Table.ColumnHeader>Hora</Table.ColumnHeader>
                            <Table.ColumnHeader textAlign="end">
                              Acción
                            </Table.ColumnHeader>
                          </Table.Row>
                        </Table.Header>
                        <Table.Body>
                          {eventsQuery.isPending ? (
                            <Table.Row>
                              <Table.Cell
                                colSpan={4}
                                color="fg.muted"
                                textAlign="center"
                              >
                                Cargando eventos...
                              </Table.Cell>
                            </Table.Row>
                          ) : eventsQuery.isError ? (
                            <Table.Row>
                              <Table.Cell
                                colSpan={4}
                                color="fg.muted"
                                textAlign="center"
                              >
                                {getErrorMessage(
                                  eventsQuery.error,
                                  "No se pudieron cargar los eventos.",
                                )}
                              </Table.Cell>
                            </Table.Row>
                          ) : events.length === 0 ? (
                            <Table.Row>
                              <Table.Cell
                                colSpan={4}
                                color="fg.muted"
                                textAlign="center"
                              >
                                No se encontraron eventos.
                              </Table.Cell>
                            </Table.Row>
                          ) : (
                            events.map((event) => {
                              const isSelected = selectedEvent?.id === event.id;

                              return (
                                <Table.Row key={event.id}>
                                  <Table.Cell fontWeight="medium">
                                    {event.name}
                                  </Table.Cell>
                                  <Table.Cell color="fg.muted">
                                    {formatDate(event.date)}
                                  </Table.Cell>
                                  <Table.Cell color="fg.muted">
                                    {event.kickOffTime}
                                  </Table.Cell>
                                  <Table.Cell textAlign="end">
                                    <Button
                                      colorPalette="brand"
                                      onClick={() => {
                                        setSelectedEvent(
                                          isSelected ? null : event,
                                        );
                                        setSelectedManagers([]);
                                      }}
                                      size="xs"
                                      variant={
                                        isSelected ? "solid" : "outline"
                                      }
                                    >
                                      {isSelected ? (
                                        <>
                                          <Check /> Quitar selección
                                        </>
                                      ) : (
                                        "Seleccionar"
                                      )}
                                    </Button>
                                  </Table.Cell>
                                </Table.Row>
                              );
                            })
                          )}
                        </Table.Body>
                      </Table.Root>
                    </Table.ScrollArea>

                    {!eventsQuery.isPending &&
                      !eventsQuery.isError &&
                      events.length > 0 && (
                        <Flex
                          align="center"
                          borderTopColor="border"
                          borderTopWidth="1px"
                          gap="3"
                          justify="space-between"
                          px="4"
                          py="3"
                        >
                          <Text color="fg.muted" fontSize="sm">
                            Página {currentEventsPage} de{" "}
                            {Math.max(eventsTotalPages, 1)} ·{" "}
                            {eventsPagination?.totalItems ?? events.length}{" "}
                            eventos
                          </Text>
                          <Flex gap="2">
                            <Button
                              disabled={
                                eventPageIndex <= 0 || eventsQuery.isFetching
                              }
                              onClick={() =>
                                setEventPageIndex((current) =>
                                  Math.max(current - 1, 0),
                                )
                              }
                              size="xs"
                              variant="outline"
                            >
                              Anterior
                            </Button>
                            <Button
                              disabled={
                                eventsQuery.isFetching ||
                                currentEventsPage >= eventsTotalPages
                              }
                              onClick={() =>
                                setEventPageIndex((current) => current + 1)
                              }
                              size="xs"
                              variant="outline"
                            >
                              Siguiente
                            </Button>
                          </Flex>
                        </Flex>
                      )}
                  </Box>

                  {selectedEvent && (
                    <Box
                      bg="bg.panel"
                      borderColor="border"
                      borderRadius="xl"
                      borderWidth="1px"
                      p="4"
                    >
                      <Flex
                        align="center"
                        gap="3"
                        justify="space-between"
                      >
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
                        <Table.ScrollArea maxH="sm">
                          <Table.Root size="sm" variant="line">
                            <Table.Header>
                              <Table.Row>
                                <Table.ColumnHeader>Nombre</Table.ColumnHeader>
                                <Table.ColumnHeader>Email</Table.ColumnHeader>
                                <Table.ColumnHeader>Rol</Table.ColumnHeader>
                                  <Table.ColumnHeader textAlign="end">
                                    Seleccionar
                                  </Table.ColumnHeader>
                              </Table.Row>
                            </Table.Header>
                            <Table.Body>
                              {dialogUsersQuery.isPending ? (
                                <Table.Row>
                                  <Table.Cell
                                    colSpan={4}
                                    color="fg.muted"
                                    textAlign="center"
                                  >
                                    Cargando managers...
                                  </Table.Cell>
                                </Table.Row>
                              ) : dialogUsersQuery.isError ? (
                                <Table.Row>
                                  <Table.Cell
                                    colSpan={4}
                                    color="fg.muted"
                                    textAlign="center"
                                  >
                                    {getErrorMessage(
                                      dialogUsersQuery.error,
                                      "No se pudieron cargar los usuarios.",
                                    )}
                                  </Table.Cell>
                                </Table.Row>
                              ) : dialogUsers.length === 0 ? (
                                <Table.Row>
                                  <Table.Cell
                                    colSpan={4}
                                    color="fg.muted"
                                    textAlign="center"
                                  >
                                    No se encontraron managers.
                                  </Table.Cell>
                                </Table.Row>
                              ) : (
                                dialogUsers.map((user) => {
                                  const isAlreadyAssigned =
                                    assignedManagerIds.has(user.id);

                                  return (
                                    <Table.Row
                                      key={user.id}
                                      opacity={isAlreadyAssigned ? 0.5 : 1}
                                    >
                                      <Table.Cell fontWeight="medium">
                                        {user.name}
                                      </Table.Cell>
                                      <Table.Cell color="fg.muted">
                                        {user.email}
                                      </Table.Cell>
                                      <Table.Cell>
                                        <Badge
                                          colorPalette="brand"
                                          variant="subtle"
                                        >
                                          {user.roleName || "Sin rol"}
                                        </Badge>
                                      </Table.Cell>
                                      <Table.Cell textAlign="end">
                                        <Checkbox.Root
                                          aria-label={`Seleccionar a ${user.name}`}
                                          checked={selectedManagers.some(
                                            (selected) =>
                                              selected.id === user.id,
                                          )}
                                          disabled={
                                            !selectedEvent ||
                                            isAssigning ||
                                            isAlreadyAssigned ||
                                            eventAssignmentsQuery.isPending
                                          }
                                          onCheckedChange={(details) =>
                                            handleManagerToggle(
                                              user,
                                              details.checked === true,
                                            )
                                          }
                                        >
                                          <Checkbox.HiddenInput />
                                          <Checkbox.Control>
                                            <Checkbox.Indicator />
                                          </Checkbox.Control>
                                        </Checkbox.Root>
                                      </Table.Cell>
                                    </Table.Row>
                                  );
                                })
                              )}
                            </Table.Body>
                          </Table.Root>
                        </Table.ScrollArea>

                        {!dialogUsersQuery.isPending &&
                          !dialogUsersQuery.isError &&
                          dialogUsers.length > 0 && (
                            <Flex
                              align="center"
                              borderTopColor="border"
                              borderTopWidth="1px"
                              gap="3"
                              justify="space-between"
                              px="4"
                              py="3"
                            >
                              <Text color="fg.muted" fontSize="sm">
                                Página {currentUsersPage} de{" "}
                                {Math.max(usersTotalPages, 1)} ·{" "}
                                {usersTotalItems} managers
                              </Text>
                              <Flex gap="2">
                                <Button
                                  disabled={
                                    userPageIndex <= 0 ||
                                    isAssigning ||
                                    dialogUsersQuery.isFetching
                                  }
                                  onClick={() =>
                                    setUserPageIndex((current) =>
                                      Math.max(current - 1, 0),
                                    )
                                  }
                                  size="xs"
                                  variant="outline"
                                >
                                  Anterior
                                </Button>
                                <Button
                                  disabled={
                                    isAssigning ||
                                    dialogUsersQuery.isFetching ||
                                    currentUsersPage >= usersTotalPages
                                  }
                                  onClick={() =>
                                    setUserPageIndex((current) => current + 1)
                                  }
                                  size="xs"
                                  variant="outline"
                                >
                                  Siguiente
                                </Button>
                              </Flex>
                            </Flex>
                          )}
                      </Box>
                    </Stack>
                  </Box>
                </Stack>
              </Dialog.Body>

              <Dialog.Footer>
                <Button
                  disabled={isAssigning}
                  onClick={() => handleDialogOpenChange({ open: false })}
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
                  onClick={handleAssignSelected}
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
    </Stack>
  );
}
