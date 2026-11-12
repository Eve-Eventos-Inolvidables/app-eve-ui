import {
  Box,
  Button,
  Flex,
  Heading,
  Stack,
  Text,
} from "@chakra-ui/react";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { MANAGER_PAGE_SIZE } from "../../constants/pagination";
import { MANAGER_ROLE_ID } from "../../constants/roles";
import { useGetEventManagersByManagerId } from "../../queries/eventManager.queries";
import { useGetUsers } from "../../queries/users.queries";
import type { UserDto } from "../../types/auth.types";
import { getErrorMessage } from "../../utils/error";
import { AssignManagersDialog } from "./components/AssignManagersDialog";
import { ManagerDetailsDialog } from "./components/ManagerDetailsDialog";
import { ManagersTable } from "./components/ManagersTable";
import { useAssignmentEvents } from "./hooks/useAssignmentEvents";

export default function EventManagers() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [managerDetails, setManagerDetails] = useState<UserDto | null>(null);
  const [managerTablePageIndex, setManagerTablePageIndex] = useState(1);

  const managersQuery = useGetUsers({
    roleId: MANAGER_ROLE_ID,
    page: managerTablePageIndex,
    size: MANAGER_PAGE_SIZE,
  });
  const managers = managersQuery.data?.data ?? [];
  const managersPagination = managersQuery.data?.pagination;
  const managersHasError =
    managersQuery.isError || managersQuery.data?.success === false;
  const managersErrorMessage = managersHasError
    ? getErrorMessage(
        managersQuery.error,
        managersQuery.data?.message ??
          "No se pudieron cargar los usuarios.",
      )
    : undefined;

  const managerAssignmentsQuery = useGetEventManagersByManagerId(
    managerDetails?.id ?? 0,
  );
  const assignments = managerAssignmentsQuery.data?.data ?? [];
  const assignmentEvents = useAssignmentEvents(
    assignments,
    Boolean(managerDetails),
  );
  const assignmentsHasError =
    managerAssignmentsQuery.isError ||
    managerAssignmentsQuery.data?.success === false;
  const assignmentsErrorMessage = assignmentsHasError
    ? getErrorMessage(
        managerAssignmentsQuery.error,
        managerAssignmentsQuery.data?.message ??
          "No se pudieron cargar las asignaciones.",
      )
    : undefined;
  const eventsErrorMessage = assignmentEvents.hasError
    ? "Los eventos no están disponibles en este momento."
    : undefined;

  const handleRetryAssignments = () => {
    if (assignmentsHasError) {
      void managerAssignmentsQuery.refetch();
    }

    assignmentEvents.retry();
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

      <ManagersTable
        errorMessage={managersErrorMessage}
        isFetching={managersQuery.isFetching}
        isLoading={managersQuery.isPending}
        managers={managers}
        onPageChange={setManagerTablePageIndex}
        onRetry={() => void managersQuery.refetch()}
        onViewDetails={setManagerDetails}
        pageIndex={managerTablePageIndex}
        pagination={managersPagination}
      />

      <ManagerDetailsDialog
        assignments={assignments}
        assignmentsErrorMessage={assignmentsErrorMessage}
        assignmentsLoading={managerAssignmentsQuery.isPending}
        eventsById={assignmentEvents.eventsById}
        eventsErrorMessage={eventsErrorMessage}
        eventsLoading={assignmentEvents.isLoading}
        manager={managerDetails}
        onClose={() => setManagerDetails(null)}
        onRetry={handleRetryAssignments}
      />

      <AssignManagersDialog
        onOpenChange={setIsDialogOpen}
        open={isDialogOpen}
      />
    </Stack>
  );
}
