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
  Steps,
  Text,
  Textarea,
} from "@chakra-ui/react";
import axios from "axios";
import { useState } from "react";
import type { FormEvent } from "react";
import { FiArrowLeft, FiArrowRight, FiCheck, FiPlus, FiTrash2 } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { toaster } from "../../components/ui/chakra-base/toaster-instance";
import { useAuthStore } from "../../stores/auth.store";
import { getErrorMessage } from "../../utils/error";
import "../../styles/EventsCreate/event.css";

interface SectorDraft {
  eventId: 0;
  name: string;
  capacity: string;
}

interface TandaDraft {
  eventId: 0;
  name: string;
  startDate: string;
  endDate: string;
}

interface PrecioDraft {
  sectorId: string;
  batchId: string;
  price: string;
  quantity: string;
}

interface EventDraft {
  categoryId: string;
  name: string;
  visibleStart: string;
  description: string;
  date: string;
  kickOffTime: string;
  ticketsPerPersonLimit: string;
  primaryColor: string;
  secondaryColor: string;
  mapsLink: string;
  sectores: SectorDraft[];
  tandas: TandaDraft[];
  precios: PrecioDraft[];
}

interface EventPayload {
  categoryId: number;
  name: string;
  visibleStart: string;
  description: string;
  date: string;
  kickOffTime: string;
  ticketsPerPersonLimit: number;
  primaryColor: string;
  secondaryColor: string;
  mapsLink: string;
  sectores: { eventId: 0; name: string; capacity: number }[];
  tandas: { eventId: 0; name: string; startDate: string; endDate: string }[];
  precios: { sectorId: number; batchId: number; price: number; quantity: number }[];
}

type BasicField = Exclude<keyof EventDraft, "sectores" | "tandas" | "precios">;
type FormErrors = Record<string, string>;

const STEPS = [
  { title: "Datos básicos", description: "Información general del evento" },
  { title: "Estructura", description: "Sectores y tandas" },
  { title: "Precios", description: "Precios por sector y tanda" },
];

