import {
  Badge,
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
import {
  useAssignManagersToEvent,
  useGetEventManagersByEventId,
} from "../../../queries/eventManager.queries";
import { useEventsQuery } from "../../../queries/events.queries";
import { useGetUsers } from "../../../queries/users.queries";
import { getErrorMessage } from "../../../utils/error";
import { formatDate } from "../../../utils/date";
import { SearchInput } from "../../../components/ui/SearchInput";

const STEPS = [
  { title: "Evento", description: "Elige el evento a administrar" },
  { title: "Event managers", description: "Selecciona los managers" },
  { title: "Resultado", description: "Resumen de la asignación" },
];
const RESULT_STEP = 2;

interface AssignmentSummaryRow {
  id: number;
  name: string;
  email: string;
  success: boolean;
  message: string;
}

interface AssignmentSummary {
  eventName: string;
  rows: AssignmentSummaryRow[];
  fatalMessage?: string;
}

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
  const [eventPageIndex, setEventPageIndex] = useState(1);
  const [selectedEvent, setSelectedEvent] = useState<SimpleEventDto | null>(
    null,
  );
  const [userSearch, setUserSearch] = useState("");
  const [userPageIndex, setUserPageIndex] = useState(1);
  const [selectedManagers, setSelectedManagers] = useState<UserDto[]>([]);
  const [summary, setSummary] = useState<AssignmentSummary | null>(null);
  // SearchInput keeps its own text, so it is remounted when the dialog resets.
  const [searchSession, setSearchSession] = useState(0);

  const isManagerStep = open && step === 1 && selectedEvent !== null;

  const eventsQuery = useEventsQuery(
    {
      page: eventPageIndex,
      size: EVENT_PICKER_PAGE_SIZE,
      name: eventSearch || undefined,
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
      name: userSearch || undefined,
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

  const assignMutation = useAssignManagersToEvent();
  const isAssigning = assignMutation.isPending;

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
    setSearchSession((current) => current + 1);
    setStep(0);
    setEventSearch("");
    setEventPageIndex(1);
    setSelectedEvent(null);
    setUserSearch("");
    setUserPageIndex(1);
    setSelectedManagers([]);
    setSummary(null);
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
    // The result step is only reachable by assigning; leaving it or jumping
    // to it from the steps header would show an empty or stale summary.
    if (
      details.step === step ||
      details.step === RESULT_STEP ||
      step === RESULT_STEP ||
      isAssigning
    ) {
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
    setEventPageIndex(1);
  };

  const handleUserSearchChange = (value: string) => {
    setUserSearch(value);
    setUserPageIndex(1);
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

    try {
      const results = await assignMutation.mutateAsync({
        eventId: event.id,
        managerIds: managersToAssign.map((manager) => manager.id),
      });
      const resultByManager = new Map(
        results.map((result) => [result.managerId, result]),
      );

      setSummary({
        eventName: event.name,
        rows: managersToAssign.map((manager) => {
          const result = resultByManager.get(manager.id);

          return {
            id: manager.id,
            name: manager.name,
            email: manager.email,
            success: result?.success ?? false,
            message: result?.message ?? "Sin resultado del servidor.",
          };
        }),
      });
    } catch (error) {
      setSummary({
        eventName: event.name,
        rows: [],
        fatalMessage: getErrorMessage(
          error,
          "No se pudo completar la asignación.",
        ),
      });
    }

    setStep(RESULT_STEP);
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

  const summaryColumns: DataTableColumn<AssignmentSummaryRow>[] = [
    {
      key: "manager",
      header: "Manager",
      render: (row) => (
        <Stack gap="0">
          <Text fontWeight="medium">{row.name}</Text>
          <Text color="fg.muted" fontSize="xs">
            {row.email}
          </Text>
        </Stack>
      ),
    },
    {
      key: "status",
      header: "Estado",
      render: (row) => (
        <Badge
          colorPalette={row.success ? "green" : "red"}
          variant="subtle"
        >
          {row.success ? "Asignado" : "No asignado"}
        </Badge>
      ),
    },
    {
      key: "message",
      header: "Mensaje",
      render: (row) => (
        <Text color="fg.muted" fontSize="sm">
          {row.message}
        </Text>
      ),
    },
  ];

  const summarySucceeded =
    summary?.rows.filter((row) => row.success).length ?? 0;

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
                          key={searchSession}
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
                          page={eventPageIndex}
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
                          key={searchSession}
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
                          page={userPageIndex}
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

                  <Steps.Content index={RESULT_STEP}>
                    {summary && summary.fatalMessage && (
                      <Box
                        bg="bg.panel"
                        borderColor="border"
                        borderRadius="xl"
                        borderWidth="1px"
                        p="6"
                        textAlign="center"
                      >
                        <Text color="fg.error">{summary.fatalMessage}</Text>
                      </Box>
                    )}

                    {summary && !summary.fatalMessage && (
                      <Stack gap="4">
                        <Text color="fg.muted" fontSize="sm">
                          {summarySucceeded} de {summary.rows.length} managers
                          asignados a {summary.eventName}.
                        </Text>

                        <Box
                          bg="bg.panel"
                          borderColor="border"
                          borderRadius="xl"
                          borderWidth="1px"
                          overflow="hidden"
                        >
                          <DataTable
                            bordered={false}
                            columns={summaryColumns}
                            maxHeight="sm"
                            rows={summary.rows}
                            size="sm"
                          />
                        </Box>
                      </Stack>
                    )}
                  </Steps.Content>
                </Steps.Root>
              </Stack>
            </Dialog.Body>

            <Dialog.Footer>
              {step === RESULT_STEP ? (
                <Flex justify="flex-end" w="100%">
                  <Button
                    colorPalette="brand"
                    onClick={() => handleOpenChange({ open: false })}
                  >
                    Cerrar
                  </Button>
                </Flex>
              ) : (
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
                      {selectedManagers.length === 1 ? "manager" : "managers"}
                    </Button>
                  )}
                </Flex>
              )}
            </Dialog.Footer>

            <Dialog.CloseTrigger disabled={isAssigning} />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
