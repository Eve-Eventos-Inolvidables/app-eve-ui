import {
  Badge,
  Box,
  Button,
  Dialog,
  Field,
  Flex,
  Heading,
  IconButton,
  Input,
  Portal,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import { Check, UserMinus, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { toaster } from "../../components/ui/chakra-base/toaster-instance";
import {
  useCreateEventManagerMutation,
  useDeleteEventManagerMutation,
  useEventManagersWithUsersQuery,
  type EventManagerRowData,
} from "../../queries/eventManager.queries";
import { useEventsQuery } from "../../queries/events.queries";
import { useUsersQuery } from "../../queries/users.queries";
import type { UserDto } from "../../types/auth.types";
import type { SimpleEventDto } from "../../types/event.types";
import { getErrorMessage } from "../../utils/error";

const PAGE_SIZE = 10;
const USER_PAGE_SIZE = 8;
const EVENT_PAGE_SIZE = 6;

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
  const [pageIndex, setPageIndex] = useState(0);
  const [eventSearch, setEventSearch] = useState("");
  const [debouncedEventSearch, setDebouncedEventSearch] = useState("");
  const [eventPageIndex, setEventPageIndex] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<SimpleEventDto | null>(
    null,
  );
  const [userSearch, setUserSearch] = useState("");
  const [debouncedUserSearch, setDebouncedUserSearch] = useState("");
  const [userPageIndex, setUserPageIndex] = useState(0);

  const {
    data: eventManagersData,
    error,
    isError,
    isPending,
    isFetching,
  } = useEventManagersWithUsersQuery({ page: pageIndex, size: PAGE_SIZE });

  const rows = eventManagersData?.rows ?? [];
  const pagination = eventManagersData?.pagination;
  const totalPages = pagination?.totalPages ?? 0;
  const currentPage = totalPages > 0 ? Math.min(pageIndex + 1, totalPages) : 1;

  const eventsQuery = useEventsQuery(
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

  const usersQuery = useUsersQuery(
    {
      page: userPageIndex,
      size: USER_PAGE_SIZE,
      name: debouncedUserSearch || undefined,
    },
    isDialogOpen,
  );

  const users = usersQuery.data?.data ?? [];
  const usersPagination = usersQuery.data?.pagination;
  const usersTotalPages = usersPagination?.totalPages ?? 0;
  const currentUsersPage =
    usersTotalPages > 0 ? Math.min(userPageIndex + 1, usersTotalPages) : 1;

  const createMutation = useCreateEventManagerMutation();
  const deleteMutation = useDeleteEventManagerMutation();

  const pendingManagerId = createMutation.isPending
    ? createMutation.variables?.managerId
    : undefined;
  const deletingManagerId = deleteMutation.isPending
    ? deleteMutation.variables
    : undefined;

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
    setIsDialogOpen(details.open);

    if (!details.open) {
      setEventSearch("");
      setDebouncedEventSearch("");
      setEventPageIndex(0);
      setSelectedEvent(null);
      setUserSearch("");
      setDebouncedUserSearch("");
      setUserPageIndex(0);
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

  const handleAssign = (user: UserDto) => {
    if (!selectedEvent) {
      toaster.create({
        title: "Selecciona un evento",
        description: "Elige un evento antes de asignar el manager.",
        type: "warning",
      });
      return;
    }

    createMutation.mutate(
      { managerId: user.id, eventId: selectedEvent.id },
      {
        onSuccess: () => {
          toaster.create({
            title: "Manager asignado",
            description: `${user.name} fue asignado al evento ${selectedEvent.name}.`,
            type: "success",
          });
        },
        onError: (mutationError) => {
          toaster.create({
            title: "No se pudo asignar el manager",
            description: getErrorMessage(
              mutationError,
              "No se pudo asignar el manager.",
            ),
            type: "error",
          });
        },
      },
    );
  };

  const handleUnassign = (manager: EventManagerRowData) => {
    deleteMutation.mutate(manager.id, {
      onSuccess: () => {
        if (rows.length === 1 && pageIndex > 0) {
          setPageIndex((current) => Math.max(current - 1, 0));
        }

        toaster.create({
          title: "Manager desasignado",
          description: `${manager.name} fue desasignado del evento #${manager.eventId}.`,
          type: "success",
        });
      },
      onError: (mutationError) => {
        toaster.create({
          title: "No se pudo desasignar el manager",
          description: getErrorMessage(
            mutationError,
            "No se pudo desasignar el manager.",
          ),
          type: "error",
        });
      },
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
            Gestión de Event Managers
          </Heading>
          <Text color="fg.muted" mt="2">
            Administra los managers asignados a cada evento.
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
                <Table.ColumnHeader>Fecha de asignación</Table.ColumnHeader>
                <Table.ColumnHeader>Evento</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">Acciones</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {isPending ? (
                <Table.Row>
                  <Table.Cell colSpan={5} color="fg.muted" textAlign="center">
                    Cargando event managers...
                  </Table.Cell>
                </Table.Row>
              ) : isError ? (
                <Table.Row>
                  <Table.Cell colSpan={5} color="fg.muted" textAlign="center">
                    {getErrorMessage(
                      error,
                      "No se pudieron cargar los event managers.",
                    )}
                  </Table.Cell>
                </Table.Row>
              ) : rows.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={5} color="fg.muted" textAlign="center">
                    No hay event managers asignados.
                  </Table.Cell>
                </Table.Row>
              ) : (
                rows.map((manager) => (
                  <Table.Row key={manager.id}>
                    <Table.Cell fontWeight="medium">{manager.name}</Table.Cell>
                    <Table.Cell color="fg.muted">{manager.email}</Table.Cell>
                    <Table.Cell color="fg.muted">
                      {formatDate(manager.assignedAt)}
                    </Table.Cell>
                    <Table.Cell color="fg.muted">
                      #{manager.eventId}
                    </Table.Cell>
                    <Table.Cell textAlign="end">
                      <IconButton
                        aria-label={`Desasignar a ${manager.name} del evento`}
                        colorPalette="red"
                        loading={deletingManagerId === manager.id}
                        onClick={() => handleUnassign(manager)}
                        size="sm"
                        variant="ghost"
                      >
                        <UserMinus />
                      </IconButton>
                    </Table.Cell>
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table.Root>
        </Table.ScrollArea>

        {!isPending && !isError && rows.length > 0 && (
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
              Página {currentPage} de {Math.max(totalPages, 1)} ·{" "}
              {pagination?.totalItems ?? rows.length} asignaciones
            </Text>
            <Flex gap="2">
              <Button
                disabled={pageIndex <= 0 || isFetching}
                onClick={() => setPageIndex((current) => Math.max(current - 1, 0))}
                size="sm"
                variant="outline"
              >
                Anterior
              </Button>
              <Button
                disabled={isFetching || currentPage >= totalPages}
                onClick={() => setPageIndex((current) => current + 1)}
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
                          Busca por nombre y elige el evento a administrar.
                        </Text>
                      </Box>
                      <Field.Label>Buscar evento</Field.Label>
                      <Input
                        mt="2"
                        onChange={(event) =>
                          handleEventSearchChange(event.target.value)
                        }
                        placeholder="Buscar evento por nombre"
                        value={eventSearch}
                      />
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
                                      onClick={() => setSelectedEvent(event)}
                                      size="xs"
                                      variant={
                                        isSelected ? "solid" : "outline"
                                      }
                                    >
                                      {isSelected ? (
                                        <>
                                          <Check /> Seleccionado
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
                            #{selectedEvent.id} ·{" "}
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
                          Elige quién será manager del evento seleccionado.
                        </Text>
                        <Field.Label>Buscar usuario</Field.Label>
                        <Input
                          mt="2"
                          onChange={(event) =>
                            handleUserSearchChange(event.target.value)
                          }
                          placeholder="Buscar por nombre"
                          value={userSearch}
                        />
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
                                  Acción
                                </Table.ColumnHeader>
                              </Table.Row>
                            </Table.Header>
                            <Table.Body>
                              {usersQuery.isPending ? (
                                <Table.Row>
                                  <Table.Cell
                                    colSpan={4}
                                    color="fg.muted"
                                    textAlign="center"
                                  >
                                    Cargando usuarios...
                                  </Table.Cell>
                                </Table.Row>
                              ) : usersQuery.isError ? (
                                <Table.Row>
                                  <Table.Cell
                                    colSpan={4}
                                    color="fg.muted"
                                    textAlign="center"
                                  >
                                    {getErrorMessage(
                                      usersQuery.error,
                                      "No se pudieron cargar los usuarios.",
                                    )}
                                  </Table.Cell>
                                </Table.Row>
                              ) : users.length === 0 ? (
                                <Table.Row>
                                  <Table.Cell
                                    colSpan={4}
                                    color="fg.muted"
                                    textAlign="center"
                                  >
                                    No se encontraron usuarios.
                                  </Table.Cell>
                                </Table.Row>
                              ) : (
                                users.map((user) => (
                                  <Table.Row key={user.id}>
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
                                      <Button
                                        colorPalette="brand"
                                        disabled={
                                          !selectedEvent ||
                                          createMutation.isPending
                                        }
                                        loading={pendingManagerId === user.id}
                                        onClick={() => handleAssign(user)}
                                        size="xs"
                                        variant="subtle"
                                      >
                                        <UserPlus /> Asignar
                                      </Button>
                                    </Table.Cell>
                                  </Table.Row>
                                ))
                              )}
                            </Table.Body>
                          </Table.Root>
                        </Table.ScrollArea>

                        {!usersQuery.isPending &&
                          !usersQuery.isError &&
                          users.length > 0 && (
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
                                {usersPagination?.totalItems ?? users.length}{" "}
                                usuarios
                              </Text>
                              <Flex gap="2">
                                <Button
                                  disabled={
                                    userPageIndex <= 0 ||
                                    usersQuery.isFetching
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
                                    usersQuery.isFetching ||
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
                  onClick={() => setIsDialogOpen(false)}
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
    </Stack>
  );
}
