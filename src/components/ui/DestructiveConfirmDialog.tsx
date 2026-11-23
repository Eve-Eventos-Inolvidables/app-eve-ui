import { Button, Dialog, Portal, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";

interface DestructiveConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void;
}

export function DestructiveConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Eliminar",
  cancelLabel = "Cancelar",
  isLoading = false,
  onConfirm,
}: DestructiveConfirmDialogProps) {
  const handleOpenChange = ({ open: nextOpen }: { open: boolean }) => {
    if (!nextOpen && isLoading) {
      return;
    }

    onOpenChange(nextOpen);
  };

  return (
    <Dialog.Root
      onOpenChange={handleOpenChange}
      open={open}
      role="alertdialog"
      size="sm"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{title}</Dialog.Title>
            </Dialog.Header>

            {description && (
              <Dialog.Body>
                <Text color="fg.muted">{description}</Text>
              </Dialog.Body>
            )}

            <Dialog.Footer>
              <Button
                disabled={isLoading}
                onClick={() => onOpenChange(false)}
                variant="outline"
              >
                {cancelLabel}
              </Button>
              <Button
                colorPalette="red"
                loading={isLoading}
                onClick={onConfirm}
              >
                {confirmLabel}
              </Button>
            </Dialog.Footer>

            <Dialog.CloseTrigger disabled={isLoading} />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
