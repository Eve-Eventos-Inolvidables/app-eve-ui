import { Box, Button, Flex, Heading, SimpleGrid, Spinner, Stack, Text } from "@chakra-ui/react";
import { EventCard } from "../../components/events/EventCard";
import { EmptyState } from "../../components/ui/EmptyState";
import { useAuthStore } from "../../stores/auth.store";
import type { SimpleEventDto } from "../../types/event.types";
import { getErrorMessage } from "../../utils/error";
import { useManagerEvents } from "./hooks/useManagerEvents";

interface EventSectionProps {
  title: string;
  description: string;
  events: SimpleEventDto[];
  emptyTitle: string;
  emptyDescription: string;
}

function EventSection({
  title,
  description,
  events,
  emptyTitle,
  emptyDescription,
}: EventSectionProps) {
  return (
    <Stack gap="4">
      <Box>
        <Heading color="fg" size="lg">
          {title}
        </Heading>
        <Text color="fg.muted" fontSize="sm" mt="1">
          {description}
        </Text>
      </Box>

      {events.length === 0 ? (
        <Box
          bg="bg.panel"
          borderColor="border"
          borderRadius="xl"
          borderWidth="1px"
        >
          <EmptyState title={emptyTitle} description={emptyDescription} />
        </Box>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap="6">
          {events.map((event) => (
            <EventCard event={event} key={event.id} />
          ))}
        </SimpleGrid>
      )}
    </Stack>
  );
}

export default function ManagerDashboard() {
  const user = useAuthStore((state) => state.user);
  const { upcoming, past, isLoading, isError, error, refetch } =
    useManagerEvents();

  return (
    <Stack gap="8">
      <Box bg="bg.panel" borderColor="border" borderWidth="1px" borderRadius="xl" p="6">
        <Heading color="fg" size="2xl">
          Hola, {user?.name ?? "Manager"}
        </Heading>
        <Text color="fg.muted" mt="2">
          Aquí puedes ver los eventos que tienes asignados como manager.
        </Text>
      </Box>

      {isLoading && (
        <Flex align="center" color="fg.muted" gap="3" justify="center" py="12">
          <Spinner color="brand.solid" />
          Cargando tus eventos...
        </Flex>
      )}

      {isError && !isLoading && (
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
              {getErrorMessage(error, "No se pudieron cargar tus eventos.")}
            </Text>
            <Button onClick={refetch} size="sm" variant="outline">
              Reintentar
            </Button>
          </Stack>
        </Box>
      )}

      {!isLoading && !isError && (
        <>
          <EventSection
            title="Próximos eventos"
            description="Eventos asignados que todavía no se realizaron."
            events={upcoming}
            emptyTitle="No tienes eventos próximos"
            emptyDescription="Cuando te asignen un evento próximo, aparecerá aquí."
          />

          <EventSection
            title="Eventos pasados"
            description="Eventos asignados que ya finalizaron."
            events={past}
            emptyTitle="No tienes eventos pasados"
            emptyDescription="Los eventos que ya finalizaron aparecerán aquí."
          />
        </>
      )}
    </Stack>
  );
}
