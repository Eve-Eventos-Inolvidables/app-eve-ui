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
import { ArrowRight, CalendarDays } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PaginationControl } from "../../components/ui/PaginationControl";
import { SearchInput } from "../../components/ui/SearchInput";
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

function EventCard({ event }: { event: SimpleEventDto }) {
  const navigate = useNavigate();
  const primaryColor = getSafeEventColor(event.primaryColor, "#10B981");
  const today = getTodayDateValue();
  const isPast = event.date < today;
  const day = formatEventDate(event.date, { day: "2-digit" });
  const month = formatEventDate(event.date, { month: "short" })
    .replace(".", "")
    .toUpperCase();

  return (
    <Box
      _hover={{ borderColor: "brand.muted", shadow: "lg", transform: "translateY(-2px)" }}
      bg="bg.panel"
      borderColor="border"
      borderRadius="xl"
      borderWidth="1px"
      display="flex"
      flexDirection="column"
      minW="0"
      overflow="hidden"
      shadow="sm"
      style={{ transition: "transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease" }}
    >
      <Box
        h="1.5"
        style={
          isPast
            ? undefined
            : { backgroundColor: primaryColor }
        }
        bg={isPast ? "bg.emphasized" : undefined}
      />

      <Stack flex="1" gap="4" p="5">
        <Flex align="flex-start" justify="space-between" gap="3">
          <Flex
            align="center"
            bg="bg.subtle"
            borderColor="border"
            borderRadius="lg"
            borderWidth="1px"
            direction="column"
            flexShrink={0}
            h="14"
            justify="center"
            w="14"
          >
            <Text fontSize="lg" fontWeight="extrabold" lineHeight="1">
              {day}
            </Text>
            <Text
              color="fg.muted"
              fontSize="2xs"
              fontWeight="semibold"
              letterSpacing="wide"
              mt="1"
            >
              {month}
            </Text>
          </Flex>

          <Badge
            colorPalette={isPast ? "gray" : "brand"}
            flexShrink={0}
            variant="subtle"
          >
            {isPast ? "Finalizado" : "Próximo evento"}
          </Badge>
        </Flex>

        <Heading
          color="fg"
          fontSize="2xl"
          fontWeight="extrabold"
          letterSpacing="tight"
          lineClamp={2}
          lineHeight="short"
        >
          {event.name}
        </Heading>

        <Flex align="center" color="fg.muted" gap="2">
          <CalendarDays aria-hidden="true" size={16} />
          <Text fontSize="sm">
            {formatEventDate(event.date, { dateStyle: "medium" })}
            {event.kickOffTime ? ` · ${event.kickOffTime.slice(0, 5)}` : ""}
          </Text>
        </Flex>

        <Text
          color="fg.muted"
          flex="1"
          fontSize="sm"
          lineClamp={3}
          lineHeight="relaxed"
          minH="3.75rem"
        >
          {event.description?.trim() ||
            "Consulta los sectores y precios de este evento."}
        </Text>

        <Button
          colorPalette="brand"
          onClick={() => navigate(`/events/${event.id}`)}
          w="full"
        >
          Ver sectores y precios
          <ArrowRight />
        </Button>
      </Stack>
    </Box>
  );
}

export default function EventCatalog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };

  const isIdSearch = /^\d+$/.test(searchTerm);
  const parsedId = isIdSearch ? Number(searchTerm) : undefined;
  const validIdSearch =
    parsedId !== undefined &&
    Number.isSafeInteger(parsedId) &&
    parsedId > 0;

  const eventsQuery = useEventsQuery(
    {
      page,
      size: PAGE_SIZE,
      name: searchTerm || undefined,
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

      <Field.Root maxW={{ base: "full", md: "xl" }}>
        <Field.Label>Buscar eventos</Field.Label>
        <SearchInput
          onSearchChange={handleSearchChange}
          placeholder="Buscar por nombre o ID"
        />
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
              : searchTerm
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
          <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap="6">
            {events.map((event) => (
              <EventCard event={event} key={event.id} />
            ))}
          </SimpleGrid>

          {!isIdSearch && (
            <PaginationControl
              isFetching={eventsQuery.isFetching}
              itemLabel="eventos"
              onPageChange={setPage}
              page={page}
              pagination={pagination}
            />
          )}
        </>
      )}
    </Stack>
  );
}
