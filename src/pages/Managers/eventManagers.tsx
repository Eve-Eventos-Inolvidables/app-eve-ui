import {
  Box,
  Button,
  Dialog,
  Flex,
  Heading,
  IconButton,
  Input,
  Portal,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import { ExternalLink, UserMinus, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEventManagersWithUsersQuery } from "../../queries/eventManager.queries";
import { getErrorMessage } from "../../utils/error";

interface EventOption {
  id: number;
  name: string;
  location: string;
  category: string;
  startDate: string;
}

const MOCK_EVENTS: EventOption[] = [
  {
    id: 101,
    name: "Iron Maiden - The Future Past Tour",
    location: "Estadio Vélez Sarsfield, Buenos Aires",
    category: "Recital",
    startDate: "2026-11-21T21:00:00",
  },
  {
    id: 102,
    name: "Final Copa Libertadores",
    location: "Estadio Monumental, Buenos Aires",
    category: "Deportes",
    startDate: "2026-11-30T17:00:00",
  },
  {
    id: 103,
    name: "Festival Primavera Sound",
    location: "Parque de la Ciudad, Buenos Aires",
    category: "Festival",
    startDate: "2026-12-05T14:00:00",
  },
  {
    id: 104,
    name: "Obra de Teatro: El Fantasma",
    location: "Teatro Colón, Buenos Aires",
    category: "Teatro",
    startDate: "2026-12-12T20:30:00",
  },
  {
    id: 105,
    name: "Conferencia Tech 2027",
    location: "Centro de Convenciones, Córdoba",
    category: "Conferencia",
    startDate: "2027-01-15T10:00:00",
  },
];

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function formatDate(value: string): string {
  return dateFormatter.format(new Date(value));
}

export default function EventManagers() {
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const {
    data: eventManagers = [],
    error,
    isError,
    isPending,
  } = useEventManagersWithUsersQuery();

  const filteredEvents = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return MOCK_EVENTS;
    }

    return MOCK_EVENTS.filter((event) =>
      [event.name, event.location, event.category].some((value) =>
        value.toLowerCase().includes(term),
      ),
    );
  }, [search]);

  return (
    <Stack gap="8">
      <Flex
        align={{ base: "flex-start", md: "center" }}
        direction={{ base: "column", md: "row" }}
        gap="4"
        justify="space-between"
      >
        <Box>
          <Heading color="fg" size="2xl">
            Gestión de Event Managers
          </Heading>
          <Text color="fg.muted" mt="2">
            Administra los managers asignados a cada evento.
          </Text>
        </Box>

        <Button
          colorPalette="brand"
          onClick={() => setIsDialogOpen(true)}
        >
          <UserPlus /> Asignar event managers
        </Button>
      </Flex>

      <Box
        bg="bg.panel"
        borderColor="border"
        borderRadius="xl"
        borderWidth="1px"
        overflow="hidden"
      >
        <Table.ScrollArea>
          <Table.Root size="md" variant="line">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Nombre</Table.ColumnHeader>
                <Table.ColumnHeader>Email</Table.ColumnHeader>
                <Table.ColumnHeader>Fecha de asignación</Table.ColumnHeader>
                <Table.ColumnHeader>Evento</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">Acciones</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {isPending ? (
                <Table.Row>
                  <Table.Cell colSpan={5} color="fg.muted" textAlign="center">
                    Cargando event managers...
                  </Table.Cell>
                </Table.Row>
              ) : isError ? (
                <Table.Row>
                  <Table.Cell colSpan={5} color="fg.muted" textAlign="center">
                    {getErrorMessage(
                      error,
                      "No se pudieron cargar los event managers.",
                    )}
                  </Table.Cell>
                </Table.Row>
              ) : eventManagers.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={5} color="fg.muted" textAlign="center">
                    No hay event managers asignados.
                  </Table.Cell>
                </Table.Row>
              ) : (
                eventManagers.map((manager) => (
                  <Table.Row key={manager.id}>
                    <Table.Cell fontWeight="medium">{manager.name}</Table.Cell>
                    <Table.Cell color="fg.muted">{manager.email}</Table.Cell>
                    <Table.Cell color="fg.muted">
                      {formatDate(manager.assignedAt)}
                    </Table.Cell>
                    <Table.Cell color="fg.muted">{manager.event}</Table.Cell>
                    <Table.Cell textAlign="end">
                      <Flex gap="1" justify="flex-end">
                        <IconButton
                          aria-label={`Ir al evento de ${manager.name}`}
                          onClick={() => navigate(`/event/${manager.eventId}`)}
                          size="sm"
                          variant="ghost"
                        >
                          <ExternalLink />
                        </IconButton>
                        <IconButton
                          aria-label={`Desasignar a ${manager.name} del evento`}
                          colorPalette="red"
                          size="sm"
                          variant="ghost"
                        >
                          <UserMinus />
                        </IconButton>
                      </Flex>
                    </Table.Cell>
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table.Root>
        </Table.ScrollArea>
      </Box>

      <Dialog.Root
        onOpenChange={(details) => setIsDialogOpen(details.open)}
        open={isDialogOpen}
        size="xl"
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>Asignar event managers</Dialog.Title>
              
              </Dialog.Header>

              <Dialog.Body>
                <Stack gap="4">
                    <Dialog.Description>
                  Busca el evento al que quieres asignar un manager.
                </Dialog.Description>
                  <Input
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar por nombre, ubicación o categoría"
                    value={search}
                  />

                  <Box
                    bg="bg.panel"
                    borderColor="border"
                    borderRadius="xl"
                    borderWidth="1px"
                    overflow="hidden"
                  >
                    <Table.ScrollArea maxH="sm">
                      <Table.Root size="md" variant="line">
                        <Table.Header>
                          <Table.Row>
                            <Table.ColumnHeader>Nombre</Table.ColumnHeader>
                            <Table.ColumnHeader>Ubicación</Table.ColumnHeader>
                            <Table.ColumnHeader>Categoría</Table.ColumnHeader>
                            <Table.ColumnHeader>
                              Fecha de inicio
                            </Table.ColumnHeader>
                          </Table.Row>
                        </Table.Header>
                        <Table.Body>
                          {filteredEvents.length === 0 ? (
                            <Table.Row>
                              <Table.Cell
                                colSpan={4}
                                color="fg.muted"
                                textAlign="center"
                              >
                                No se encontraron eventos.
                              </Table.Cell>
                            </Table.Row>
                          ) : (
                            filteredEvents.map((event) => (
                              <Table.Row key={event.id}>
                                <Table.Cell fontWeight="medium">
                                  {event.name}
                                </Table.Cell>
                                <Table.Cell color="fg.muted">
                                  {event.location}
                                </Table.Cell>
                                <Table.Cell>{event.category}</Table.Cell>
                                <Table.Cell color="fg.muted">
                                  {formatDate(event.startDate)}
                                </Table.Cell>
                              </Table.Row>
                            ))
                          )}
                        </Table.Body>
                      </Table.Root>
                    </Table.ScrollArea>
                  </Box>
                </Stack>
              </Dialog.Body>

              <Dialog.Footer>
                <Button
                  onClick={() => setIsDialogOpen(false)}
                  variant="outline"
                >
                  Cerrar
                </Button>
              </Dialog.Footer>

              <Dialog.CloseTrigger />
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </Stack>
  );
}
