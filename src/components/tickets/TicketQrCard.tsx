import { Box, Button, Dialog, Portal, Stack, Text } from "@chakra-ui/react";
import { Maximize2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";

export interface TicketLocation {
  sectorName?: string;
  batchName?: string;
}

interface TicketCatalogStructure {
  sectors: Array<{ id: number; name: string }>;
  batches: Array<{ id: number; name: string }>;
  prices: Array<{ id: number; sectorId: number; batchId: number }>;
}

export function getTicketLocation(
  structure: TicketCatalogStructure | undefined,
  sectorByBatchId: number,
): TicketLocation {
  const price = structure?.prices.find((item) => item.id === sectorByBatchId);
  if (!price) {
    return {};
  }

  return {
    sectorName: structure?.sectors.find((sector) => sector.id === price.sectorId)
      ?.name,
    batchName: structure?.batches.find((batch) => batch.id === price.batchId)
      ?.name,
  };
}

interface TicketQrCardProps extends TicketLocation {
  index: number;
  qrToken?: string | null;
  eventName?: string;
}

export function TicketQrCard({
  index,
  qrToken,
  sectorName,
  batchName,
  eventName,
}: TicketQrCardProps) {
  const [isQrOpen, setIsQrOpen] = useState(false);
  const ticketNumber = index + 1;
  const location = [sectorName, batchName].filter(Boolean).join(" · ");
  const qrLabel = `Código QR de la entrada ${ticketNumber}${
    eventName ? ` de ${eventName}` : ""
  }`;

  return (
    <Box
      alignItems="center"
      bg="bg"
      borderColor="border"
      borderRadius="lg"
      borderWidth="1px"
      display="flex"
      flexDirection="column"
      gap="3"
      p="4"
      textAlign="center"
    >
      <Stack gap="1">
        <Text color="fg" fontWeight="semibold">
          Entrada {ticketNumber}
        </Text>
        {location && (
          <Text color="fg.muted" fontSize="sm">
            {location}
          </Text>
        )}
      </Stack>

      {qrToken ? (
        <>
          <Box aria-label={qrLabel} bg="white" p="2" role="img">
            <QRCodeSVG includeMargin level="M" size={160} value={qrToken} />
          </Box>
          <Text color="fg.muted" fontSize="xs">
            Mostrá este código en el ingreso.
          </Text>
          <Button
            onClick={() => setIsQrOpen(true)}
            size="xs"
            variant="ghost"
          >
            <Maximize2 aria-hidden="true" size={14} />
            Ampliar
          </Button>
          <Dialog.Root
            onOpenChange={({ open }) => setIsQrOpen(open)}
            open={isQrOpen}
            size="sm"
          >
            <Portal>
              <Dialog.Backdrop />
              <Dialog.Positioner>
                <Dialog.Content>
                  <Dialog.Header>
                    <Dialog.Title>
                      Entrada {ticketNumber}
                      {eventName ? ` · ${eventName}` : ""}
                    </Dialog.Title>
                  </Dialog.Header>
                  <Dialog.Body>
                    <Stack align="center" gap="3">
                      {location && (
                        <Text color="fg.muted" fontSize="sm">
                          {location}
                        </Text>
                      )}
                      <Box aria-label={qrLabel} bg="white" p="3" role="img">
                        <QRCodeSVG
                          includeMargin
                          level="M"
                          size={240}
                          value={qrToken}
                        />
                      </Box>
                      <Text color="fg.muted" fontSize="sm" textAlign="center">
                        Mostrá este código en el ingreso.
                      </Text>
                    </Stack>
                  </Dialog.Body>
                  <Dialog.Footer>
                    <Button onClick={() => setIsQrOpen(false)} variant="outline">
                      Cerrar
                    </Button>
                  </Dialog.Footer>
                  <Dialog.CloseTrigger />
                </Dialog.Content>
              </Dialog.Positioner>
            </Portal>
          </Dialog.Root>
        </>
      ) : (
        <Text color="fg.error" fontSize="sm">
          Esta entrada no tiene un código QR disponible.
        </Text>
      )}
    </Box>
  );
}
