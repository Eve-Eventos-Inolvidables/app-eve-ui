import {
  Button,
  Center,
  Spinner,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import type { ReactNode } from "react";
import { getErrorMessage } from "../../utils/error";
import { EmptyState } from "./EmptyState";

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  accessor?: (row: T) => unknown;
  render?: (row: T) => ReactNode;
  align?: "start" | "center" | "end";
  width?: string;
  minWidth?: string;
  emptyText?: string;
}

interface DataTableProps<T extends { id: number }> {
  columns: DataTableColumn<T>[];
  rows: T[];
  isLoading?: boolean;
  error?: unknown;
  errorMessage?: string;
  onRetry?: () => void;
  loadingMessage?: string;
  emptyState?: ReactNode;
  size?: "sm" | "md";
  maxHeight?: string;
  minHeight?: string;
  bordered?: boolean;
  isRowActive?: (row: T) => boolean;
  isRowDisabled?: (row: T) => boolean;
  onRowDoubleClick?: (row: T) => void;
}

function renderCellValue<T>(column: DataTableColumn<T>, row: T): ReactNode {
  if (column.render) {
    return column.render(row);
  }

  if (!column.accessor) {
    return column.emptyText ?? "-";
  }

  const value = column.accessor(row);

  if (value === null || value === undefined || value === "") {
    return column.emptyText ?? "-";
  }

  return String(value);
}

export function DataTable<T extends { id: number }>({
  columns,
  rows,
  isLoading = false,
  error,
  errorMessage,
  onRetry,
  loadingMessage = "Cargando datos...",
  emptyState,
  size = "md",
  maxHeight,
  minHeight,
  bordered = true,
  isRowActive,
  isRowDisabled,
  onRowDoubleClick,
}: DataTableProps<T>) {
  const resolvedErrorMessage =
    errorMessage ??
    (error !== null && error !== undefined
      ? getErrorMessage(error, "No se pudieron cargar los datos.")
      : undefined);

  return (
    <Table.ScrollArea
      aria-busy={isLoading}
      borderColor="border"
      borderRadius={bordered ? "lg" : undefined}
      borderWidth={bordered ? "1px" : undefined}
      maxH={maxHeight}
      minH={minHeight}
    >
      <Table.Root size={size} stickyHeader variant="line">
        <Table.Header>
          <Table.Row bg="bg.subtle">
            {columns.map((column) => (
              <Table.ColumnHeader
                key={column.key}
                fontWeight="semibold"
                minWidth={column.minWidth}
                scope="col"
                textAlign={column.align}
                width={column.width}
              >
                {column.header}
              </Table.ColumnHeader>
            ))}
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {isLoading ? (
            <Table.Row>
              <Table.Cell colSpan={columns.length} textAlign="center">
                <Center py="10" role="status">
                  <Stack align="center" gap="3">
                    <Spinner color="brand.solid" size="lg" />
                    <Text color="fg.muted" fontSize="sm">
                      {loadingMessage}
                    </Text>
                  </Stack>
                </Center>
              </Table.Cell>
            </Table.Row>
          ) : resolvedErrorMessage ? (
            <Table.Row>
              <Table.Cell colSpan={columns.length} textAlign="center">
                <Center py="10">
                  <Stack align="center" gap="3">
                    <Text color="fg.muted">{resolvedErrorMessage}</Text>
                    {onRetry && (
                      <Button onClick={onRetry} size="sm" variant="outline">
                        Reintentar
                      </Button>
                    )}
                  </Stack>
                </Center>
              </Table.Cell>
            </Table.Row>
          ) : rows.length === 0 ? (
            <Table.Row>
              <Table.Cell colSpan={columns.length} p="0">
                {emptyState ?? <EmptyState />}
              </Table.Cell>
            </Table.Row>
          ) : (
            rows.map((row) => {
              const isActive = isRowActive?.(row) ?? false;
              const isDisabled = isRowDisabled?.(row) ?? false;

              return (
                <Table.Row
                  key={row.id}
                  aria-disabled={isDisabled || undefined}
                  bg={isActive ? "brand.muted" : undefined}
                  cursor={onRowDoubleClick && !isDisabled ? "pointer" : undefined}
                  onDoubleClick={
                    onRowDoubleClick && !isDisabled
                      ? () => onRowDoubleClick(row)
                      : undefined
                  }
                  opacity={isDisabled ? 0.55 : 1}
                  _hover={
                    isDisabled
                      ? undefined
                      : { bg: isActive ? "brand.muted" : "bg.subtle" }
                  }
                >
                  {columns.map((column) => (
                    <Table.Cell
                      key={column.key}
                      textAlign={column.align}
                      whiteSpace="normal"
                      wordBreak="break-word"
                    >
                      {renderCellValue(column, row)}
                    </Table.Cell>
                  ))}
                </Table.Row>
              );
            })
          )}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
}
