import { Button, Dialog, Portal, Stack, Text } from "@chakra-ui/react";
import { useDeleteEventCategoryMutation } from "../../queries/eventCategory.queries";
import type { EventCategoryDto } from "../../types/event.types";
import { getErrorMessage } from "../../utils/error";
import { toaster } from "../ui/chakra-base/toaster-instance";

interface DeleteCategoryDialogProps {
  category: EventCategoryDto | null;
  onDeleted: (category: EventCategoryDto) => void;
  onOpenChange: (open: boolean) => void;
}

export function DeleteCategoryDialog({
  category,
  onDeleted,
  onOpenChange,
}: DeleteCategoryDialogProps) {
  const deleteCategoryMutation = useDeleteEventCategoryMutation();
  const isPending = deleteCategoryMutation.isPending;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isPending) return;
    onOpenChange(nextOpen);
  };

  const handleDelete = async () => {
    if (!category) return;

    try {
      await deleteCategoryMutation.mutateAsync(category.id);
      toaster.create({
        title: "Categoría eliminada",
        description: `Se eliminó la categoría "${category.name}".`,
        type: "success",
      });
      onDeleted(category);
      handleOpenChange(false);
    } catch (error) {
      toaster.create({
        title: "No se pudo eliminar la categoría",
        description: getErrorMessage(error, "No se pudo eliminar la categoría."),
        type: "error",
      });
    }
  };

  return (
    <Dialog.Root
      onOpenChange={({ open }) => handleOpenChange(open)}
      open={Boolean(category)}
      size="sm"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Eliminar categoría</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Stack gap="5">
                <Text>
                  ¿Estás seguro de que deseas eliminar la categoría{" "}
                  <Text as="span" fontWeight="semibold">
                    {category?.name}
                  </Text>
                  ? Esta acción no se puede deshacer.
                </Text>
                <Dialog.Footer px="0">
                  <Button
                    disabled={isPending}
                    onClick={() => handleOpenChange(false)}
                    type="button"
                    variant="outline"
                  >
                    Cancelar
                  </Button>
                  <Button
                    colorPalette="red"
                    disabled={!category || isPending}
                    loading={isPending}
                    loadingText="Eliminando..."
                    onClick={() => void handleDelete()}
                    type="button"
                  >
                    Eliminar
                  </Button>
                </Dialog.Footer>
              </Stack>
            </Dialog.Body>
            <Dialog.CloseTrigger disabled={isPending} />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
