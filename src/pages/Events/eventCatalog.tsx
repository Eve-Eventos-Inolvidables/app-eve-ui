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
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
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

type EventGroup = "active" | "past";

function EventCard({ event }: { event: SimpleEventDto }) {
  const navigate = useNavigate();
  const primaryColor = getSafeEventColor(event.primaryColor, "#10B981");
  const isPast = event.date < getTodayDateValue();

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
              {event.kickOffTime ? ` · ${event.kickOffTime.slice(0, 5)}` : ""}
            </Text>
          </Flex>
        </Box>

        <Text color="fg.muted" flex="1" lineClamp={3} minH="3.75rem">
          {event.description?.trim() ||
            "Consulta los sectores y precios de este evento."}
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
  const today = getTodayDateValue();
  const [activeGroup, setActiveGroup] = useState<EventGroup>("active");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activePage, setActivePage] = useState(1);
  const [pastPage, setPastPage] = useState(1);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setActivePage(1);
      setPastPage(1);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [search]);

  const isIdSearch = /^\d+$/.test(debouncedSearch);
  const parsedId = isIdSearch ? Number(debouncedSearch) : undefined;
  const validIdSearch =
    parsedId !== undefined &&
    Number.isSafeInteger(parsedId) &&
    parsedId > 0;

  const activeEventsQuery = useEventsQuery(
    {
      page: activePage,
      size: PAGE_SIZE,
      name: debouncedSearch || undefined,
      dateFrom: today,
      sort: "date,asc",
    },
    activeGroup === "active" && !isIdSearch,
  );
  const pastEventsQuery = useEventsQuery(
    {
      page: pastPage,
      size: PAGE_SIZE,
      name: debouncedSearch || undefined,
      dateBefore: today,
      sort: "date,desc",
    },
    activeGroup === "past" && !isIdSearch,
  );
  const eventByIdQuery = useEventByIdQuery(
    validIdSearch ? parsedId : 0,
    validIdSearch,
  );

  const selectedListQuery =
    activeGroup === "active" ? activeEventsQuery : pastEventsQuery;
  const foundEvent = validIdSearch ? eventByIdQuery.data : undefined;
  const foundEventMatchesGroup = foundEvent
    ? activeGroup === "active"
      ? foundEvent.date >= today
      : foundEvent.date < today
    : false;
  const pagedEvents =
    selectedListQuery.data?.data?.filter((event) => !event.archived) ?? [];
  const events = isIdSearch
    ? foundEvent && foundEventMatchesGroup && !foundEvent.archived
      ? [foundEvent]
      : []
    : pagedEvents;
  const pagination = selectedListQuery.data?.pagination;
  const totalPages = Math.max(pagination?.totalPages ?? 1, 1);
  const currentPage = pagination?.page ?? (
    activeGroup === "active" ? activePage : pastPage
  );
  const isLoading = isIdSearch
    ? validIdSearch && eventByIdQuery.isPending
    : selectedListQuery.isPending;
  const queryError = isIdSearch
    ? eventByIdQuery.error
    : selectedListQuery.error;
  const isError = isIdSearch
    ? validIdSearch && eventByIdQuery.isError
    : selectedListQuery.isError;
  const groupLabel = activeGroup === "active" ? "Activos" : "Pasados";

  const goToPage = (nextPage: number) => {
    if (activeGroup === "active") {
      setActivePage(nextPage);
    } else {
      setPastPage(nextPage);
    }
  };

  const emptyMessage = () => {
    if (isIdSearch) {
      if (!validIdSearch) {
        return "Ingresa un ID de evento válido.";
      }

      if (foundEvent && !foundEventMatchesGroup) {
        return activeGroup === "active"
          ? "Ese evento está en Pasados. Cambia de categoría para verlo."
          : "Ese evento está en Activos. Cambia de categoría para verlo.";
      }

      return "No se encontró un evento con ese ID.";
    }

    if (debouncedSearch) {
      return `No hay eventos ${groupLabel.toLowerCase()} que coincidan con la búsqueda.`;
    }

    return activeGroup === "active"
      ? "No hay eventos próximos."
      : "Todavía no hay eventos pasados.";
  };

  return (
    <Stack gap="6">
      <Box>
        <Heading color="fg" size="2xl">
          Eventos
        </Heading>
        <Text color="fg.muted" mt="2">
          Explora los próximos eventos o consulta los que ya finalizaron.
        </Text>
      </Box>

      <Flex
        aria-label="Categorías de eventos"
        as="nav"
        gap="2"
        role="group"
      >
        <Button
          aria-pressed={activeGroup === "active"}
          onClick={() => setActiveGroup("active")}
          variant={activeGroup === "active" ? "solid" : "outline"}
        >
          Activos
          {activeEventsQuery.data?.pagination && (
            <Badge
              colorPalette={activeGroup === "active" ? "gray" : "brand"}
              ml="1"
              variant="subtle"
            >
              {activeEventsQuery.data.pagination.totalItems}
            </Badge>
          )}
        </Button>
        <Button
          aria-pressed={activeGroup === "past"}
          onClick={() => setActiveGroup("past")}
          variant={activeGroup === "past" ? "solid" : "outline"}
        >
          Pasados
          {pastEventsQuery.data?.pagination && (
            <Badge
              colorPalette={activeGroup === "past" ? "gray" : "brand"}
              ml="1"
              variant="subtle"
            >
              {pastEventsQuery.data.pagination.totalItems}
            </Badge>
          )}
        </Button>
      </Flex>

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
          La búsqueda por nombre respeta la categoría seleccionada.
        </Field.HelperText>
      </Field.Root>

      <Flex
        align={{ base: "flex-start", sm: "center" }}
        direction={{ base: "column", sm: "row" }}
        gap="2"
        justify="space-between"
      >
        <Heading color="fg" size="lg">
          Eventos {groupLabel.toLowerCase()}
        </Heading>
        {!isIdSearch && pagination && (
          <Text color="fg.muted" fontSize="sm">
            {pagination.totalItems} eventos · ordenados por fecha{" "}
            {activeGroup === "active"
              ? "del más próximo al más lejano"
              : "del más reciente al más antiguo"}
          </Text>
        )}
      </Flex>

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
              {getErrorMessage(
                queryError,
                "No se pudieron cargar los eventos.",
              )}
            </Text>
            <Button
              onClick={() =>
                isIdSearch
                  ? void eventByIdQuery.refetch()
                  : void selectedListQuery.refetch()
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
          <Text fontWeight="semibold">{emptyMessage()}</Text>
          <Text color="fg.muted" fontSize="sm" mt="2">
            Prueba otra búsqueda o cambia de categoría.
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
                  disabled={currentPage <= 1 || selectedListQuery.isFetching}
                  onClick={() => goToPage(Math.max(currentPage - 1, 1))}
                  size="sm"
                  variant="outline"
                >
                  <ChevronLeft /> Anterior
                </Button>
                <Button
                  disabled={
                    currentPage >= totalPages || selectedListQuery.isFetching
                  }
                  onClick={() =>
                    goToPage(Math.min(currentPage + 1, totalPages))
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
