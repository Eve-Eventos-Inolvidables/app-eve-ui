import {
  Badge,
  Box,
  Button,
  Field,
  Flex,
  Heading,
  Input,
  InputGroup,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { CalendarDays, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useEventByIdQuery,
  useEventsQuery,
} from "../../queries/events.queries";
import type { SimpleEventDto } from "../../types/event.types";
import {
  formatEventDate,
  getSafeEventColor,
  getTodayDateValue,
} from "../../utils/eventFormatting";
import { getErrorMessage } from "../../utils/error";

const PAGE_SIZE = 9;
const SEARCH_DEBOUNCE_MS = 350;

function EventCard({ event }: { event: SimpleEventDto }) {
  const navigate = useNavigate();
  const primaryColor = getSafeEventColor(event.primaryColor, "#10B981");
  const today = getTodayDateValue();
  const isPast = event.date < today;

  return (
    <Box
      bg="bg.panel"
      borderColor="border"
      borderRadius="xl"
      borderTopWidth="4px"
      minW="0"
      p="5"
      shadow="sm"
      style={{ borderTopColor: primaryColor }}
    >
      <Stack gap="4" h="full">
        <Flex align="center" justify="space-between" gap="3">
          <Badge colorPalette={isPast ? "gray" : "brand"} variant="subtle">
            {isPast ? "Finalizado" : "Próximo evento"}
          </Badge>
          <Text color="fg.muted" fontSize="xs">
            #{event.id}
          </Text>
        </Flex>

        <Box>
          <Heading color="fg" lineClamp={2} size="md">
            {event.name}
          </Heading>
          <Flex align="center" color="fg.muted" gap="2" mt="3">
            <CalendarDays aria-hidden="true" size={16} />
            <Text fontSize="sm">
              {formatEventDate(event.date, { dateStyle: "medium" })}
              {event.kickOffTime
                ? ` · ${event.kickOffTime.slice(0, 5)}`
                : ""}
            </Text>
          </Flex>
        </Box>

        <Text color="fg.muted" flex="1" lineClamp={3} minH="3.75rem">
          {event.description?.trim() || "Consulta los sectores y precios de este evento."}
        </Text>

        <Button
          colorPalette="brand"
          onClick={() => navigate(`/events/${event.id}`)}
          variant="outline"
          w="full"
        >
          Ver sectores y precios
        </Button>
      </Stack>
    </Box>
  );
}

export default function EventCatalog() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [search]);

  const isIdSearch = /^\d+$/.test(debouncedSearch);
  const parsedId = isIdSearch ? Number(debouncedSearch) : undefined;
  const validIdSearch =
    parsedId !== undefined &&
    Number.isSafeInteger(parsedId) &&
    parsedId > 0;

  const eventsQuery = useEventsQuery(
    {
      page,
      size: PAGE_SIZE,
      name: debouncedSearch || undefined,
      sort: "date,asc",
    },
    !isIdSearch,
  );
  const eventByIdQuery = useEventByIdQuery(
    validIdSearch ? parsedId : 0,
    validIdSearch,
  );

  const pagedEvents =
    eventsQuery.data?.data?.filter((event) => !event.archived) ?? [];
  const events = validIdSearch
    ? eventByIdQuery.data && !eventByIdQuery.data.archived
      ? [eventByIdQuery.data]
      : []
    : pagedEvents;
  const pagination = eventsQuery.data?.pagination;
  const totalPages = Math.max(pagination?.totalPages ?? 1, 1);
  const currentPage = pagination?.page ?? page;
  const isLoading = isIdSearch
    ? validIdSearch && eventByIdQuery.isPending
    : eventsQuery.isPending;
  const queryError = isIdSearch ? eventByIdQuery.error : eventsQuery.error;
  const isError = isIdSearch
    ? validIdSearch && eventByIdQuery.isError
    : eventsQuery.isError;

  return (
    <Stack gap="6">
      <Box>
        <Heading color="fg" size="2xl">
          Eventos
        </Heading>
        <Text color="fg.muted" mt="2">
          Explora los eventos y consulta sus sectores, tandas y precios.
        </Text>
      </Box>

      <Field.Root>
        <Field.Label htmlFor="event-search">Buscar eventos</Field.Label>
        <InputGroup
          maxW={{ base: "full", md: "xl" }}
          startElement={<Search aria-hidden="true" size={16} />}
        >
          <Input
            id="event-search"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre o ID"
            value={search}
          />
        </InputGroup>
        <Field.HelperText>
          La búsqueda por nombre usa el filtro del servidor; un número busca el
          evento por su ID.
        </Field.HelperText>
      </Field.Root>

      {isLoading && (
        <Flex align="center" color="fg.muted" gap="3" justify="center" py="12">
          <Spinner color="brand.solid" />
          Cargando eventos...
        </Flex>
      )}

      {isError && (
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
              {getErrorMessage(queryError, "No se pudieron cargar los eventos.")}
            </Text>
            <Button
              onClick={() =>
                isIdSearch
                  ? void eventByIdQuery.refetch()
                  : void eventsQuery.refetch()
              }
              size="sm"
              variant="outline"
            >
              Reintentar
            </Button>
          </Stack>
        </Box>
      )}

      {!isLoading && !isError && events.length === 0 && (
        <Box
          bg="bg.panel"
          borderColor="border"
          borderRadius="xl"
          borderWidth="1px"
          p="10"
          textAlign="center"
        >
          <Text fontWeight="semibold">
            {isIdSearch
              ? "No se encontró un evento con ese ID."
              : debouncedSearch
                ? "No hay eventos que coincidan con la búsqueda."
                : "Todavía no hay eventos disponibles."}
          </Text>
          <Text color="fg.muted" fontSize="sm" mt="2">
            Prueba otra búsqueda o vuelve a intentarlo más tarde.
          </Text>
        </Box>
      )}

      {!isLoading && !isError && events.length > 0 && (
        <>
          <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap="5">
            {events.map((event) => (
              <EventCard event={event} key={event.id} />
            ))}
          </SimpleGrid>

          {!isIdSearch && (
            <Flex
              align={{ base: "stretch", sm: "center" }}
              direction={{ base: "column", sm: "row" }}
              gap="3"
              justify="space-between"
            >
              <Text color="fg.muted" fontSize="sm">
                Página {currentPage} de {totalPages} ·{" "}
                {pagination?.totalItems ?? events.length} eventos
              </Text>
              <Flex gap="2" justify={{ base: "flex-end", sm: "initial" }}>
                <Button
                  disabled={currentPage <= 1 || eventsQuery.isFetching}
                  onClick={() => setPage((current) => Math.max(current - 1, 1))}
                  size="sm"
                  variant="outline"
                >
                  <ChevronLeft /> Anterior
                </Button>
                <Button
                  disabled={
                    currentPage >= totalPages || eventsQuery.isFetching
                  }
                  onClick={() =>
                    setPage((current) => Math.min(current + 1, totalPages))
                  }
                  size="sm"
                  variant="outline"
                >
                  Siguiente <ChevronRight />
                </Button>
              </Flex>
            </Flex>
          )}
        </>
      )}
    </Stack>
  );
}
