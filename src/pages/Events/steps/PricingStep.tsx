import {
  Box,
  Button,
  Field,
  Flex,
  Heading,
  Input,
  NativeSelect,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import { Plus, Trash2 } from "lucide-react";
import {
  useFieldArray,
  useFormContext,
  useWatch,
} from "react-hook-form";
import type { EventDraft } from "../../../types/event.types";
import { getArrayError } from "../wizardErrors";

interface PricingStepProps {
  sectorCapacityErrors: string[];
}

export function PricingStep({ sectorCapacityErrors }: PricingStepProps) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<EventDraft>();

  const precios = useFieldArray({ control, name: "precios" });
  const sectores = useWatch({ control, name: "sectores" }) ?? [];
  const tandas = useWatch({ control, name: "tandas" }) ?? [];
  const preciosError = getArrayError(errors.precios);

  return (
    <Stack gap="5">
      <Flex align="center" justify="space-between">
        <Box>
          <Heading color="fg" size="md">
            Precios
          </Heading>
          <Text color="fg.muted" fontSize="sm">
            Asigna un precio y una cantidad por sector y tanda.
          </Text>
        </Box>
        <Button
          colorPalette="brand"
          onClick={() =>
            precios.append({
              sectorId: "",
              batchId: "",
              price: "",
              quantity: "",
            })
          }
          size="sm"
          type="button"
        >
          <Plus /> Agregar precio
        </Button>
      </Flex>

      {preciosError && (
        <Text color={{ base: "red.500", _dark: "red.400" }} fontSize="sm">
          {preciosError}
        </Text>
      )}

      {precios.fields.length === 0 && (
        <Box
          borderColor="border"
          borderRadius="lg"
          borderStyle="dashed"
          borderWidth="1px"
          p="8"
          textAlign="center"
        >
          <Text color="fg.muted" fontSize="sm">
            Aún no hay precios. Agrega una fila para comenzar.
          </Text>
        </Box>
      )}

      <Stack gap="4">
        {precios.fields.map((precio, index) => (
          <Box
            borderColor="border"
            borderRadius="lg"
            borderWidth="1px"
            key={precio.id}
            p="4"
          >
            <Flex align="center" justify="space-between" mb="3">
              <Text color="fg" fontSize="sm" fontWeight="semibold">
                Precio {index + 1}
              </Text>
              <Button
                colorPalette="red"
                onClick={() => precios.remove(index)}
                size="xs"
                type="button"
                variant="ghost"
              >
                <Trash2 /> Eliminar
              </Button>
            </Flex>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap="4">
              <Field.Root
                invalid={Boolean(errors.precios?.[index]?.sectorId)}
                required
              >
                <Field.Label>Sector</Field.Label>
                <NativeSelect.Root>
                  <NativeSelect.Field
                    {...register(`precios.${index}.sectorId`)}
                  >
                    <option value="">Selecciona un sector</option>
                    {sectores.map((sector, sectorIndex) => (
                      <option key={sectorIndex} value={sectorIndex}>
                        {sector.name || `Sector ${sectorIndex + 1}`}
                      </option>
                    ))}
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
                {errors.precios?.[index]?.sectorId && (
                  <Field.ErrorText>
                    {errors.precios[index]?.sectorId?.message}
                  </Field.ErrorText>
                )}
              </Field.Root>

              <Field.Root
                invalid={Boolean(errors.precios?.[index]?.batchId)}
                required
              >
                <Field.Label>Tanda</Field.Label>
                <NativeSelect.Root>
                  <NativeSelect.Field {...register(`precios.${index}.batchId`)}>
                    <option value="">Selecciona una tanda</option>
                    {tandas.map((tanda, tandaIndex) => (
                      <option key={tandaIndex} value={tandaIndex}>
                        {tanda.name || `Tanda ${tandaIndex + 1}`}
                      </option>
                    ))}
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
                {errors.precios?.[index]?.batchId && (
                  <Field.ErrorText>
                    {errors.precios[index]?.batchId?.message}
                  </Field.ErrorText>
                )}
              </Field.Root>

              <Field.Root
                invalid={Boolean(errors.precios?.[index]?.price)}
                required
              >
                <Field.Label>Precio</Field.Label>
                <Input
                  min="1"
                  placeholder="Ej. 650000"
                  type="number"
                  {...register(`precios.${index}.price`)}
                />
                {errors.precios?.[index]?.price && (
                  <Field.ErrorText>
                    {errors.precios[index]?.price?.message}
                  </Field.ErrorText>
                )}
              </Field.Root>

              <Field.Root
                invalid={Boolean(errors.precios?.[index]?.quantity)}
                required
              >
                <Field.Label>Cantidad</Field.Label>
                <Input
                  min="1"
                  placeholder="Ej. 1000"
                  type="number"
                  {...register(`precios.${index}.quantity`)}
                />
                {errors.precios?.[index]?.quantity && (
                  <Field.ErrorText>
                    {errors.precios[index]?.quantity?.message}
                  </Field.ErrorText>
                )}
              </Field.Root>
            </SimpleGrid>
          </Box>
        ))}
      </Stack>

      {sectorCapacityErrors.map((message, index) => (
        <Text
          color={{ base: "red.500", _dark: "red.400" }}
          fontSize="sm"
          key={`${index}-${message}`}
        >
          {message}
        </Text>
      ))}
    </Stack>
  );
}
