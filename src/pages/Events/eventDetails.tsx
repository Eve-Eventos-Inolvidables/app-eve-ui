import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  Link,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { ArrowLeft, MapPin, Ticket } from "lucide-react";
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useEventByIdQuery,
  useEventCatalogStructureQuery,
} from "../../queries/events.queries";
import type {
  BatchDto,
  SectorByBatchDto,
  SectorDto,
} from "../../types/event.types";
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

  const eventQuery = useEventByIdQuery(eventId, isValidId);
  const structureQuery = useEventCatalogStructureQuery(
    isValidId && eventQuery.isSuccess,
  );
  const event = eventQuery.data;

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
  const isPastEvent = event.date < getTodayDateValue();

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

                      return (
                        <Flex
                          align={{ base: "flex-start", sm: "center" }}
                          direction={{ base: "column", sm: "row" }}
                          gap="2"
                          justify="space-between"
                          key={price.id}
                        >
                          <Box>
                            <Flex align="center" gap="2" wrap="wrap">
                              <Text color="fg" fontWeight="semibold">
                                {batch.name}
                              </Text>
                              <Badge
                                colorPalette={status.colorPalette}
                                variant="subtle"
                              >
                                {status.label}
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
                            {formatPrice(price.price)}
                          </Text>
                        </Flex>
                      );
                    })
                  )}
                </Stack>
              </Box>
            ))}
          </SimpleGrid>
        )}
    </Stack>
  );
}
