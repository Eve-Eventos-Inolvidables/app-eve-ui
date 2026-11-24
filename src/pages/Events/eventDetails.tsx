import {
  Badge,
  Box,
  Button,
  Dialog,
  Flex,
  Heading,
  Link,
  Portal,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, MapPin, Minus, Plus, Ticket } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useEventByIdQuery,
  useEventCatalogStructureQuery,
  useLookupPricesForEventMutation,
} from "../../queries/events.queries";
import {
  useCreateBuyMutation,
  useTicketsByBuyQuery,
} from "../../queries/sales.queries";
import { useAuthStore } from "../../stores/auth.store";
import type {
  BatchDto,
  SectorByBatchDto,
  SectorDto,
} from "../../types/event.types";
import type { BuyDto } from "../../types/sales.types";
import {
  formatEventDate,
  formatPrice,
  getHttpUrl,
  getSafeEventColor,
  getTodayDateValue,
} from "../../utils/eventFormatting";
import { getErrorMessage } from "../../utils/error";

interface EventPriceRow {
  batch: BatchDto;
  price: SectorByBatchDto;
}

interface EventSectorGroup {
  sector: SectorDto;
  prices: EventPriceRow[];
}

interface SelectedPriceOption extends EventPriceRow {
  sector: SectorDto;
  quantity: number;
  unitPrice: number;
}

interface TicketDisplayDetails {
  sectorName: string;
  batchName: string;
}

function getBatchStatus(batch: BatchDto): {
  label: string;
  colorPalette: "blue" | "green" | "gray";
} {
  const today = getTodayDateValue();

  if (today < batch.startDate) {
    return { label: "Próxima", colorPalette: "blue" };
  }

  if (today > batch.endDate) {
    return { label: "Finalizada", colorPalette: "gray" };
  }

  return { label: "En curso", colorPalette: "green" };
}

function buildSectorGroups(
  eventId: number,
  sectors: SectorDto[],
  batches: BatchDto[],
  prices: SectorByBatchDto[],
): EventSectorGroup[] {
  const eventSectors = sectors
    .filter((sector) => sector.eventId === eventId && !sector.archived)
    .sort((left, right) =>
      left.name.localeCompare(right.name, "es", { sensitivity: "base" }),
    );
  const eventBatches = batches
    .filter((batch) => batch.eventId === eventId && !batch.archived)
    .sort((left, right) => left.startDate.localeCompare(right.startDate));
  const sectorIds = new Set(eventSectors.map((sector) => sector.id));
  const batchesById = new Map(eventBatches.map((batch) => [batch.id, batch]));

  return eventSectors.map((sector) => ({
    sector,
    prices: prices
      .filter(
        (price) =>
          !price.archived &&
          price.sectorId === sector.id &&
          sectorIds.has(price.sectorId) &&
          batchesById.has(price.batchId),
      )
      .map((price) => ({
        batch: batchesById.get(price.batchId)!,
        price,
      }))
      .sort((left, right) =>
        left.batch.startDate.localeCompare(right.batch.startDate),
      ),
  }));
}

function EventInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <Box>
      <Text
        color="fg.muted"
        fontSize="xs"
        fontWeight="semibold"
        textTransform="uppercase"
      >
        {label}
      </Text>
      <Text color="fg" fontWeight="medium" mt="1">
        {value}
      </Text>
    </Box>
  );
}

