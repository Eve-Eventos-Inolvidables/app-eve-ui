import {
  Badge,
  Box,
  Button,
  Field,
  Flex,
  Heading,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useState } from "react";
import { EventCard } from "../../components/events/EventCard";
import { PaginationControl } from "../../components/ui/PaginationControl";
import { SearchInput } from "../../components/ui/SearchInput";
import {
  useEventByIdQuery,
  useEventsQuery,
} from "../../queries/events.queries";
import { getErrorMessage } from "../../utils/error";
import { getTodayDateValue } from "../../utils/eventFormatting";

const PAGE_SIZE = 9;

type EventGroup = "active" | "past";

export default function EventCatalog() {
  const today = getTodayDateValue();
  const [activeGroup, setActiveGroup] = useState<EventGroup>("active");
  const [search, setSearch] = useState("");
  const [activePage, setActivePage] = useState(1);
  const [pastPage, setPastPage] = useState(1);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setActivePage(1);
    setPastPage(1);
  };

  const isIdSearch = /^\d+$/.test(search);
  const parsedId = isIdSearch ? Number(search) : undefined;
  const validIdSearch =
    parsedId !== undefined && Number.isSafeInteger(parsedId) && parsedId > 0;

  // Both groups are queried so the tab badges show real totals.
  const activeEventsQuery = useEventsQuery(
    {
      page: activePage,
      size: PAGE_SIZE,
      name: search || undefined,
      dateFrom: today,
      sort: "date,asc",
    },
    !isIdSearch,
  );
  const pastEventsQuery = useEventsQuery(
    {
      page: pastPage,
      size: PAGE_SIZE,
      name: search || undefined,
      dateBefore: today,
      sort: "date,desc",
    },
    !isIdSearch,
  );
  const eventByIdQuery = useEventByIdQuery(parsedId ?? 0, validIdSearch);

  const selectedQuery =
    activeGroup === "active" ? activeEventsQuery : pastEventsQuery;
  const currentPage = activeGroup === "active" ? activePage : pastPage;
  const groupLabel = activeGroup === "active" ? "Activos" : "Pasados";

  // An ID search only shows the event when it belongs to the selected group.
  const foundEvent = validIdSearch ? eventByIdQuery.data : undefined;
  const foundEventMatchesGroup = foundEvent
    ? activeGroup === "active"
      ? foundEvent.date >= today
      : foundEvent.date < today
    : false;
  const pagedEvents =
    selectedQuery.data?.data?.filter((event) => !event.archived) ?? [];
  const events = isIdSearch
    ? foundEvent && foundEventMatchesGroup && !foundEvent.archived
      ? [foundEvent]
      : []
    : pagedEvents;
  const pagination = selectedQuery.data?.pagination;

  const isLoading = isIdSearch
    ? validIdSearch && eventByIdQuery.isPending
    : selectedQuery.isPending;
  const isError = isIdSearch
    ? validIdSearch && eventByIdQuery.isError
    : selectedQuery.isError;
  const queryError = isIdSearch ? eventByIdQuery.error : selectedQuery.error;

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

    if (search) {
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

      <Flex aria-label="Categorías de eventos" as="nav" gap="2" role="group">
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

      <Field.Root maxW={{ base: "full", md: "xl" }}>
        <Field.Label>Buscar eventos</Field.Label>
        <SearchInput
          onSearchChange={handleSearchChange}
          placeholder="Buscar por nombre"
        />
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
        {!isIdSearch && (
          <Text color="fg.muted" fontSize="sm">
            Ordenados por fecha{" "}
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
              {getErrorMessage(queryError, "No se pudieron cargar los eventos.")}
            </Text>
            <Button
              onClick={() =>
                isIdSearch
                  ? void eventByIdQuery.refetch()
                  : void selectedQuery.refetch()
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
          <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap="6">
            {events.map((event) => (
              <EventCard event={event} key={event.id} />
            ))}
          </SimpleGrid>

          {!isIdSearch && (
            <Box
              bg="bg.panel"
              borderColor="border"
              borderRadius="xl"
              borderWidth="1px"
              overflow="hidden"
            >
              <PaginationControl
                isFetching={selectedQuery.isFetching}
                itemLabel="eventos"
                onPageChange={goToPage}
                page={currentPage}
                pagination={pagination}
              />
            </Box>
          )}
        </>
      )}
    </Stack>
  );
}
