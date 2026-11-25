import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { ArrowRight, ChevronDown, ChevronUp, Clock, Ticket } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  getTicketLocation,
  TicketQrCard,
} from "../components/tickets/TicketQrCard";
import { EmptyState } from "../components/ui/EmptyState";
import { PaginationControl } from "../components/ui/PaginationControl";
import { useAllEventCategoriesQuery } from "../queries/eventCategory.queries";
import {
  useAllEventsQuery,
  useEventCatalogStructureQuery,
} from "../queries/events.queries";
import {
  useBuysQuery,
  useTicketCountByBuyQuery,
  useTicketsByBuyQuery,
} from "../queries/sales.queries";
import { useUserInterestsQuery } from "../queries/userInterest.queries";
import { useAuthStore } from "../stores/auth.store";
import type { SimpleEventDto } from "../types/event.types";
import type { BuyDto } from "../types/sales.types";
import { getErrorMessage } from "../utils/error";
import { formatEventDate, formatPrice } from "../utils/eventFormatting";
import { isClientRole } from "../utils/permissions";

function InfoField({ label, value }: { label: string; value: string }) {
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
      <Text color="fg" fontSize="md" fontWeight="medium" mt="1">
        {value}
      </Text>
    </Box>
  );
}

function PurchaseRow({
  buy,
  eventName,
  eventDate,
}: {
  buy: BuyDto;
  eventName: string;
  eventDate?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const countQuery = useTicketCountByBuyQuery(buy.id);
  const ticketsQuery = useTicketsByBuyQuery(buy.id, isOpen);
  const catalogQuery = useEventCatalogStructureQuery(buy.eventId, isOpen);
  const ticketsRegionId = `purchase-${buy.id}-tickets`;

  return (
    <Box
      bg="bg.panel"
      borderColor="border"
      borderRadius="xl"
      borderWidth="1px"
      p={{ base: "4", md: "5" }}
    >
      <Flex align="flex-start" gap="3" justify="space-between" wrap="wrap">
        <Stack gap="1">
          <Flex align="center" color="fg.muted" gap="2">
            <Clock aria-hidden="true" size={16} />
            <Text fontSize="sm">
              Compra realizada a las {buy.date?.slice(0, 5) ?? "--:--"}
            </Text>
          </Flex>
          <Heading color="fg" size="md">
            {eventName}
          </Heading>
          {eventDate && (
            <Text color="fg.muted" fontSize="sm">
              Evento: {formatEventDate(eventDate)}
            </Text>
          )}
        </Stack>
        <Badge colorPalette="brand" variant="subtle">
          Compra #{buy.id}
        </Badge>
      </Flex>

      <Flex align="center" gap="4" justify="space-between" mt="4" wrap="wrap">
        <Stack gap="1">
          <Text color="fg" fontWeight="medium">
            Total: {formatPrice(buy.total)}
          </Text>
          {countQuery.isPending ? (
            <Text color="fg.muted" fontSize="sm">
              Cargando entradas...
            </Text>
          ) : countQuery.isError ? (
            <Button
              onClick={() => void countQuery.refetch()}
              size="xs"
              variant="ghost"
            >
              Reintentar carga de entradas
            </Button>
          ) : (
            <Text color="fg.muted" fontSize="sm">
              {countQuery.data ?? 0}{" "}
              {countQuery.data === 1 ? "entrada" : "entradas"}
            </Text>
          )}
        </Stack>
        <Flex gap="2" wrap="wrap">
          <Button
            aria-controls={ticketsRegionId}
            aria-expanded={isOpen}
            onClick={() => setIsOpen((open) => !open)}
            size="sm"
            variant="outline"
          >
            {isOpen ? "Ocultar entradas" : "Ver entradas"}
            {isOpen ? (
              <ChevronUp aria-hidden="true" size={16} />
            ) : (
              <ChevronDown aria-hidden="true" size={16} />
            )}
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to={`/events/${buy.eventId}`}>
              Ver evento <ArrowRight />
            </Link>
          </Button>
        </Flex>
      </Flex>

      {isOpen && (
        <Stack
          aria-live="polite"
          borderColor="border"
          borderTopWidth="1px"
          gap="3"
          id={ticketsRegionId}
          mt="4"
          pt="4"
        >
          {ticketsQuery.isPending && (
            <Flex align="center" color="fg.muted" gap="3">
              <Spinner size="sm" />
              Cargando tus entradas...
            </Flex>
          )}

          {ticketsQuery.isError && (
            <Stack align="flex-start" gap="2">
              <Text color="fg.error" fontSize="sm">
                {getErrorMessage(
                  ticketsQuery.error,
                  "No se pudieron cargar las entradas de esta compra.",
                )}
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
                Esta compra todavía no tiene entradas disponibles.
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
            <>
              {catalogQuery.isError && (
                <Flex align="center" gap="3" wrap="wrap">
                  <Text color="fg.muted" fontSize="sm">
                    No se pudo identificar el sector y la tanda. El código QR
                    sigue disponible.
                  </Text>
                  <Button
                    onClick={() => void catalogQuery.refetch()}
                    size="xs"
                    variant="ghost"
                  >
                    Reintentar
                  </Button>
                </Flex>
              )}
              <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap="4">
                {ticketsQuery.data.map((ticket, index) => {
                  const location = getTicketLocation(
                    catalogQuery.data,
                    ticket.sectorByBatchId,
                  );

                  return (
                    <TicketQrCard
                      batchName={location.batchName}
                      eventName={eventName}
                      index={index}
                      key={ticket.id}
                      qrToken={ticket.qrToken}
                      sectorName={location.sectorName}
                    />
                  );
                })}
              </SimpleGrid>
            </>
          )}
        </Stack>
      )}
    </Box>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isClient = isClientRole(user?.roleName);

  const [page, setPage] = useState(1);

  const interestsQuery = useUserInterestsQuery(user?.id);
  const categoriesQuery = useAllEventCategoriesQuery();
  const buysQuery = useBuysQuery(page, isClient);
  const eventsQuery = useAllEventsQuery(isClient);

  const categoryNames = useMemo(
    () =>
      new Map(
        (categoriesQuery.data ?? []).map((category) => [
          category.id,
          category.name,
        ]),
      ),
    [categoriesQuery.data],
  );

  const eventsById = useMemo(
    () =>
      new Map<number, SimpleEventDto>(
        (eventsQuery.data ?? []).map((event) => [event.id, event]),
      ),
    [eventsQuery.data],
  );

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const interests = interestsQuery.data ?? [];
  const buys = buysQuery.data?.data ?? [];

  const editInterests = () => {
    navigate("/onboarding/interests", { state: { from: "/profile" } });
  };

  return (
    <Stack gap="8">
      <Box>
        <Heading color="fg" size="2xl">
          Mi perfil
        </Heading>
        <Text color="fg.muted" mt="2">
          Tus datos, tus intereses y tus compras en un solo lugar.
        </Text>
      </Box>

      <Box
        bg="bg.panel"
        borderColor="border"
        borderRadius="xl"
        borderWidth="1px"
        p={{ base: "4", md: "6" }}
      >
        <Heading color="fg" mb="5" size="md">
          Mis datos
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 2 }} gap="5">
          <InfoField label="Nombre" value={user.name ?? "Sin nombre"} />
          <InfoField
            label="Correo electrónico"
            value={user.email ?? "Sin correo"}
          />
        </SimpleGrid>
      </Box>

      <Box
        bg="bg.panel"
        borderColor="border"
        borderRadius="xl"
        borderWidth="1px"
        p={{ base: "4", md: "6" }}
      >
        <Flex align="center" gap="3" justify="space-between" mb="4" wrap="wrap">
          <Heading color="fg" size="md">
            Mis intereses
          </Heading>
          <Button onClick={editInterests} size="sm" variant="outline">
            Editar
          </Button>
        </Flex>

        {interestsQuery.isPending || categoriesQuery.isPending ? (
          <Flex align="center" color="fg.muted" gap="2" justify="center" py="8">
            <Spinner size="sm" />
            Cargando intereses...
          </Flex>
        ) : interestsQuery.isError ? (
          <Stack align="center" gap="3" py="6">
            <Text color="fg.error">
              {getErrorMessage(
                interestsQuery.error,
                "No se pudieron cargar tus intereses.",
              )}
            </Text>
            <Button
              onClick={() => void interestsQuery.refetch()}
              size="sm"
              variant="outline"
            >
              Reintentar
            </Button>
          </Stack>
        ) : interests.length === 0 ? (
          <EmptyState
            description="Elegí las categorías de eventos que quieres ver."
            title="Todavía no elegiste intereses"
          />
        ) : (
          <Flex gap="2" wrap="wrap">
            {interests.map((interest) => (
              <Badge
                colorPalette="brand"
                key={interest.id}
                size="md"
                variant="subtle"
              >
                {categoryNames.get(interest.categoryId) ??
                  `Categoría #${interest.categoryId}`}
              </Badge>
            ))}
          </Flex>
        )}
      </Box>

      {isClient && (
        <Box
          bg="bg.panel"
          borderColor="border"
          borderRadius="xl"
          borderWidth="1px"
          p={{ base: "4", md: "6" }}
        >
          <Flex align="center" gap="2" mb="4">
            <Ticket aria-hidden="true" color="brand.solid" size={20} />
            <Heading color="fg" size="md">
              Historial de compras
            </Heading>
          </Flex>

          {buysQuery.isPending ? (
            <Flex align="center" color="fg.muted" gap="2" justify="center" py="8">
              <Spinner size="sm" />
              Cargando tus compras...
            </Flex>
          ) : buysQuery.isError ? (
            <Stack align="center" gap="3" py="6">
              <Text color="fg.error">
                {getErrorMessage(
                  buysQuery.error,
                  "No se pudo cargar tu historial de compras.",
                )}
              </Text>
              <Button
                onClick={() => void buysQuery.refetch()}
                size="sm"
                variant="outline"
              >
                Reintentar
              </Button>
            </Stack>
          ) : buys.length === 0 ? (
            <Stack align="center">
              <EmptyState
                description="Cuando compres entradas, vas a verlas acá."
                title="Todavía no tenés compras"
              />
              <Button asChild colorPalette="brand" size="sm">
                <Link to="/events">Explorar eventos</Link>
              </Button>
            </Stack>
          ) : (
            <>
              <Stack gap="3">
                {buys.map((buy) => {
                  const event = eventsById.get(buy.eventId);
                  return (
                    <PurchaseRow
                      buy={buy}
                      eventDate={event?.date}
                      eventName={event?.name ?? `Evento #${buy.eventId}`}
                      key={buy.id}
                    />
                  );
                })}
              </Stack>
              <PaginationControl
                itemLabel="compras"
                onPageChange={setPage}
                page={page}
                pagination={buysQuery.data?.pagination}
              />
            </>
          )}
        </Box>
      )}
    </Stack>
  );
}