export default function EventDetails() {
  const { eventId: eventIdParam } = useParams();
  const navigate = useNavigate();
  const eventId = Number(eventIdParam);
  const isValidId = Number.isSafeInteger(eventId) && eventId > 0;
  const user = useAuthStore((state) => state.user);
  const isClient =
    (user?.roleName ?? "").trim().replace(/^ROLE_/i, "").toLowerCase() ===
    "cliente";

  const eventQuery = useEventByIdQuery(eventId, isValidId);
  const structureQuery = useEventCatalogStructureQuery(
    isValidId && eventQuery.isSuccess,
  );
  const lookupPricesMutation = useLookupPricesForEventMutation();
  const createBuyMutation = useCreateBuyMutation();
  const [selectedQuantities, setSelectedQuantities] = useState<
    Record<number, number>
  >({});
  const [reviewedPrices, setReviewedPrices] =
    useState<SectorByBatchDto[] | null>(null);
  const [isPurchaseConfirmOpen, setIsPurchaseConfirmOpen] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [completedBuy, setCompletedBuy] = useState<BuyDto | null>(null);
  const event = eventQuery.data;
  const ticketsQuery = useTicketsByBuyQuery(
    completedBuy?.id ?? 0,
    Boolean(completedBuy),
  );

  const sectorGroups = useMemo(() => {
    if (!event || !structureQuery.data) {
      return [];
    }

    return buildSectorGroups(
      event.id,
      structureQuery.data.sectors,
      structureQuery.data.batches,
      structureQuery.data.prices,
    );
  }, [event, structureQuery.data]);
  const reviewedPricesById = useMemo(
    () => new Map((reviewedPrices ?? []).map((price) => [price.id, price])),
    [reviewedPrices],
  );
  const selectedItems = useMemo<SelectedPriceOption[]>(
    () =>
      sectorGroups.flatMap(({ sector, prices }) =>
        prices.flatMap(({ batch, price }) => {
          const quantity = selectedQuantities[price.id] ?? 0;
          if (quantity <= 0) {
            return [];
          }

          return [
            {
              sector,
              batch,
              price,
              quantity,
              unitPrice: reviewedPricesById.get(price.id)?.price ?? price.price,
            },
          ];
        }),
      ),
    [reviewedPricesById, sectorGroups, selectedQuantities],
  );
  const selectedTicketCount = selectedItems.reduce(
    (total, item) => total + item.quantity,
    0,
  );
  const estimatedTotal = selectedItems.reduce(
    (total, item) => total + item.unitPrice * item.quantity,
    0,
  );
  const priceDetailsById = useMemo(() => {
    const details = new Map<number, TicketDisplayDetails>();
    for (const { sector, prices } of sectorGroups) {
      for (const { batch, price } of prices) {
        details.set(price.id, {
          sectorName: sector.name,
          batchName: batch.name,
        });
      }
    }
    return details;
  }, [sectorGroups]);
  const isPastEvent = event ? event.date < getTodayDateValue() : false;
  const isVisibleForPurchase =
    event !== undefined && event.visibleStart <= getTodayDateValue();
  const canPurchase =
    isClient &&
    Boolean(user && user.id > 0) &&
    !isPastEvent &&
    isVisibleForPurchase &&
    !completedBuy;

  const updateOptionQuantity = (priceId: number, requestedQuantity: number) => {
    const option = sectorGroups
      .flatMap((group) => group.prices)
      .find(({ price }) => price.id === priceId);
    const configuredQuantity = Math.max(
      0,
      Math.floor(option?.price.quantity ?? 0),
    );

    setSelectedQuantities((current) => {
      const otherTickets = Object.entries(current).reduce(
        (total, [id, quantity]) =>
          Number(id) === priceId ? total : total + quantity,
        0,
      );
      const eventLimit = event?.ticketsPerPersonLimit ?? 0;
      const maxForOption = Math.max(
        0,
        Math.min(configuredQuantity, eventLimit - otherTickets),
      );
      const quantity = Math.min(
        maxForOption,
        Math.max(0, Math.floor(requestedQuantity)),
      );
      const next = { ...current };

      if (quantity === 0) {
        delete next[priceId];
      } else {
        next[priceId] = quantity;
      }

      return next;
    });
    setReviewedPrices(null);
    setReviewError(null);
    setPurchaseError(null);
  };

  const handleReviewPurchase = async () => {
    if (!event || selectedItems.length === 0) {
      return;
    }

    setReviewError(null);
    setPurchaseError(null);

    try {
      const prices = await lookupPricesMutation.mutateAsync({
        eventId: event.id,
        sectorByBatchIds: selectedItems.map(({ price }) => price.id),
      });
      const returnedIds = new Set(prices.map((price) => price.id));
      const missingId = selectedItems.find(
        ({ price }) => !returnedIds.has(price.id),
      );

      if (missingId) {
        throw new Error(
          "Uno de los precios cambió o ya no está disponible. Actualiza la página e inténtalo otra vez.",
        );
      }

      setReviewedPrices(prices);
      setIsPurchaseConfirmOpen(true);
    } catch (error) {
      setReviewError(
        getErrorMessage(
          error,
          "No se pudieron verificar los precios actuales.",
        ),
      );
    }
  };

  const handleCreatePurchase = async () => {
    if (
      createBuyMutation.isPending ||
      !event ||
      !user ||
      user.id <= 0 ||
      selectedItems.length === 0
    ) {
      return;
    }

    setPurchaseError(null);

    try {
      const buy = await createBuyMutation.mutateAsync({
        eventId: event.id,
        userId: user.id,
        sectorByBatchIds: selectedItems.flatMap(({ price, quantity }) =>
          Array.from({ length: quantity }, () => price.id),
        ),
      });

      setCompletedBuy(buy);
      setSelectedQuantities({});
      setReviewedPrices(null);
      setIsPurchaseConfirmOpen(false);
    } catch (error) {
      setPurchaseError(
        getErrorMessage(error, "No se pudo registrar la compra."),
      );
    }
  };

  const handlePurchaseDialogChange = (open: boolean) => {
    if (createBuyMutation.isPending) {
      return;
    }

    setIsPurchaseConfirmOpen(open);
  };

  if (!isValidId) {
    return (
      <Stack align="center" gap="4" py="12" textAlign="center">
        <Heading size="lg">No se encontró el evento</Heading>
        <Button onClick={() => navigate("/events")} variant="outline">
          <ArrowLeft /> Volver a eventos
        </Button>
      </Stack>
    );
  }

  if (eventQuery.isPending) {
    return (
      <Flex align="center" color="fg.muted" gap="3" justify="center" py="16">
        <Spinner color="brand.solid" />
        Cargando evento...
      </Flex>
    );
  }

  if (eventQuery.isError || !event) {
    return (
      <Stack align="center" gap="4" py="12" textAlign="center">
        <Text color="fg.error">
          {getErrorMessage(eventQuery.error, "No se pudo cargar el evento.")}
        </Text>
        <Flex gap="3">
          <Button
            onClick={() => void eventQuery.refetch()}
            variant="outline"
          >
            Reintentar
          </Button>
          <Button onClick={() => navigate("/events")} variant="ghost">
            Volver a eventos
          </Button>
        </Flex>
      </Stack>
    );
  }

  const primaryColor = getSafeEventColor(event.primaryColor, "#10B981");
  const secondaryColor = getSafeEventColor(event.secondaryColor, "#E91E8C");
  const mapUrl = getHttpUrl(event.mapsLink);

  return (
    <Stack gap="6">
      <Button
        alignSelf="flex-start"
        onClick={() => navigate("/events")}
        size="sm"
        variant="ghost"
      >
        <ArrowLeft /> Todos los eventos
      </Button>

      <Box
        bg="bg.panel"
        borderColor="border"
        borderRadius="2xl"
        borderLeftWidth="6px"
        borderTopWidth="3px"
        p={{ base: "5", md: "8" }}
        shadow="sm"
        style={{
          borderLeftColor: primaryColor,
          borderTopColor: secondaryColor,
        }}
      >
        <Stack gap="5">
          <Flex align="center" gap="2" wrap="wrap">
            <Badge
              colorPalette={isPastEvent ? "gray" : "brand"}
              variant="subtle"
            >
              {isPastEvent ? "Evento finalizado" : "Evento"}
            </Badge>
            <Text color="fg.muted" fontSize="sm">
              #{event.id}
            </Text>
          </Flex>

          <Box>
            <Heading color="fg" size={{ base: "xl", md: "2xl" }}>
              {event.name}
            </Heading>
            {event.description?.trim() && (
              <Text color="fg.muted" mt="3" whiteSpace="pre-wrap">
                {event.description}
              </Text>
            )}
          </Box>

          <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap="5">
            <EventInfo
              label="Fecha"
              value={`${formatEventDate(event.date)}${event.kickOffTime ? ` · ${event.kickOffTime.slice(0, 5)}` : ""}`}
            />
            <EventInfo
              label="Visible desde"
              value={formatEventDate(event.visibleStart)}
            />
            <EventInfo
              label="Límite por persona"
              value={`${event.ticketsPerPersonLimit} entradas`}
            />
            {mapUrl ? (
              <Box>
                <Text
                  color="fg.muted"
                  fontSize="xs"
                  fontWeight="semibold"
                  textTransform="uppercase"
                >
                  Ubicación
                </Text>
                <Link
                  alignItems="center"
                  color="brand.fg"
                  display="inline-flex"
                  fontWeight="medium"
                  gap="1"
                  href={mapUrl}
                  mt="1"
                  rel="noreferrer"
                  target="_blank"
                >
                  <MapPin size={16} /> Ver mapa
                </Link>
              </Box>
            ) : (
              <EventInfo label="Ubicación" value="No especificada" />
            )}
          </SimpleGrid>
        </Stack>
      </Box>

      <Flex align="center" gap="2">
        <Ticket aria-hidden="true" color={primaryColor} />
        <Heading color="fg" size="lg">
          Sectores y precios
        </Heading>
      </Flex>

      {isClient && isPastEvent && (
        <Text color="fg.muted" fontSize="sm">
          Este evento ya finalizó; puedes consultar sus sectores y precios, pero
          la compra no está disponible.
        </Text>
      )}

      {isClient && !isPastEvent && !isVisibleForPurchase && (
        <Text color="fg.muted" fontSize="sm">
          La venta de entradas para este evento todavía no está habilitada.
        </Text>
      )}

      {structureQuery.isPending && (
        <Flex align="center" color="fg.muted" gap="3" justify="center" py="10">
          <Spinner color="brand.solid" />
          Cargando sectores y precios...
        </Flex>
      )}

      {structureQuery.isError && (
        <Box
          bg="bg.panel"
          borderColor="border"
          borderRadius="xl"
          borderWidth="1px"
          p="6"
          textAlign="center"
        >
          <Stack align="center" gap="3">
            <Text color="fg.error">
              {getErrorMessage(
                structureQuery.error,
                "No se pudieron cargar los sectores y precios.",
              )}
            </Text>
            <Button
              onClick={() => void structureQuery.refetch()}
              size="sm"
              variant="outline"
            >
              Reintentar
            </Button>
          </Stack>
        </Box>
      )}

      {!structureQuery.isPending &&
        !structureQuery.isError &&
        sectorGroups.length === 0 && (
          <Box
            bg="bg.panel"
            borderColor="border"
            borderRadius="xl"
            borderWidth="1px"
            p="6"
          >
            <Text fontWeight="semibold">Aún no hay sectores publicados.</Text>
            <Text color="fg.muted" fontSize="sm" mt="1">
              Vuelve a consultar más adelante para ver la información de acceso.
            </Text>
          </Box>
        )}

      {!structureQuery.isPending &&
        !structureQuery.isError &&
        sectorGroups.length > 0 && (
          <SimpleGrid columns={{ base: 1, lg: 2 }} gap="5">
            {sectorGroups.map(({ sector, prices }) => (
              <Box
                bg="bg.panel"
                borderColor="border"
                borderRadius="xl"
                borderWidth="1px"
                key={sector.id}
                p="5"
                style={{
                  borderLeftColor: secondaryColor,
                  borderLeftWidth: "4px",
                }}
              >
                <Flex align="flex-start" justify="space-between" gap="3">
                  <Box>
                    <Heading color="fg" size="md">
                      {sector.name}
                    </Heading>
                    <Text color="fg.muted" fontSize="sm" mt="1">
                      Capacidad: {sector.capacity}
                    </Text>
                  </Box>
                  <Badge colorPalette="brand" variant="subtle">
                    Sector
                  </Badge>
                </Flex>

                <Stack borderTopColor="border" borderTopWidth="1px" gap="3" mt="4" pt="4">
                  {prices.length === 0 ? (
                    <Text color="fg.muted" fontSize="sm">
                      Todavía no hay precios publicados para este sector.
                    </Text>
                  ) : (
                    prices.map(({ batch, price }) => {
                      const status = getBatchStatus(batch);
                      const quantity = selectedQuantities[price.id] ?? 0;
                      const canSelectThisOption =
                        canPurchase &&
                        !isPurchaseConfirmOpen &&
                        status.label === "En curso" &&
                        price.quantity > 0;
                      const maxForOption = Math.min(
                        price.quantity,
                        event.ticketsPerPersonLimit,
                      );

                      return (
                        <Box key={price.id}>
                          <Flex
                            align={{ base: "flex-start", sm: "center" }}
                            direction={{ base: "column", sm: "row" }}
                            gap="2"
                            justify="space-between"
                          >
                            <Box>
                              <Flex align="center" gap="2" wrap="wrap">
                                <Text color="fg" fontWeight="semibold">
                                  {batch.name}
                                </Text>
                                <Badge
                                  colorPalette={
                                    price.quantity > 0
                                      ? status.colorPalette
                                      : "gray"
                                  }
                                  variant="subtle"
                                >
                                  {price.quantity > 0
                                    ? status.label
                                    : "Sin cupos"}
                                </Badge>
                              </Flex>
                              <Text color="fg.muted" fontSize="sm" mt="1">
                                {formatEventDate(batch.startDate, {
                                  dateStyle: "medium",
                                })}{" "}
                                –{" "}
                                {formatEventDate(batch.endDate, {
                                  dateStyle: "medium",
                                })}
                              </Text>
                            </Box>
                            <Text
                              color="fg"
                              fontSize="lg"
                              fontWeight="bold"
                              whiteSpace="nowrap"
                            >
                              {formatPrice(
                                reviewedPricesById.get(price.id)?.price ??
                                  price.price,
                              )}
                            </Text>
                          </Flex>

                          {canPurchase && status.label === "En curso" && (
                            <Flex
                              align="center"
                              justify="space-between"
                              mt="3"
                            >
                              <Text color="fg.muted" fontSize="sm">
                                Entradas
                              </Text>
                              <Flex align="center" gap="2">
                                <Button
                                  aria-label={`Quitar una entrada de ${sector.name}, ${batch.name}`}
                                  disabled={
                                    quantity === 0 ||
                                    createBuyMutation.isPending ||
                                    lookupPricesMutation.isPending
                                  }
                                  onClick={() =>
                                    updateOptionQuantity(
                                      price.id,
                                      quantity - 1,
                                    )
                                  }
                                  size="xs"
                                  type="button"
                                  variant="outline"
                                >
                                  <Minus />
                                </Button>
                                <Text
                                  aria-live="polite"
                                  fontWeight="semibold"
                                  minW="6"
                                  textAlign="center"
                                >
                                  {quantity}
                                </Text>
                                <Button
                                  aria-label={`Agregar una entrada de ${sector.name}, ${batch.name}`}
                                  disabled={
                                    !canSelectThisOption ||
                                    quantity >= maxForOption ||
                                    selectedTicketCount >=
                                      event.ticketsPerPersonLimit
                                  }
                                  onClick={() =>
                                    updateOptionQuantity(
                                      price.id,
                                      quantity + 1,
                                    )
                                  }
                                  size="xs"
                                  type="button"
                                  variant="outline"
                                >
                                  <Plus />
                                </Button>
                              </Flex>
                            </Flex>
                          )}
                        </Box>
                      );
                    })
                  )}
                </Stack>
              </Box>
            ))}
          </SimpleGrid>
        )}

      {isClient && (!user || user.id <= 0) && !completedBuy && (
        <Box
          bg="bg.panel"
          borderColor="border"
          borderRadius="xl"
          borderWidth="1px"
          p="4"
          role="alert"
        >
          <Text color="fg.muted" fontSize="sm">
            No se pudo identificar tu cuenta para registrar la compra. Cierra
            sesión e inicia nuevamente.
          </Text>
        </Box>
      )}

      {canPurchase && selectedItems.length > 0 && (
        <Box
          bg="bg.panel"
          borderColor="border"
          borderRadius="xl"
          borderWidth="1px"
          p={{ base: "4", md: "6" }}
          role="region"
          aria-labelledby="purchase-summary-title"
          style={{ borderTop: `3px solid ${secondaryColor}` }}
        >
          <Stack gap="4">
            <Flex align="center" justify="space-between" gap="3">
              <Heading color="fg" id="purchase-summary-title" size="md">
                Tu selección
              </Heading>
              <Badge colorPalette="brand" variant="subtle">
                {selectedTicketCount} de {event.ticketsPerPersonLimit}
              </Badge>
            </Flex>

            <Stack gap="2">
              {selectedItems.map((item) => (
                <Flex
                  align={{ base: "flex-start", sm: "center" }}
                  direction={{ base: "column", sm: "row" }}
                  justify="space-between"
                  key={item.price.id}
                >
                  <Text color="fg" fontSize="sm">
                    {item.quantity} × {item.sector.name} · {item.batch.name}
                  </Text>
                  <Text color="fg.muted" fontSize="sm" fontWeight="medium">
                    {formatPrice(item.unitPrice * item.quantity)}
                  </Text>
                </Flex>
              ))}
            </Stack>

            <Flex
              align="center"
              borderTopColor="border"
              borderTopWidth="1px"
              justify="space-between"
              pt="4"
            >
              <Text color="fg" fontWeight="semibold">
                Total estimado
              </Text>
              <Text color="fg" fontSize="xl" fontWeight="bold">
                {formatPrice(estimatedTotal)}
              </Text>
            </Flex>

            {reviewError && (
              <Text color="fg.error" fontSize="sm" role="alert">
                {reviewError}
              </Text>
            )}
            {purchaseError && (
              <Text color="fg.error" fontSize="sm" role="alert">
                {purchaseError}
              </Text>
            )}

            <Button
              colorPalette="brand"
              disabled={
                lookupPricesMutation.isPending ||
                createBuyMutation.isPending ||
                estimatedTotal <= 0
              }
              loading={lookupPricesMutation.isPending}
              loadingText="Verificando precios..."
              onClick={() => void handleReviewPurchase()}
              type="button"
            >
              Revisar y confirmar
            </Button>
          </Stack>
        </Box>
      )}

      {completedBuy && (
        <Box
          bg="bg.panel"
          borderColor="border"
          borderRadius="xl"
          borderWidth="1px"
          p={{ base: "4", md: "6" }}
          role="status"
          aria-live="polite"
          style={{ borderTop: `3px solid ${primaryColor}` }}
        >
          <Stack gap="5">
            <Box>
              <Badge colorPalette="green" mb="2" variant="subtle">
                Compra registrada
              </Badge>
              <Heading color="fg" size="md">
                Tus entradas están listas
              </Heading>
              <Text color="fg.muted" fontSize="sm" mt="1">
                Compra #{completedBuy.id} · Total registrado:{" "}
                {formatPrice(completedBuy.total)}
              </Text>
              <Text color="fg.muted" fontSize="xs" mt="2">
                Esta versión registra la compra y genera entradas; no procesa
                pagos en línea.
              </Text>
            </Box>

            {ticketsQuery.isPending && (
              <Flex align="center" color="fg.muted" gap="3">
                <Spinner size="sm" />
                Cargando tus entradas...
              </Flex>
            )}

            {ticketsQuery.isError && (
              <Stack align="flex-start" gap="2">
                <Text color="fg.error" fontSize="sm">
                  La compra se registró, pero no se pudieron cargar las
                  entradas.
                </Text>
                <Button
                  onClick={() => void ticketsQuery.refetch()}
                  size="sm"
                  variant="outline"
                >
                  Reintentar carga de entradas
                </Button>
              </Stack>
            )}

            {ticketsQuery.isSuccess && ticketsQuery.data.length === 0 && (
              <Stack align="flex-start" gap="2">
                <Text color="fg.muted" fontSize="sm">
                  La compra se registró, pero el servicio todavía no devolvió
                  sus entradas.
                </Text>
                <Button
                  onClick={() => void ticketsQuery.refetch()}
                  size="sm"
                  variant="outline"
                >
                  Consultar entradas
                </Button>
              </Stack>
            )}

            {ticketsQuery.isSuccess && ticketsQuery.data.length > 0 && (
              <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap="4">
                {ticketsQuery.data.map((ticket, index) => {
                  const details = priceDetailsById.get(
                    ticket.sectorByBatchId,
                  );

                  return (
                    <Box
                      alignItems="center"
                      bg="bg"
                      borderColor="border"
                      borderRadius="lg"
                      borderWidth="1px"
                      display="flex"
                      flexDirection="column"
                      gap="3"
                      key={ticket.id}
                      p="4"
                      textAlign="center"
                    >
                      <Text color="fg" fontWeight="semibold">
                        Entrada {index + 1}
                      </Text>
                      <Text color="fg.muted" fontSize="sm">
                        {details
                          ? `${details.sectorName} · ${details.batchName}`
                          : "Sector y tanda"}
                      </Text>
                      {ticket.qrToken ? (
                        <Box
                          aria-label={`Código QR de la entrada ${index + 1}`}
                          bg="white"
                          p="2"
                          role="img"
                        >
                          <QRCodeSVG
                            includeMargin
                            level="M"
                            size={160}
                            value={ticket.qrToken}
                          />
                        </Box>
                      ) : (
                        <Text color="fg.error" fontSize="sm">
                          Esta entrada no tiene un código QR disponible.
                        </Text>
                      )}
                    </Box>
                  );
                })}
              </SimpleGrid>
            )}

            <Button
              alignSelf="flex-start"
              onClick={() => setCompletedBuy(null)}
              size="sm"
              variant="outline"
            >
              Realizar otra compra
            </Button>
          </Stack>
        </Box>
      )}

      <Dialog.Root
        onOpenChange={({ open }) => handlePurchaseDialogChange(open)}
        open={isPurchaseConfirmOpen}
        size="sm"
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>Confirmar compra</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Stack gap="4">
                  <Text color="fg">
                    Vas a registrar {selectedTicketCount}{" "}
                    {selectedTicketCount === 1 ? "entrada" : "entradas"} para
                    este evento.
                  </Text>
                  <Flex
                    align="center"
                    bg="bg.subtle"
                    borderRadius="lg"
                    justify="space-between"
                    p="4"
                  >
                    <Text fontWeight="semibold">Total</Text>
                    <Text fontSize="xl" fontWeight="bold">
                      {formatPrice(estimatedTotal)}
                    </Text>
                  </Flex>
                  <Text color="fg.muted" fontSize="sm">
                    El servidor verificará nuevamente los precios y generará
                    tus entradas. No se solicitarán datos de pago.
                  </Text>
                  {purchaseError && (
                    <Text color="fg.error" fontSize="sm" role="alert">
                      {purchaseError}
                    </Text>
                  )}
                  <Dialog.Footer px="0">
                    <Button
                      disabled={createBuyMutation.isPending}
                      onClick={() => handlePurchaseDialogChange(false)}
                      type="button"
                      variant="outline"
                    >
                      Volver a revisar
                    </Button>
                    <Button
                      colorPalette="brand"
                      disabled={
                        createBuyMutation.isPending ||
                        selectedItems.length === 0
                      }
                      loading={createBuyMutation.isPending}
                      loadingText="Registrando..."
                      onClick={() => void handleCreatePurchase()}
                      type="button"
                    >
                      Confirmar compra
                    </Button>
                  </Dialog.Footer>
                </Stack>
              </Dialog.Body>
              <Dialog.CloseTrigger disabled={createBuyMutation.isPending} />
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </Stack>
  );
}
