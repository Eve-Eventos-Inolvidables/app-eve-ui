import {
  Button,
  Field,
  Flex,
  Input,
  NativeSelect,
  SimpleGrid,
  Spinner,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { CreateCategoryDialog } from "../../../components/categories/CreateCategoryDialog";
import { useAllEventCategoriesQuery } from "../../../queries/eventCategory.queries";
import type { EventDraft } from "../../../types/event.types";
import { getErrorMessage } from "../../../utils/error";

export function BasicInfoStep() {
  const {
    register,
    setValue,
    formState: { errors },
  } = useFormContext<EventDraft>();
  const categoriesQuery = useAllEventCategoriesQuery();
  const categories = categoriesQuery.data ?? [];
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);

  return (
    <SimpleGrid columns={{ base: 1, md: 2 }} gap="5">
      <Field.Root invalid={Boolean(errors.categoryId)} required>
        <Flex align="center" justify="space-between" w="full">
          <Field.Label>Categoría</Field.Label>
          <Button
            colorPalette="brand"
            onClick={() => setIsCreateCategoryOpen(true)}
            size="xs"
            type="button"
            variant="ghost"
          >
            <Plus /> Nueva categoría
          </Button>
        </Flex>
        <NativeSelect.Root
          disabled={categoriesQuery.isPending && !categoriesQuery.data}
        >
          <NativeSelect.Field {...register("categoryId")}>
            <option value="">
              {categoriesQuery.isPending
                ? "Cargando categorías..."
                : categoriesQuery.isError && categories.length === 0
                  ? "No se pudieron cargar las categorías"
                  : "Selecciona una categoría"}
            </option>
            {categories.map((category) => (
              <option key={category.id} value={String(category.id)}>
                {category.name}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
        {categoriesQuery.isPending && (
          <Flex align="center" color="fg.muted" gap="2">
            <Spinner size="xs" />
            <Text fontSize="sm">Cargando categorías...</Text>
          </Flex>
        )}
        {categoriesQuery.isError && (
          <Flex align="center" gap="2" wrap="wrap">
            <Text color="fg.error" fontSize="sm">
              {getErrorMessage(
                categoriesQuery.error,
                "No se pudieron cargar las categorías.",
              )}
            </Text>
            <Button
              onClick={() => void categoriesQuery.refetch()}
              size="xs"
              type="button"
              variant="outline"
            >
              Reintentar
            </Button>
          </Flex>
        )}
        {!categoriesQuery.isPending &&
          !categoriesQuery.isError &&
          categories.length === 0 && (
            <Text color="fg.muted" fontSize="sm">
              Aún no hay categorías registradas. Crea la primera para continuar.
            </Text>
          )}
        {errors.categoryId && (
          <Field.ErrorText>{errors.categoryId.message}</Field.ErrorText>
        )}
      </Field.Root>

      <CreateCategoryDialog
        existingCategories={categories}
        onCreated={(category) =>
          setValue("categoryId", String(category.id), {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true,
          })
        }
        onOpenChange={setIsCreateCategoryOpen}
        open={isCreateCategoryOpen}
      />

      <Field.Root invalid={Boolean(errors.name)} required>
        <Field.Label>Nombre del evento</Field.Label>
        <Input
          placeholder="Ej. Iron Maiden - The Future Past Tour"
          {...register("name")}
        />
        {errors.name && (
          <Field.ErrorText>{errors.name.message}</Field.ErrorText>
        )}
      </Field.Root>

      <Field.Root invalid={Boolean(errors.visibleStart)} required>
        <Field.Label>Inicio de visibilidad</Field.Label>
        <Input type="date" {...register("visibleStart")} />
        {errors.visibleStart && (
          <Field.ErrorText>{errors.visibleStart.message}</Field.ErrorText>
        )}
      </Field.Root>

      <Field.Root invalid={Boolean(errors.date)} required>
        <Field.Label>Fecha del evento</Field.Label>
        <Input type="date" {...register("date")} />
        {errors.date && (
          <Field.ErrorText>{errors.date.message}</Field.ErrorText>
        )}
      </Field.Root>

      <Field.Root invalid={Boolean(errors.kickOffTime)} required>
        <Field.Label>Hora de inicio</Field.Label>
        <Input type="time" {...register("kickOffTime")} />
        {errors.kickOffTime && (
          <Field.ErrorText>{errors.kickOffTime.message}</Field.ErrorText>
        )}
      </Field.Root>

      <Field.Root invalid={Boolean(errors.ticketsPerPersonLimit)} required>
        <Field.Label>Límite de tickets por persona</Field.Label>
        <Input
          min="1"
          placeholder="Ej. 4"
          type="number"
          {...register("ticketsPerPersonLimit")}
        />
        {errors.ticketsPerPersonLimit && (
          <Field.ErrorText>
            {errors.ticketsPerPersonLimit.message}
          </Field.ErrorText>
        )}
      </Field.Root>

      <Field.Root invalid={Boolean(errors.primaryColor)} required>
        <Field.Label>Color primario</Field.Label>
        <Input h="10" p="1" type="color" {...register("primaryColor")} />
        {errors.primaryColor && (
          <Field.ErrorText>{errors.primaryColor.message}</Field.ErrorText>
        )}
      </Field.Root>

      <Field.Root invalid={Boolean(errors.secondaryColor)} required>
        <Field.Label>Color secundario</Field.Label>
        <Input h="10" p="1" type="color" {...register("secondaryColor")} />
        {errors.secondaryColor && (
          <Field.ErrorText>{errors.secondaryColor.message}</Field.ErrorText>
        )}
      </Field.Root>

      <Field.Root gridColumn="1 / -1">
        <Field.Label>Descripción</Field.Label>
        <Textarea
          minH="28"
          placeholder="Describe el evento..."
          {...register("description")}
        />
      </Field.Root>

      <Field.Root gridColumn="1 / -1" invalid={Boolean(errors.mapsLink)}>
        <Field.Label>Enlace de mapas</Field.Label>
        <Input
          placeholder="https://maps.app.goo.gl/..."
          type="url"
          {...register("mapsLink")}
        />
        {errors.mapsLink && (
          <Field.ErrorText>{errors.mapsLink.message}</Field.ErrorText>
        )}
      </Field.Root>
    </SimpleGrid>
  );
}
