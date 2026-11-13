import {
  Button,
  Dialog,
  Field,
  Input,
  Portal,
  Stack,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { FormEvent } from "react";
import { useUpdateEventCategoryMutation } from "../../queries/eventCategory.queries";
import { createEventCategorySchema } from "../../schemas/eventCategory.schema";
import type { EventCategoryDto } from "../../types/event.types";
import { getErrorMessage } from "../../utils/error";
import { toaster } from "../ui/chakra-base/toaster-instance";

interface EditCategoryDialogProps {
  category: EventCategoryDto | null;
  existingCategories: EventCategoryDto[];
  onOpenChange: (open: boolean) => void;
}

interface EditCategoryFormValues {
  name: string;
}

export function EditCategoryDialog({
  category,
  existingCategories,
  onOpenChange,
}: EditCategoryDialogProps) {
  const updateCategoryMutation = useUpdateEventCategoryMutation();
  const schema = useMemo(
    () =>
      createEventCategorySchema(
        existingCategories
          .filter((item) => item.id !== category?.id)
          .map((item) => item.name),
      ),
    [category?.id, existingCategories],
  );
  const {
    control,
    formState: { errors, isDirty },
    handleSubmit,
    register,
    reset,
  } = useForm<EditCategoryFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "" },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });
  const name = useWatch({ control, name: "name" }) ?? "";
  const isPending = updateCategoryMutation.isPending;

  useEffect(() => {
    if (category) {
      reset({ name: category.name });
    } else {
      reset({ name: "" });
    }
  }, [category, reset]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isPending) return;
    onOpenChange(nextOpen);
  };

  const handleValidSubmit = async ({ name: categoryName }: EditCategoryFormValues) => {
    if (!category) return;

    try {
      const result = await updateCategoryMutation.mutateAsync({
        id: category.id,
        body: { name: categoryName },
      });

      toaster.create({
        title: "Categoría actualizada",
        description:
          result.message || "La categoría se actualizó correctamente.",
        type: "success",
      });
      handleOpenChange(false);
    } catch (error) {
      toaster.create({
        title: "No se pudo actualizar la categoría",
        description: getErrorMessage(
          error,
          "No se pudo actualizar la categoría.",
        ),
        type: "error",
      });
    }
  };

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    void handleSubmit(handleValidSubmit)(event);
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
              <Dialog.Title>Editar categoría</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <form noValidate onSubmit={handleFormSubmit}>
                <Stack gap="5">
                  <Field.Root invalid={Boolean(errors.name)} required>
                    <Field.Label>Nombre de la categoría</Field.Label>
                    <Input
                      autoFocus
                      disabled={isPending}
                      maxLength={100}
                      placeholder="Nombre de la categoría"
                      {...register("name")}
                    />
                    {errors.name ? (
                      <Field.ErrorText>{errors.name.message}</Field.ErrorText>
                    ) : (
                      <Field.HelperText>
                        {name.trim().length}/100 caracteres
                      </Field.HelperText>
                    )}
                  </Field.Root>
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
                      colorPalette="brand"
                      disabled={!isDirty || isPending}
                      loading={isPending}
                      loadingText="Guardando..."
                      type="submit"
                    >
                      Guardar cambios
                    </Button>
                  </Dialog.Footer>
                </Stack>
              </form>
            </Dialog.Body>
            <Dialog.CloseTrigger disabled={isPending} />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