function createInitialForm(): EventDraft {
  return {
    categoryId: "",
    name: "",
    visibleStart: "",
    description: "",
    date: "",
    kickOffTime: "",
    ticketsPerPersonLimit: "",
    primaryColor: "#111111",
    secondaryColor: "#C8102E",
    mapsLink: "",
    sectores: [{ eventId: 0, name: "", capacity: "" }],
    tandas: [{ eventId: 0, name: "", startDate: "", endDate: "" }],
    precios: [],
  };
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeTime(value: string): string {
  if (!value) {
    return "";
  }

  return value.length === 5 ? `${value}:00` : value;
}

function validateStep1(form: EventDraft): FormErrors {
  const errors: FormErrors = {};
  const categoryId = Number(form.categoryId);
  const ticketsLimit = Number(form.ticketsPerPersonLimit);

  if (!form.categoryId || !Number.isInteger(categoryId) || categoryId <= 0) {
    errors.categoryId = "Ingresa un ID de categoría válido.";
  }

  if (!form.name.trim()) {
    errors.name = "El nombre del evento es obligatorio.";
  }

  if (!form.visibleStart) {
    errors.visibleStart = "La fecha de inicio de visibilidad es obligatoria.";
  }

  if (!form.date) {
    errors.date = "La fecha del evento es obligatoria.";
  }

  if (!form.kickOffTime) {
    errors.kickOffTime = "La hora de inicio es obligatoria.";
  }

  if (
    !form.ticketsPerPersonLimit ||
    !Number.isInteger(ticketsLimit) ||
    ticketsLimit <= 0
  ) {
    errors.ticketsPerPersonLimit =
      "El límite de tickets por persona debe ser mayor a 0.";
  }

  if (!form.primaryColor) {
    errors.primaryColor = "Selecciona el color primario.";
  }

  if (!form.secondaryColor) {
    errors.secondaryColor = "Selecciona el color secundario.";
  }

  if (form.mapsLink.trim() && !isValidUrl(form.mapsLink.trim())) {
    errors.mapsLink = "Ingresa un enlace de mapas válido.";
  }

  return errors;
}

function validateStep2(form: EventDraft): FormErrors {
  const errors: FormErrors = {};

  if (form.sectores.length === 0) {
    errors.sectores = "Agrega al menos un sector.";
  }

  form.sectores.forEach((sector, index) => {
    const capacity = Number(sector.capacity);

    if (!sector.name.trim()) {
      errors[`sectores.${index}.name`] = "El nombre del sector es obligatorio.";
    }

    if (
      !sector.capacity ||
      !Number.isInteger(capacity) ||
      capacity <= 0
    ) {
      errors[`sectores.${index}.capacity`] =
        "La capacidad debe ser un número entero mayor a 0.";
    }
  });

  if (form.tandas.length === 0) {
    errors.tandas = "Agrega al menos una tanda.";
  }

  if (!form.date) {
    errors["tandas.general"] = "Define la fecha del evento en el Paso 1.";
  }

  form.tandas.forEach((tanda, index) => {
    if (!tanda.name.trim()) {
      errors[`tandas.${index}.name`] = "El nombre de la tanda es obligatorio.";
    }

    if (!tanda.startDate) {
      errors[`tandas.${index}.startDate`] =
        "La fecha de inicio de la tanda es obligatoria.";
    }

    if (!tanda.endDate) {
      errors[`tandas.${index}.endDate`] =
        "La fecha de fin de la tanda es obligatoria.";
    }

    if (
      tanda.startDate &&
      tanda.endDate &&
      tanda.startDate > tanda.endDate
    ) {
      errors[`tandas.${index}.endDate`] =
        "La fecha de fin no puede ser anterior a la fecha de inicio.";
    }

    if (form.date && tanda.startDate && tanda.startDate > form.date) {
      errors[`tandas.${index}.startDate`] =
        "La fecha de inicio no puede ser posterior a la fecha del evento.";
    }

    if (form.date && tanda.endDate && tanda.endDate > form.date) {
      errors[`tandas.${index}.endDate`] =
        "La fecha de fin no puede ser posterior a la fecha del evento.";
    }
  });

  return errors;
}

function validateStep3(form: EventDraft): FormErrors {
  const errors: FormErrors = {};
  const combinations = new Set<string>();
  const quantitiesBySector = new Map<number, number>();

  if (form.precios.length === 0) {
    errors.precios = "Agrega al menos un precio.";
  }

  form.precios.forEach((precio, index) => {
    const sectorId = precio.sectorId === "" ? null : Number(precio.sectorId);
    const batchId = precio.batchId === "" ? null : Number(precio.batchId);
    const price = Number(precio.price);
    const quantity = Number(precio.quantity);

    if (sectorId === null || !form.sectores[sectorId]) {
      errors[`precios.${index}.sectorId`] = "Selecciona un sector.";
    }

    if (batchId === null || !form.tandas[batchId]) {
      errors[`precios.${index}.batchId`] = "Selecciona una tanda.";
    }

    if (!precio.price || !Number.isFinite(price) || price <= 0) {
      errors[`precios.${index}.price`] =
        "El precio debe ser un número mayor a 0.";
    }

    if (
      !precio.quantity ||
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      errors[`precios.${index}.quantity`] =
        "La cantidad debe ser un número entero mayor a 0.";
    }

    if (sectorId !== null && batchId !== null) {
      const combination = `${sectorId}-${batchId}`;

      if (combinations.has(combination)) {
        errors[`precios.${index}.batchId`] =
          "Ya existe un precio para este sector y esta tanda.";
      }

      combinations.add(combination);

      if (
        Number.isInteger(quantity) &&
        quantity > 0 &&
        form.sectores[sectorId]
      ) {
        quantitiesBySector.set(
          sectorId,
          (quantitiesBySector.get(sectorId) ?? 0) + quantity,
        );
      }
    }
  });

  quantitiesBySector.forEach((quantity, sectorIndex) => {
    const sector = form.sectores[sectorIndex];
    const capacity = Number(sector?.capacity ?? 0);

    if (quantity > capacity) {
      errors[`precios.sector.${sectorIndex}`] =
        `La cantidad total de "${sector?.name || `Sector ${sectorIndex + 1}`}" (${quantity}) supera su capacidad (${capacity}).`;
    }
  });

  return errors;
}

function buildPayload(form: EventDraft): EventPayload {
  return {
    categoryId: Number(form.categoryId),
    name: form.name.trim(),
    visibleStart: form.visibleStart,
    description: form.description.trim(),
    date: form.date,
    kickOffTime: normalizeTime(form.kickOffTime),
    ticketsPerPersonLimit: Number(form.ticketsPerPersonLimit),
    primaryColor: form.primaryColor,
    secondaryColor: form.secondaryColor,
    mapsLink: form.mapsLink.trim(),
    sectores: form.sectores.map((sector) => ({
      eventId: 0,
      name: sector.name.trim(),
      capacity: Number(sector.capacity),
    })),
    tandas: form.tandas.map((tanda) => ({
      eventId: 0,
      name: tanda.name.trim(),
      startDate: tanda.startDate,
      endDate: tanda.endDate,
    })),
    precios: form.precios.map((precio) => ({
      sectorId: Number(precio.sectorId),
      batchId: Number(precio.batchId),
      price: Number(precio.price),
      quantity: Number(precio.quantity),
    })),
  };
}

function remapPriceIndexes(
  prices: PrecioDraft[],
  field: "sectorId" | "batchId",
  removedIndex: number,
): PrecioDraft[] {
  return prices
    .filter((price) => price[field] === "" || Number(price[field]) !== removedIndex)
    .map((price) => {
      if (price[field] === "" || Number(price[field]) <= removedIndex) {
        return price;
      }

      return { ...price, [field]: String(Number(price[field]) - 1) };
    });
}

export default function EventCreate() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<EventDraft>(createInitialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearErrors = () => {
    setErrors((current) => (Object.keys(current).length === 0 ? current : {}));
  };

  const updateBasicField = (field: BasicField, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    clearErrors();
  };

  const addSector = () => {
    setForm((current) => ({
      ...current,
      sectores: [
        ...current.sectores,
        { eventId: 0, name: "", capacity: "" },
      ],
    }));
    clearErrors();
  };

  const updateSector = (
    index: number,
    field: "name" | "capacity",
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      sectores: current.sectores.map((sector, sectorIndex) =>
        sectorIndex === index ? { ...sector, [field]: value } : sector,
      ),
    }));
    clearErrors();
  };

  const removeSector = (index: number) => {
    setForm((current) => ({
      ...current,
      sectores: current.sectores.filter((_, sectorIndex) => sectorIndex !== index),
      precios: remapPriceIndexes(current.precios, "sectorId", index),
    }));
    clearErrors();
  };

  const addTanda = () => {
    setForm((current) => ({
      ...current,
      tandas: [
        ...current.tandas,
        { eventId: 0, name: "", startDate: "", endDate: "" },
      ],
    }));
    clearErrors();
  };

  const updateTanda = (
    index: number,
    field: "name" | "startDate" | "endDate",
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      tandas: current.tandas.map((tanda, tandaIndex) =>
        tandaIndex === index ? { ...tanda, [field]: value } : tanda,
      ),
    }));
    clearErrors();
  };

  const removeTanda = (index: number) => {
    setForm((current) => ({
      ...current,
      tandas: current.tandas.filter((_, tandaIndex) => tandaIndex !== index),
      precios: remapPriceIndexes(current.precios, "batchId", index),
    }));
    clearErrors();
  };

  const addPrecio = () => {
    setForm((current) => ({
      ...current,
      precios: [
        ...current.precios,
        { sectorId: "", batchId: "", price: "", quantity: "" },
      ],
    }));
    clearErrors();
  };

  const updatePrecio = (
    index: number,
    field: keyof PrecioDraft,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      precios: current.precios.map((precio, priceIndex) =>
        priceIndex === index ? { ...precio, [field]: value } : precio,
      ),
    }));
    clearErrors();
  };

  const removePrecio = (index: number) => {
    setForm((current) => ({
      ...current,
      precios: current.precios.filter((_, priceIndex) => priceIndex !== index),
    }));
    clearErrors();
  };

  const notifyValidationError = () => {
    toaster.create({
      title: "Revisa el formulario",
      description: "Completa o corrige los campos marcados.",
      type: "warning",
    });
  };

  const handleNext = () => {
    const stepErrors = step === 0 ? validateStep1(form) : validateStep2(form);
    setErrors(stepErrors);

    if (Object.keys(stepErrors).length > 0) {
      notifyValidationError();
      return;
    }

    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setErrors({});
    setStep((current) => Math.max(current - 1, 0));
  };

  const handleFinalSubmit = async () => {
    const stepErrors = validateStep3(form);
    setErrors(stepErrors);

    if (Object.keys(stepErrors).length > 0) {
      notifyValidationError();
      return;
    }

    setIsSubmitting(true);

    try {
      const token = useAuthStore.getState().token;

      await axios.post(
        `${import.meta.env.VITE_EVENT_URL}/api/event`,
        buildPayload(form),
        {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        },
      );

      toaster.create({
        title: "Evento creado",
        description: "El evento se creó correctamente.",
        type: "success",
      });

      setForm(createInitialForm());
      setStep(0);
      setErrors({});
      navigate("/dash");
    } catch (error) {
      toaster.create({
        title: "No se pudo crear el evento",
        description: getErrorMessage(error, "No se pudo crear el evento."),
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (step < STEPS.length - 1) {
      handleNext();
      return;
    }

    void handleFinalSubmit();
  };

  return (
    <Box
      bg="bg.panel"
      borderColor="border"
      borderWidth="1px"
      className="modal-content"
      color="fg"
      p={{ base: "4", md: "8" }}
      shadow="lg"
    >
      <Stack gap="8">
        <Box>
          <Heading color="fg" size="xl">
            Crear un nuevo evento
          </Heading>
          <Text color="fg.muted" fontSize="sm" mt="1">
            Completa los datos en tres pasos. Podrás revisar y corregir la
            información antes de crear el evento.
          </Text>
        </Box>

        <Steps.Root
          count={STEPS.length}
          linear={false}
          onStepChange={(details) => setStep(details.step)}
          step={step}
        >
          <Steps.List mb="8">
            {STEPS.map((item, index) => (
              <Steps.Item key={item.title} index={index} title={item.title}>
                <Steps.Indicator>
                  <Steps.Status
                    complete={<FiCheck />}
                    incomplete={<Steps.Number />}
                  />
                </Steps.Indicator>
                <Box>
                  <Steps.Title>{item.title}</Steps.Title>
                  <Steps.Description>{item.description}</Steps.Description>
                </Box>
                <Steps.Separator />
              </Steps.Item>
            ))}
          </Steps.List>

          <form noValidate onSubmit={handleFormSubmit}>
            <Steps.Content index={0}>
              <SimpleGrid columns={{ base: 1, md: 2 }} gap="5">
                <Field.Root invalid={Boolean(errors.categoryId)} required>
                  <Field.Label>ID de categoría</Field.Label>
                  <Input
                    min="1"
                    placeholder="Ej. 1"
                    type="number"
                    value={form.categoryId}
                    onChange={(event) =>
                      updateBasicField("categoryId", event.target.value)
                    }
                  />
                  {errors.categoryId && (
                    <Field.ErrorText>{errors.categoryId}</Field.ErrorText>
                  )}
                </Field.Root>

                <Field.Root invalid={Boolean(errors.name)} required>
                  <Field.Label>Nombre del evento</Field.Label>
                  <Input
                    placeholder="Ej. Iron Maiden - The Future Past Tour"
                    value={form.name}
                    onChange={(event) =>
                      updateBasicField("name", event.target.value)
                    }
                  />
                  {errors.name && (
                    <Field.ErrorText>{errors.name}</Field.ErrorText>
                  )}
                </Field.Root>

                <Field.Root invalid={Boolean(errors.visibleStart)} required>
                  <Field.Label>Inicio de visibilidad</Field.Label>
                  <Input
                    type="date"
                    value={form.visibleStart}
                    onChange={(event) =>
                      updateBasicField("visibleStart", event.target.value)
                    }
                  />
                  {errors.visibleStart && (
                    <Field.ErrorText>{errors.visibleStart}</Field.ErrorText>
                  )}
                </Field.Root>

                <Field.Root invalid={Boolean(errors.date)} required>
                  <Field.Label>Fecha del evento</Field.Label>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(event) =>
                      updateBasicField("date", event.target.value)
                    }
                  />
                  {errors.date && (
                    <Field.ErrorText>{errors.date}</Field.ErrorText>
                  )}
                </Field.Root>

                <Field.Root invalid={Boolean(errors.kickOffTime)} required>
                  <Field.Label>Hora de inicio</Field.Label>
                  <Input
                    type="time"
                    value={form.kickOffTime}
                    onChange={(event) =>
                      updateBasicField("kickOffTime", event.target.value)
                    }
                  />
                  {errors.kickOffTime && (
                    <Field.ErrorText>{errors.kickOffTime}</Field.ErrorText>
                  )}
                </Field.Root>

                <Field.Root
                  invalid={Boolean(errors.ticketsPerPersonLimit)}
                  required
                >
                  <Field.Label>Límite de tickets por persona</Field.Label>
                  <Input
                    min="1"
                    placeholder="Ej. 4"
                    type="number"
                    value={form.ticketsPerPersonLimit}
                    onChange={(event) =>
                      updateBasicField(
                        "ticketsPerPersonLimit",
                        event.target.value,
                      )
                    }
                  />
                  {errors.ticketsPerPersonLimit && (
                    <Field.ErrorText>
                      {errors.ticketsPerPersonLimit}
                    </Field.ErrorText>
                  )}
                </Field.Root>

                <Field.Root invalid={Boolean(errors.primaryColor)} required>
                  <Field.Label>Color primario</Field.Label>
                  <Input
                    h="10"
                    p="1"
                    type="color"
                    value={form.primaryColor}
                    onChange={(event) =>
                      updateBasicField("primaryColor", event.target.value)
                    }
                  />
                  {errors.primaryColor && (
                    <Field.ErrorText>{errors.primaryColor}</Field.ErrorText>
                  )}
                </Field.Root>

                <Field.Root invalid={Boolean(errors.secondaryColor)} required>
                  <Field.Label>Color secundario</Field.Label>
                  <Input
                    h="10"
                    p="1"
                    type="color"
                    value={form.secondaryColor}
                    onChange={(event) =>
                      updateBasicField("secondaryColor", event.target.value)
                    }
                  />
                  {errors.secondaryColor && (
                    <Field.ErrorText>{errors.secondaryColor}</Field.ErrorText>
                  )}
                </Field.Root>

                <Field.Root gridColumn="1 / -1">
                  <Field.Label>Descripción</Field.Label>
                  <Textarea
                    minH="28"
                    placeholder="Describe el evento..."
                    value={form.description}
                    onChange={(event) =>
                      updateBasicField("description", event.target.value)
                    }
                  />
                </Field.Root>

                <Field.Root
                  gridColumn="1 / -1"
                  invalid={Boolean(errors.mapsLink)}
                >
                  <Field.Label>Enlace de mapas</Field.Label>
                  <Input
                    placeholder="https://maps.app.goo.gl/..."
                    type="url"
                    value={form.mapsLink}
                    onChange={(event) =>
                      updateBasicField("mapsLink", event.target.value)
                    }
                  />
                  {errors.mapsLink && (
                    <Field.ErrorText>{errors.mapsLink}</Field.ErrorText>
                  )}
                </Field.Root>
              </SimpleGrid>
            </Steps.Content>

            <Steps.Content index={1}>
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
                      onClick={addSector}
                      size="sm"
                      type="button"
                    >
                      <FiPlus /> Agregar sector
                    </Button>
                  </Flex>

                  {errors.sectores && (
                    <Text color={{ base: "red.500", _dark: "red.400" }} fontSize="sm" mb="3">
                      {errors.sectores}
                    </Text>
                  )}

                  <Stack gap="4">
                    {form.sectores.map((sector, index) => (
                      <Box
                        borderColor="border"
                        borderRadius="lg"
                        borderWidth="1px"
                        key={index}
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
                            <FiTrash2 /> Eliminar
                          </Button>
                        </Flex>

                        <SimpleGrid columns={{ base: 1, md: 2 }} gap="4">
                          <Field.Root
                            invalid={Boolean(errors[`sectores.${index}.name`])}
                            required
                          >
                            <Field.Label>Nombre del sector</Field.Label>
                            <Input
                              placeholder="Ej. Campo VIP"
                              value={sector.name}
                              onChange={(event) =>
                                updateSector(index, "name", event.target.value)
                              }
                            />
                            {errors[`sectores.${index}.name`] && (
                              <Field.ErrorText>
                                {errors[`sectores.${index}.name`]}
                              </Field.ErrorText>
                            )}
                          </Field.Root>

                          <Field.Root
                            invalid={Boolean(
                              errors[`sectores.${index}.capacity`],
                            )}
                            required
                          >
                            <Field.Label>Capacidad</Field.Label>
                            <Input
                              min="1"
                              placeholder="Ej. 3000"
                              type="number"
                              value={sector.capacity}
                              onChange={(event) =>
                                updateSector(
                                  index,
                                  "capacity",
                                  event.target.value,
                                )
                              }
                            />
                            {errors[`sectores.${index}.capacity`] && (
                              <Field.ErrorText>
                                {errors[`sectores.${index}.capacity`]}
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
                      onClick={addTanda}
                      size="sm"
                      type="button"
                    >
                      <FiPlus /> Agregar tanda
                    </Button>
                  </Flex>

                  {errors.tandas && (
                    <Text color={{ base: "red.500", _dark: "red.400" }} fontSize="sm" mb="3">
                      {errors.tandas}
                    </Text>
                  )}

                  {errors["tandas.general"] && (
                    <Text color={{ base: "red.500", _dark: "red.400" }} fontSize="sm" mb="3">
                      {errors["tandas.general"]}
                    </Text>
                  )}

                  <Stack gap="4">
                    {form.tandas.map((tanda, index) => (
                      <Box
                        borderColor="border"
                        borderRadius="lg"
                        borderWidth="1px"
                        key={index}
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
                            <FiTrash2 /> Eliminar
                          </Button>
                        </Flex>

                        <SimpleGrid columns={{ base: 1, md: 3 }} gap="4">
                          <Field.Root
                            invalid={Boolean(errors[`tandas.${index}.name`])}
                            required
                          >
                            <Field.Label>Nombre de la tanda</Field.Label>
                            <Input
                              placeholder="Ej. Preventa Early Bird"
                              value={tanda.name}
                              onChange={(event) =>
                                updateTanda(index, "name", event.target.value)
                              }
                            />
                            {errors[`tandas.${index}.name`] && (
                              <Field.ErrorText>
                                {errors[`tandas.${index}.name`]}
                              </Field.ErrorText>
                            )}
                          </Field.Root>

                          <Field.Root
                            invalid={Boolean(
                              errors[`tandas.${index}.startDate`],
                            )}
                            required
                          >
                            <Field.Label>Fecha de inicio</Field.Label>
                            <Input
                              type="date"
                              value={tanda.startDate}
                              onChange={(event) =>
                                updateTanda(
                                  index,
                                  "startDate",
                                  event.target.value,
                                )
                              }
                            />
                            {errors[`tandas.${index}.startDate`] && (
                              <Field.ErrorText>
                                {errors[`tandas.${index}.startDate`]}
                              </Field.ErrorText>
                            )}
                          </Field.Root>

                          <Field.Root
                            invalid={Boolean(errors[`tandas.${index}.endDate`])}
                            required
                          >
                            <Field.Label>Fecha de fin</Field.Label>
                            <Input
                              type="date"
                              value={tanda.endDate}
                              onChange={(event) =>
                                updateTanda(
                                  index,
                                  "endDate",
                                  event.target.value,
                                )
                              }
                            />
                            {errors[`tandas.${index}.endDate`] && (
                              <Field.ErrorText>
                                {errors[`tandas.${index}.endDate`]}
                              </Field.ErrorText>
                            )}
                          </Field.Root>
                        </SimpleGrid>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </Stack>
            </Steps.Content>

            <Steps.Content index={2}>
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
                    onClick={addPrecio}
                    size="sm"
                    type="button"
                  >
                    <FiPlus /> Agregar precio
                  </Button>
                </Flex>

                {errors.precios && (
                  <Text color={{ base: "red.500", _dark: "red.400" }} fontSize="sm">
                    {errors.precios}
                  </Text>
                )}

                {form.precios.length === 0 && (
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
                  {form.precios.map((precio, index) => (
                    <Box
                      borderColor="border"
                      borderRadius="lg"
                      borderWidth="1px"
                      key={index}
                      p="4"
                    >
                      <Flex align="center" justify="space-between" mb="3">
                        <Text color="fg" fontSize="sm" fontWeight="semibold">
                          Precio {index + 1}
                        </Text>
                        <Button
                          colorPalette="red"
                          onClick={() => removePrecio(index)}
                          size="xs"
                          type="button"
                          variant="ghost"
                        >
                          <FiTrash2 /> Eliminar
                        </Button>
                      </Flex>

                      <SimpleGrid
                        columns={{ base: 1, md: 2, lg: 4 }}
                        gap="4"
                      >
                        <Field.Root
                          invalid={Boolean(errors[`precios.${index}.sectorId`])}
                          required
                        >
                          <Field.Label>Sector</Field.Label>
                          <NativeSelect.Root>
                            <NativeSelect.Field
                              value={precio.sectorId}
                              onChange={(event) =>
                                updatePrecio(
                                  index,
                                  "sectorId",
                                  event.target.value,
                                )
                              }
                            >
                              <option value="">Selecciona un sector</option>
                              {form.sectores.map((sector, sectorIndex) => (
                                <option key={sectorIndex} value={sectorIndex}>
                                  {sector.name || `Sector ${sectorIndex + 1}`}
                                </option>
                              ))}
                            </NativeSelect.Field>
                            <NativeSelect.Indicator />
                          </NativeSelect.Root>
                          {errors[`precios.${index}.sectorId`] && (
                            <Field.ErrorText>
                              {errors[`precios.${index}.sectorId`]}
                            </Field.ErrorText>
                          )}
                        </Field.Root>

                        <Field.Root
                          invalid={Boolean(errors[`precios.${index}.batchId`])}
                          required
                        >
                          <Field.Label>Tanda</Field.Label>
                          <NativeSelect.Root>
                            <NativeSelect.Field
                              value={precio.batchId}
                              onChange={(event) =>
                                updatePrecio(
                                  index,
                                  "batchId",
                                  event.target.value,
                                )
                              }
                            >
                              <option value="">Selecciona una tanda</option>
                              {form.tandas.map((tanda, tandaIndex) => (
                                <option key={tandaIndex} value={tandaIndex}>
                                  {tanda.name || `Tanda ${tandaIndex + 1}`}
                                </option>
                              ))}
                            </NativeSelect.Field>
                            <NativeSelect.Indicator />
                          </NativeSelect.Root>
                          {errors[`precios.${index}.batchId`] && (
                            <Field.ErrorText>
                              {errors[`precios.${index}.batchId`]}
                            </Field.ErrorText>
                          )}
                        </Field.Root>

                        <Field.Root
                          invalid={Boolean(errors[`precios.${index}.price`])}
                          required
                        >
                          <Field.Label>Precio</Field.Label>
                          <Input
                            min="1"
                            placeholder="Ej. 650000"
                            type="number"
                            value={precio.price}
                            onChange={(event) =>
                              updatePrecio(index, "price", event.target.value)
                            }
                          />
                          {errors[`precios.${index}.price`] && (
                            <Field.ErrorText>
                              {errors[`precios.${index}.price`]}
                            </Field.ErrorText>
                          )}
                        </Field.Root>

                        <Field.Root
                          invalid={Boolean(errors[`precios.${index}.quantity`])}
                          required
                        >
                          <Field.Label>Cantidad</Field.Label>
                          <Input
                            min="1"
                            placeholder="Ej. 1000"
                            type="number"
                            value={precio.quantity}
                            onChange={(event) =>
                              updatePrecio(
                                index,
                                "quantity",
                                event.target.value,
                              )
                            }
                          />
                          {errors[`precios.${index}.quantity`] && (
                            <Field.ErrorText>
                              {errors[`precios.${index}.quantity`]}
                            </Field.ErrorText>
                          )}
                        </Field.Root>
                      </SimpleGrid>
                    </Box>
                  ))}
                </Stack>

                {form.sectores.map((_, index) => {
                  const sectorError = errors[`precios.sector.${index}`];

                  if (!sectorError) {
                    return null;
                  }

                  return (
                    <Text color={{ base: "red.500", _dark: "red.400" }} fontSize="sm" key={index}>
                      {sectorError}
                    </Text>
                  );
                })}
              </Stack>
            </Steps.Content>

            <Flex
              align="center"
              justify="space-between"
              mt="8"
              pt="5"
              borderTopColor="border"
              borderTopWidth="1px"
            >
              <Button
                disabled={step === 0 || isSubmitting}
                onClick={handleBack}
                type="button"
                variant="outline"
              >
                <FiArrowLeft /> Anterior
              </Button>

              {step < STEPS.length - 1 ? (
                <Button colorPalette="brand" type="submit">
                  Siguiente <FiArrowRight />
                </Button>
              ) : (
                <Button
                  colorPalette="brand"
                  loading={isSubmitting}
                  loadingText="Creando evento..."
                  type="submit"
                >
                  <FiCheck /> Crear evento
                </Button>
              )}
            </Flex>
          </form>
        </Steps.Root>
      </Stack>
    </Box>
  );
}
