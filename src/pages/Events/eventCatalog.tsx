import {
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

const PAGE_SIZE = 9;

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
          placeholder="Buscar por nombre "
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
