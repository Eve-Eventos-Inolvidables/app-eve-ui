import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  Spinner,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import { Pencil, Plus, Tags, Trash2 } from "lucide-react";
import { useState } from "react";
import { CreateCategoryDialog } from "../../components/categories/CreateCategoryDialog";
import { DeleteCategoryDialog } from "../../components/categories/DeleteCategoryDialog";
import { EditCategoryDialog } from "../../components/categories/EditCategoryDialog";
import { useAllEventCategoriesQuery, useEventCategoriesQuery } from "../../queries/eventCategory.queries";
import type { EventCategoryDto } from "../../types/event.types";
import { getErrorMessage } from "../../utils/error";

const PAGE_SIZE = 10;

export default function EventCategories() {
  const [pageIndex, setPageIndex] = useState(0);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] =
    useState<EventCategoryDto | null>(null);
  const [categoryToDelete, setCategoryToDelete] =
    useState<EventCategoryDto | null>(null);

  const categoriesQuery = useEventCategoriesQuery({
    page: pageIndex,
    size: PAGE_SIZE,
    sort: "name,asc",
  });
  const allCategoriesQuery = useAllEventCategoriesQuery();
  const categories = categoriesQuery.data?.data ?? [];
  const pagination = categoriesQuery.data?.pagination;
  const totalPages = pagination?.totalPages ?? 0;
  const currentPage = totalPages > 0 ? Math.min(pageIndex + 1, totalPages) : 1;
  const allActiveCategories = allCategoriesQuery.data ?? [];

  const handleDeleted = () => {
    if (categories.length === 1 && pageIndex > 0) {
      setPageIndex((current) => Math.max(current - 1, 0));
    }
    setCategoryToDelete(null);
  };

  return (
    <Stack gap="6">
      <Flex
        align={{ base: "flex-start", md: "center" }}
        direction={{ base: "column", md: "row" }}
        gap="4"
        justify="space-between"
      >
        <Box>
          <Heading color="fg" size="2xl">
            Categorías de eventos
          </Heading>
          <Text color="fg.muted" mt="2">
            Administra las categorías disponibles para clasificar eventos.
          </Text>
        </Box>
        <Button
          colorPalette="brand"
          onClick={() => setIsCreateOpen(true)}
        >
          <Plus /> Nueva categoría
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
                <Table.ColumnHeader textAlign="end">Acciones</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {categoriesQuery.isPending ? (
                <Table.Row>
                  <Table.Cell colSpan={4} color="fg.muted" textAlign="center">
                    <Flex align="center" gap="2" justify="center" py="4">
                      <Spinner size="xs" />
                      Cargando categorías...
                    </Flex>
                  </Table.Cell>
                </Table.Row>
              ) : categoriesQuery.isError ? (
                <Table.Row>
                  <Table.Cell colSpan={4} textAlign="center">
                    <Stack align="center" gap="3" py="4">
                      <Text color="fg.error">
                        {getErrorMessage(
                          categoriesQuery.error,
                          "No se pudieron cargar las categorías.",
                        )}
                      </Text>
                      <Button
                        onClick={() => void categoriesQuery.refetch()}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        Reintentar
                      </Button>
                    </Stack>
                  </Table.Cell>
                </Table.Row>
              ) : categories.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={4} textAlign="center">
                    <Stack align="center" gap="3" py="8">
                      <Tags aria-hidden="true" color="var(--chakra-colors-fg-muted)" />
                      <Box>
                        <Text fontWeight="semibold">Aún no hay categorías</Text>
                        <Text color="fg.muted" fontSize="sm">
                          Crea una categoría para poder clasificar eventos.
                        </Text>
                      </Box>
                      <Button
                        colorPalette="brand"
                        onClick={() => setIsCreateOpen(true)}
                        size="sm"
                      >
                        <Plus /> Crear primera categoría
                      </Button>
                    </Stack>
                  </Table.Cell>
                </Table.Row>
              ) : (
                categories.map((category) => (
                  <Table.Row key={category.id}>
                    <Table.Cell fontWeight="medium">{category.name}</Table.Cell>
                    <Table.Cell textAlign="end">
                      <Flex gap="2" justify="flex-end">
                        <Button
                          aria-label={`Editar categoría ${category.name}`}
                          onClick={() => setCategoryToEdit(category)}
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          <Pencil /> Editar
                        </Button>
                        <Button
                          aria-label={`Eliminar categoría ${category.name}`}
                          colorPalette="red"
                          onClick={() => setCategoryToDelete(category)}
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          <Trash2 /> Eliminar
                        </Button>
                      </Flex>
                    </Table.Cell>
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table.Root>
        </Table.ScrollArea>

        {!categoriesQuery.isPending &&
          !categoriesQuery.isError &&
          categories.length > 0 && (
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
                {pagination?.totalItems ?? categories.length} categorías
              </Text>
              <Flex gap="2">
                <Button
                  disabled={pageIndex <= 0 || categoriesQuery.isFetching}
                  onClick={() =>
                    setPageIndex((current) => Math.max(current - 1, 0))
                  }
                  size="sm"
                  variant="outline"
                >
                  Anterior
                </Button>
                <Button
                  disabled={
                    categoriesQuery.isFetching || currentPage >= totalPages
                  }
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

      <CreateCategoryDialog
        existingCategories={allActiveCategories}
        onOpenChange={setIsCreateOpen}
        open={isCreateOpen}
      />
      <EditCategoryDialog
        category={categoryToEdit}
        existingCategories={allActiveCategories}
        onOpenChange={(open) => {
          if (!open) setCategoryToEdit(null);
        }}
      />
      <DeleteCategoryDialog
        category={categoryToDelete}
        onDeleted={handleDeleted}
        onOpenChange={(open) => {
          if (!open) setCategoryToDelete(null);
        }}
      />
    </Stack>
  );
}
