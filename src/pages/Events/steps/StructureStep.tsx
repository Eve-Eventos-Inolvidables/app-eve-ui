import {
  Box,
  Button,
  Field,
  Flex,
  Heading,
  Input,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useFormContext } from "react-hook-form";
import type { EventDraft } from "../../../types/event.types";
import { remapPriceIndexes } from "../../../utils/eventForm";
import { getArrayError } from "../wizardErrors";

interface StructureStepProps {
  generalError?: string;
}

export function StructureStep({ generalError }: StructureStepProps) {
  const {
    register,
    control,
    getValues,
    setValue,
    formState: { errors },
  } = useFormContext<EventDraft>();

  const sectores = useFieldArray({ control, name: "sectores" });
  const tandas = useFieldArray({ control, name: "tandas" });

  const removeSector = (index: number) => {
    sectores.remove(index);
    setValue(
      "precios",
      remapPriceIndexes(getValues("precios"), "sectorId", index),
      { shouldDirty: true },
    );
  };

  const removeTanda = (index: number) => {
    tandas.remove(index);
    setValue(
      "precios",
      remapPriceIndexes(getValues("precios"), "batchId", index),
      { shouldDirty: true },
    );
  };

  const sectoresError = getArrayError(errors.sectores);
  const tandasError = getArrayError(errors.tandas);

  return (
    <Stack gap="8">
      <Box>
        <Flex align="center" justify="space-between" mb="4">
          <Box>
            <Heading color="fg" size="md">
              Sectores
            </Heading>
            <Text color="fg.muted" fontSize="sm">
              Define los espacios disponibles y su capacidad.
            </Text>
          </Box>
          <Button
            colorPalette="brand"
            onClick={() =>
              sectores.append({ eventId: 0, name: "", capacity: "" })
            }
            size="sm"
            type="button"
          >
            <Plus /> Agregar sector
          </Button>
        </Flex>

        {sectoresError && (
          <Text color={{ base: "red.500", _dark: "red.400" }} fontSize="sm" mb="3">
            {sectoresError}
          </Text>
        )}

        <Stack gap="4">
          {sectores.fields.map((sector, index) => (
            <Box
              borderColor="border"
              borderRadius="lg"
              borderWidth="1px"
              key={sector.id}
              p="4"
            >
              <Flex align="center" justify="space-between" mb="3">
                <Text color="fg" fontSize="sm" fontWeight="semibold">
                  Sector {index + 1}
                </Text>
                <Button
                  colorPalette="red"
                  onClick={() => removeSector(index)}
                  size="xs"
                  type="button"
                  variant="ghost"
                >
                  <Trash2 /> Eliminar
                </Button>
              </Flex>

              <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
                <Field.Root
                  invalid={Boolean(errors.sectores?.[index]?.name)}
                  required
                >
                  <Field.Label>Nombre del sector</Field.Label>
                  <Input
                    placeholder="Ej. Campo VIP"
                    {...register(`sectores.${index}.name`)}
                  />
                  {errors.sectores?.[index]?.name && (
                    <Field.ErrorText>
                      {errors.sectores[index]?.name?.message}
                    </Field.ErrorText>
                  )}
                </Field.Root>

                <Field.Root
                  invalid={Boolean(errors.sectores?.[index]?.capacity)}
                  required
                >
                  <Field.Label>Capacidad</Field.Label>
                  <Input
                    min="1"
                    placeholder="Ej. 3000"
                    type="number"
                    {...register(`sectores.${index}.capacity`)}
                  />
                  {errors.sectores?.[index]?.capacity && (
                    <Field.ErrorText>
                      {errors.sectores[index]?.capacity?.message}
                    </Field.ErrorText>
                  )}
                </Field.Root>
              </SimpleGrid>
            </Box>
          ))}
        </Stack>
      </Box>

      <Box>
        <Flex align="center" justify="space-between" mb="4">
          <Box>
            <Heading color="fg" size="md">
              Tandas
            </Heading>
            <Text color="fg.muted" fontSize="sm">
              Las tandas no pueden finalizar después del evento.
            </Text>
          </Box>
          <Button
            colorPalette="brand"
            onClick={() =>
              tandas.append({
                eventId: 0,
                name: "",
                startDate: "",
                endDate: "",
              })
            }
            size="sm"
            type="button"
          >
            <Plus /> Agregar tanda
          </Button>
        </Flex>

        {tandasError && (
          <Text color={{ base: "red.500", _dark: "red.400" }} fontSize="sm" mb="3">
            {tandasError}
          </Text>
        )}

        {generalError && (
          <Text color={{ base: "red.500", _dark: "red.400" }} fontSize="sm" mb="3">
            {generalError}
          </Text>
        )}

        <Stack gap="4">
          {tandas.fields.map((tanda, index) => (
            <Box
              borderColor="border"
              borderRadius="lg"
              borderWidth="1px"
              key={tanda.id}
              p="4"
            >
              <Flex align="center" justify="space-between" mb="3">
                <Text color="fg" fontSize="sm" fontWeight="semibold">
                  Tanda {index + 1}
                </Text>
                <Button
                  colorPalette="red"
                  onClick={() => removeTanda(index)}
                  size="xs"
                  type="button"
                  variant="ghost"
                >
                  <Trash2 /> Eliminar
                </Button>
              </Flex>

              <SimpleGrid columns={{ base: 1, md: 3 }} gap="4">
                <Field.Root
                  invalid={Boolean(errors.tandas?.[index]?.name)}
                  required
                >
                  <Field.Label>Nombre de la tanda</Field.Label>
                  <Input
                    placeholder="Ej. Preventa Early Bird"
                    {...register(`tandas.${index}.name`)}
                  />
                  {errors.tandas?.[index]?.name && (
                    <Field.ErrorText>
                      {errors.tandas[index]?.name?.message}
                    </Field.ErrorText>
                  )}
                </Field.Root>

                <Field.Root
                  invalid={Boolean(errors.tandas?.[index]?.startDate)}
                  required
                >
                  <Field.Label>Fecha de inicio</Field.Label>
                  <Input
                    type="date"
                    {...register(`tandas.${index}.startDate`)}
                  />
                  {errors.tandas?.[index]?.startDate && (
                    <Field.ErrorText>
                      {errors.tandas[index]?.startDate?.message}
                    </Field.ErrorText>
                  )}
                </Field.Root>

                <Field.Root
                  invalid={Boolean(errors.tandas?.[index]?.endDate)}
                  required
                >
                  <Field.Label>Fecha de fin</Field.Label>
                  <Input type="date" {...register(`tandas.${index}.endDate`)} />
                  {errors.tandas?.[index]?.endDate && (
                    <Field.ErrorText>
                      {errors.tandas[index]?.endDate?.message}
                    </Field.ErrorText>
                  )}
                </Field.Root>
              </SimpleGrid>
            </Box>
          ))}
        </Stack>
      </Box>
    </Stack>
  );
}
