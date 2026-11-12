import { Box, Button } from "@chakra-ui/react";
import { Eye } from "lucide-react";
import {
  DataTable,
  type DataTableColumn,
} from "../../../components/ui/DataTable";
import { EmptyState } from "../../../components/ui/EmptyState";
import { PaginationControl } from "../../../components/ui/PaginationControl";
import type { Pagination } from "../../../types/responses";
import type { UserDto } from "../../../types/auth.types";

interface ManagersTableProps {
  managers: UserDto[];
  isLoading: boolean;
  isFetching: boolean;
  errorMessage?: string;
  onRetry: () => void;
  pagination?: Pagination | null;
  pageIndex: number;
  onPageChange: (pageIndex: number) => void;
  onViewDetails: (manager: UserDto) => void;
}

export function ManagersTable({
  managers,
  isLoading,
  isFetching,
  errorMessage,
  onRetry,
  pagination,
  onPageChange,
  onViewDetails,
}: ManagersTableProps) {
  const columns: DataTableColumn<UserDto>[] = [
    {
      key: "name",
      header: "Nombre",
      accessor: (manager) => manager.name,
    },
    {
      key: "email",
      header: "Email",
      accessor: (manager) => manager.email,
    },
    {
      key: "actions",
      header: "Acciones",
      align: "end",
      render: (manager) => (
        <Button
          aria-label={`Ver eventos asignados a ${manager.name}`}
          onClick={() => onViewDetails(manager)}
          size="sm"
          variant="outline"
        >
          <Eye /> Detalles
        </Button>
      ),
    },
  ];

  return (
    <Box
      bg="bg.panel"
      borderColor="border"
      borderRadius="xl"
      borderWidth="1px"
      overflow="hidden"
    >
      <DataTable
        bordered={false}
        columns={columns}
        emptyState={<EmptyState title="No hay usuarios con rol Manager" />}
        errorMessage={errorMessage}
        isLoading={isLoading}
        loadingMessage="Cargando managers..."
        onRetry={onRetry}
        rows={managers}
        size="md"
      />

      <PaginationControl
        isFetching={isFetching}
        itemLabel="managers"
        onPageChange={onPageChange}
        pagination={pagination}
      />
    </Box>
  );
}
