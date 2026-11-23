import {
  Box,
  Button,
  Checkbox,
  Dialog,
  Field,
  Flex,
  Portal,
  Stack,
  Steps,
  Text,
} from "@chakra-ui/react";
import { ArrowLeft, ArrowRight, Check, UserPlus } from "lucide-react";
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
  EVENT_MANAGER_ASSIGNMENTS_PAGE_SIZE,
  EVENT_PICKER_PAGE_SIZE,
  MANAGER_PICKER_PAGE_SIZE,
} from "../../../constants/pagination";
import { MANAGER_ROLE_ID } from "../../../constants/roles";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import {
  useCreateEventManagersBatch,
  useGetEventManagersByEventId,
} from "../../../queries/eventManager.queries";
import { getErrorMessage } from "../../../utils/error";
import { formatDate } from "../../../utils/date";
import { SearchInput } from "../../../components/ui/SearchInput";
import { useEventsQuery } from "../../../queries/events.queries";
import { useGetUsers } from "../../../queries/users.queries";

const STEPS = [
  { title: "Evento", description: "Elige el evento a administrar" },
  { title: "Event managers", description: "Selecciona los managers" },
];

interface AssignManagersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssignManagersDialog({
  open,
  onOpenChange,
}: AssignManagersDialogProps) {
  const [step, setStep] = useState(0);
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

  const isManagerStep = open && step === 1 && selectedEvent !== null;

  const eventsQuery = useEventsQuery(
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
    isManagerStep,
  );
  const dialogUsers = dialogUsersQuery.data?.data ?? [];
  const usersPagination = dialogUsersQuery.data?.pagination;

  const eventAssignmentsQuery = useGetEventManagersByEventId(
    selectedEvent?.id ?? 0,
    { page:1, size: EVENT_MANAGER_ASSIGNMENTS_PAGE_SIZE },
    isManagerStep,
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
    setStep(0);
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

  const handleStepChange = (details: { step: number }) => {
    if (details.step === step || isAssigning) {
      return;
    }

    if (details.step > step && !selectedEvent) {
      toaster.create({
        title: "Selecciona un evento",
        description: "Elige un evento para continuar con la asignación.",
        type: "warning",
      });
      return;
    }

    setStep(details.step);
  };

  const handleNext = () => {
    if (!selectedEvent) {
      return;
    }

    setStep(1);
  };

  const handleBack = () => {
    setStep(0);
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
          `No se pudieron asignar: ${failedDetails}${remainingFailures > 0 ? `; y ${remainingFailures} más` : ""
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
                <Check /> Seleccionado
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
      key: "select",
      header: "Seleccionar",
      align: "end",
      render: (user) => (
        <Checkbox.Root
          aria-label={`Seleccionar a ${user.name}`}
          checked={selectedManagers.some(
            (selected) => selected.id === user.id,
          )}
          colorPalette="brand"
          disabled={
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
            <Dialog.Header display="flex" flexDirection="row" gap="1">
              <Dialog.Title>
                Asignar Event Managers{selectedEvent ? " a" : ""}
              </Dialog.Title>
              {selectedEvent && (
                <Dialog.Title color="brand.fg">
                  {selectedEvent.name}
                </Dialog.Title>
              )}
            </Dialog.Header>

            <Dialog.Body>
              <Stack gap="5">

                <Steps.Root
                  colorPalette="brand"
                  count={STEPS.length}
                  linear={false}
                  onStepChange={handleStepChange}
                  step={step}
                >
                  <Steps.List mb="6">
                    {STEPS.map((item, index) => (
                      <Steps.Item
                        key={item.title}
                        index={index}
                        title={item.title}
                      >
                        <Steps.Indicator>
                          <Steps.Status
                            complete={<Check />}
                            incomplete={<Steps.Number />}
                          />
                        </Steps.Indicator>
                        <Box>
                          <Steps.Title>{item.title}</Steps.Title>
                          <Steps.Description>
                            {item.description}
                          </Steps.Description>
                        </Box>
                        <Steps.Separator />
                      </Steps.Item>
                    ))}
                  </Steps.List>

                  <Steps.Content index={0}>
                    <Stack gap="4">
                      <Field.Root>
                        <Field.Label>Buscar evento</Field.Label>
                        <SearchInput
                          onSearchChange={handleEventSearchChange}
                          placeholder="Buscar por nombre"
                        />
                      </Field.Root>

                      <Box
                        bg="bg.panel"
                        borderColor="border"
                        borderRadius="xl"
                        borderWidth="1px"
                        overflow="hidden"
                      >
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
                    </Stack>
                  </Steps.Content>

                  <Steps.Content index={1}>
                    <Stack gap="4">

                      <Field.Root>
                        <Field.Label>Buscar manager</Field.Label>
                        <SearchInput
                          onSearchChange={handleUserSearchChange}
                          placeholder="Buscar manager por nombre"
                        />
                      </Field.Root>
                        

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
                          isRowDisabled={(user) =>
                            assignedManagerIds.has(user.id)
                          }
                          isRowHighlighted={(user) =>
                            assignedManagerIds.has(user.id)
                          }
                          isLoading={dialogUsersQuery.isPending}
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

                      <Flex
                        align="center"
                        bg="bg.panel"
                        borderColor="border"
                        borderRadius="lg"
                        borderWidth="1px"
                        gap="3"
                        px="3"
                        py="2"
                      >
                        <Box
                          bg="accent.subtle"
                          borderColor="accent.muted"
                          borderRadius="sm"
                          borderWidth="1px"
                          boxSize="5"
                          flexShrink={0}
                        />
                        <Text color="fg.muted" fontSize="sm">
                          Los managers resaltados ya están asignados a este
                          evento.
                        </Text>
                      </Flex>
                    </Stack>
                  </Steps.Content>
                </Steps.Root>
              </Stack>
            </Dialog.Body>

            <Dialog.Footer>
              <Flex align="center" gap="2" justify="space-between" w="100%">
                <Flex gap="2">
                  {step > 0 && (
                    <Button
                      disabled={isAssigning}
                      onClick={handleBack}
                      variant="outline"
                    >
                      <ArrowLeft /> Anterior
                    </Button>
                  )}
                  <Button
                    disabled={isAssigning}
                    onClick={() => handleOpenChange({ open: false })}
                    variant="outline"
                  >
                    Cancelar
                  </Button>
                </Flex>

                {step === 0 ? (
                  <Button
                    colorPalette="brand"
                    disabled={!selectedEvent || isAssigning}
                    onClick={handleNext}
                  >
                    Siguiente <ArrowRight />
                  </Button>
                ) : (
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
                )}
              </Flex>
            </Dialog.Footer>

            <Dialog.CloseTrigger disabled={isAssigning} />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
