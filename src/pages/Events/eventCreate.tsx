import { Box, Button, Flex, Heading, Stack, Steps, Text } from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { FormProvider, useForm, type FieldPath } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toaster } from "../../components/ui/chakra-base/toaster-instance";
import { useCreateEventMutation } from "../../queries/events.queries";
import {
  eventBaseSchema,
  validateStep2,
  validateStep3,
} from "../../schemas/event.schema";
import type { EventDraft, FormErrors } from "../../types/event.types";
import { getErrorMessage } from "../../utils/error";
import { buildPayload, createInitialForm } from "../../utils/eventForm";
import { BasicInfoStep } from "./steps/BasicInfoStep";
import { PricingStep } from "./steps/PricingStep";
import { StructureStep } from "./steps/StructureStep";
import { collectGlobalErrors } from "./wizardErrors";
import "../../styles/EventsCreate/event.css";

const STEPS = [
  { title: "Datos básicos", description: "Información general del evento" },
  { title: "Estructura", description: "Sectores y tandas" },
  { title: "Precios", description: "Precios por sector y tanda" },
];

const STEP1_FIELDS: FieldPath<EventDraft>[] = [
  "categoryId",
  "name",
  "visibleStart",
  "description",
  "date",
  "kickOffTime",
  "ticketsPerPersonLimit",
  "primaryColor",
  "secondaryColor",
  "mapsLink",
];

export default function EventCreate() {
  const navigate = useNavigate();
  const createEventMutation = useCreateEvent();
  const [step, setStep] = useState(0);
  const [globalErrors, setGlobalErrors] = useState<FormErrors>({});

  const methods = useForm<EventDraft>({
    resolver: zodResolver(eventBaseSchema),
    defaultValues: createInitialForm(),
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldUnregister: false,
  });

  const { clearErrors, getValues, reset, setError, trigger } = methods;
  const isSubmitting = createEventMutation.isPending;

  const notifyValidationError = () => {
    toaster.create({
      title: "Revisa el formulario",
      description: "Completa o corrige los campos marcados.",
      type: "warning",
    });
  };

  const applyValidationErrors = (validationErrors: FormErrors) => {
    const nextGlobalErrors: FormErrors = {};

    Object.entries(validationErrors).forEach(([path, message]) => {
      if (path === "tandas.general" || path.startsWith("precios.sector.")) {
        nextGlobalErrors[path] = message;
        return;
      }

      setError(path as FieldPath<EventDraft>, { type: "manual", message });
    });

    setGlobalErrors(nextGlobalErrors);
  };

  const validateStepAt = async (index: number): Promise<boolean> => {
    clearErrors();
    setGlobalErrors({});

    if (index === 0) {
      const isValid = await trigger(STEP1_FIELDS, { shouldFocus: true });

      if (!isValid) {
        notifyValidationError();
      }

      return isValid;
    }

    const validationErrors =
      index === 1 ? validateStep2(getValues()) : validateStep3(getValues());

    if (Object.keys(validationErrors).length > 0) {
      applyValidationErrors(validationErrors);
      notifyValidationError();
      return false;
    }

    return true;
  };

  const handleStepChange = async (nextStep: number) => {
    if (nextStep <= step) {
      clearErrors();
      setGlobalErrors({});
      setStep(nextStep);
      return;
    }

    for (let index = step; index < nextStep; index += 1) {
      const isValid = await validateStepAt(index);

      if (!isValid) {
        setStep(index);
        return;
      }
    }

    setStep(nextStep);
  };

  const handleNext = async () => {
    const isValid = await validateStepAt(step);

    if (isValid) {
      setStep((current) => Math.min(current + 1, STEPS.length - 1));
    }
  };

  const handleBack = () => {
    clearErrors();
    setGlobalErrors({});
    setStep((current) => Math.max(current - 1, 0));
  };

  const handleFinalSubmit = async () => {
    clearErrors();
    setGlobalErrors({});

    const validationErrors = validateStep3(getValues());

    if (Object.keys(validationErrors).length > 0) {
      applyValidationErrors(validationErrors);
      notifyValidationError();
      return;
    }

    try {
      await createEventMutation.mutateAsync(buildPayload(getValues()));

      toaster.create({
        title: "Evento creado",
        description: "El evento se creó correctamente.",
        type: "success",
      });

      reset(createInitialForm());
      setStep(0);
      setGlobalErrors({});
      navigate("/dash");
    } catch (error) {
      toaster.create({
        title: "No se pudo crear el evento",
        description: getErrorMessage(error, "No se pudo crear el evento."),
        type: "error",
      });
    }
  };

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (step < STEPS.length - 1) {
      void handleNext();
      return;
    }

    void handleFinalSubmit();
  };

  return (
    <FormProvider {...methods}>
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
            onStepChange={({ step: nextStep }) => {
              void handleStepChange(nextStep);
            }}
            step={step}
          >
            <Steps.List mb="8">
              {STEPS.map((item, index) => (
                <Steps.Item key={item.title} index={index} title={item.title}>
                  <Steps.Indicator>
                    <Steps.Status
                      complete={<Check />}
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
                <BasicInfoStep />
              </Steps.Content>

              <Steps.Content index={1}>
                <StructureStep generalError={globalErrors["tandas.general"]} />
              </Steps.Content>

              <Steps.Content index={2}>
                <PricingStep
                  sectorCapacityErrors={collectGlobalErrors(
                    globalErrors,
                    "precios.sector.",
                  )}
                />
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
                  <ArrowLeft /> Anterior
                </Button>

                {step < STEPS.length - 1 ? (
                  <Button colorPalette="brand" type="submit">
                    Siguiente <ArrowRight />
                  </Button>
                ) : (
                  <Button
                    colorPalette="brand"
                    loading={isSubmitting}
                    loadingText="Creando evento..."
                    type="submit"
                  >
                    <Check /> Crear evento
                  </Button>
                )}
              </Flex>
            </form>
          </Steps.Root>
        </Stack>
      </Box>
    </FormProvider>
  );
}
