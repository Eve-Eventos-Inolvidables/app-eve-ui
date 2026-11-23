import {
  Button,
  Dialog,
  Field,
  Input,
  Portal,
  Stack,
  Text,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { FormEvent } from "react";
import { useCreateEventCategoryMutation } from "../../queries/eventCategory.queries";
import { createEventCategorySchema } from "../../schemas/eventCategory.schema";
import type { EventCategoryDto } from "../../types/event.types";
import { getErrorMessage } from "../../utils/error";
import { toaster } from "../ui/chakra-base/toaster-instance";

interface CreateCategoryDialogProps {
  open: boolean;
  existingCategories: EventCategoryDto[];
  onCreated?: (category: EventCategoryDto) => void;
  onOpenChange: (open: boolean) => void;
}

interface CreateCategoryFormValues {
  name: string;
}

export function CreateCategoryDialog({
  open,
  existingCategories,
  onCreated,
  onOpenChange,
}: CreateCategoryDialogProps) {
  const createCategoryMutation = useCreateEventCategoryMutation();
  const schema = useMemo(
    () =>
      createEventCategorySchema(
        existingCategories.map((category) => category.name),
      ),
    [existingCategories],
  );
  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<CreateCategoryFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "" },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });
  const name = useWatch({ control, name: "name" }) ?? "";
  const isCreating = createCategoryMutation.isPending;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isCreating) return;
    onOpenChange(nextOpen);
  };

  const handleValidSubmit = async ({ name: categoryName }: CreateCategoryFormValues) => {
    try {
      const result = await createCategoryMutation.mutateAsync({
        name: categoryName,
      });

      onCreated?.(result.category);
      toaster.create({
        title: "Categoría creada",
        description:
          result.message ||
          `La categoría "${result.category.name}" se creó correctamente.`,
        type: "success",
      });
      reset({ name: "" });
      handleOpenChange(false);
    } catch (error) {
      toaster.create({
        title: "No se pudo crear la categoría",
        description: getErrorMessage(error, "No se pudo crear la categoría."),
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
      onOpenChange={({ open: nextOpen }) => handleOpenChange(nextOpen)}
      open={open}
      size="sm"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Nueva categoría</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <form noValidate onSubmit={handleFormSubmit}>
                <Stack gap="5">
                  <Text color="fg.muted" fontSize="sm">
                    Crea una categoría para poder asignarla a este evento.
                  </Text>
                  <Field.Root invalid={Boolean(errors.name)} required>
                    <Field.Label>Nombre de la categoría</Field.Label>
                    <Input
                      autoFocus
                      disabled={isCreating}
                      maxLength={100}
                      placeholder="Ej. Conciertos y música en vivo"
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
                      disabled={isCreating}
                      onClick={() => handleOpenChange(false)}
                      type="button"
                      variant="outline"
                    >
                      Cancelar
                    </Button>
                    <Button
                      colorPalette="brand"
                      loading={isCreating}
                      loadingText="Creando..."
                      type="submit"
                    >
                      Crear categoría
                    </Button>
                  </Dialog.Footer>
                </Stack>
              </form>
            </Dialog.Body>
            <Dialog.CloseTrigger disabled={isCreating} />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
