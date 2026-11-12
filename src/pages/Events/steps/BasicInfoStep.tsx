import { Field, Input, SimpleGrid, Textarea } from "@chakra-ui/react";
import { useFormContext } from "react-hook-form";
import type { EventDraft } from "../../../types/event.types";

export function BasicInfoStep() {
  const {
    register,
    formState: { errors },
  } = useFormContext<EventDraft>();

  return (
    <SimpleGrid columns={{ base: 1, md: 2 }} gap="5">
      <Field.Root invalid={Boolean(errors.categoryId)} required>
        <Field.Label>ID de categoría</Field.Label>
        <Input
          min="1"
          placeholder="Ej. 1"
          type="number"
          {...register("categoryId")}
        />
        {errors.categoryId && (
          <Field.ErrorText>{errors.categoryId.message}</Field.ErrorText>
        )}
      </Field.Root>

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
