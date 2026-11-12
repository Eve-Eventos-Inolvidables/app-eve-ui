import { Box, Button, Heading, Stack, Text } from "@chakra-ui/react";
import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Error no controlado en la interfaz", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <Box bg="bg" minH="100vh" px="4" py="16">
          <Stack
            align="center"
            gap="4"
            maxW="lg"
            mx="auto"
            textAlign="center"
          >
            <Heading color="fg" size="2xl">
              Algo salió mal
            </Heading>
            <Text color="fg.muted">
              Ocurrió un error inesperado al mostrar esta página.
            </Text>
            <Button
              colorPalette="brand"
              onClick={() => window.location.reload()}
            >
              Recargar página
            </Button>
          </Stack>
        </Box>
      );
    }

    return this.props.children;
  }
}
