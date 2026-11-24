import { Badge, Box, Button, Flex, Heading, Stack, Text } from "@chakra-ui/react";
import { ArrowRight, CalendarDays } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { SimpleEventDto } from "../../types/event.types";
import {
  formatEventDate,
  getSafeEventColor,
  getTodayDateValue,
} from "../../utils/eventFormatting";

export function EventCard({ event }: { event: SimpleEventDto }) {
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
