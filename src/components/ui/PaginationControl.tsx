import { useState } from "react";
import {
  ButtonGroup,
  Flex,
  IconButton,
  Pagination,
  Text,
} from "@chakra-ui/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Pagination as PaginationType } from "../../types/responses";

interface PaginationControlProps {
  pagination?: PaginationType | null;
  onPageChange?: (page: number) => void;
  isFetching?: boolean;
  itemLabel?: string;
  showSummary?: boolean;
  size?: "sm" | "md";
}

export function PaginationControl({
  pagination,
  onPageChange,
  isFetching = false,
  itemLabel = "registros",
  showSummary = true,
  size = "sm",
}: PaginationControlProps) {
  const totalItems = pagination?.totalItems ?? 0;
  const totalPages = Math.max(pagination?.totalPages ?? 0, 1);
  const pageSize = pagination?.size ?? 10;

  const [internalPage, setInternalPage] = useState(1);

  const currentPage = Math.min(Math.max(internalPage, 1), totalPages);

  if (totalItems === 0) {
    return null;
  }

  const handlePageChange = (newPage: number) => {
    setInternalPage(newPage);
    onPageChange?.(newPage);
  };

  return (
    <Pagination.Root
      count={totalItems}
      onPageChange={({ page: newPage }) => handlePageChange(newPage)}
      page={currentPage}
      pageSize={pageSize}
    >
      <Flex
        align="center"
        borderTopColor="border"
        borderTopWidth="1px"
        gap="3"
        justify="space-between"
        px="4"
        py="3"
        wrap="wrap"
      >
        {showSummary && (
          <Text color="fg.muted" fontSize="sm">
            Página {currentPage} de {totalPages} · {totalItems} {itemLabel}
          </Text>
        )}

        <ButtonGroup gap="1">
          <Pagination.PrevTrigger asChild>
            <IconButton
              aria-label="Página anterior"
              disabled={isFetching || currentPage <= 1}
              size={size}
              variant="outline"
            >
              <ChevronLeft />
            </IconButton>
          </Pagination.PrevTrigger>

          <Pagination.Items
            ellipsis={<span aria-hidden="true">…</span>}
            render={(pageItem) => (
              <IconButton
                aria-current={pageItem.value === currentPage ? "page" : undefined}
                aria-label={`Ir a la página ${pageItem.value}`}
                colorPalette={pageItem.value === currentPage ? "brand" : undefined}
                disabled={isFetching}
                size={size}
                variant={pageItem.value === currentPage ? "solid" : "outline"}
              >
                {pageItem.value}
              </IconButton>
            )}
          />

          <Pagination.NextTrigger asChild>
            <IconButton
              aria-label="Página siguiente"
              disabled={isFetching || currentPage >= totalPages}
              size={size}
              variant="outline"
            >
              <ChevronRight />
            </IconButton>
          </Pagination.NextTrigger>
        </ButtonGroup>
      </Flex>
    </Pagination.Root>
  );
}