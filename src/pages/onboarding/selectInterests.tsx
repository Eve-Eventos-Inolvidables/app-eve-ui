import {
  Badge,
  Box,
  Button,
  CheckboxCard,
  Flex,
  Heading,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { ArrowRight, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { EmptyState } from "../../components/ui/EmptyState";
import { toaster } from "../../components/ui/chakra-base/toaster-instance";
import { useAllEventCategoriesQuery } from "../../queries/eventCategory.queries";
import { useCreateUserInterestMutation, useUserInterestsQuery } from "../../queries/userInterest.queries";
import { useAuthStore } from "../../stores/auth.store";
import { getErrorMessage } from "../../utils/error";
import { getLandingPath } from "../../utils/roleNavigation";

export default function SelectInterests() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const setOnboardingPending = useAuthStore(
    (state) => state.setOnboardingPending,
  );
  const categoriesQuery = useAllEventCategoriesQuery();
  const interestsQuery = useUserInterestsQuery(user?.id);
  const createInterestMutation = useCreateUserInterestMutation();

  const [selectionOverride, setSelectionOverride] = useState<Set<number> | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);

  const preselectedIds = useMemo(
    () =>
      new Set(
        interestsQuery.data?.map((interest) => interest.categoryId) ?? [],
      ),
    [interestsQuery.data],
  );
  const selectedIds = selectionOverride ?? preselectedIds;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const categories = categoriesQuery.data ?? [];
  const isLoading = categoriesQuery.isPending || interestsQuery.isPending;
  const isCategoryError = categoriesQuery.isError;

  const toggleCategory = (categoryId: number, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) {
      next.add(categoryId);
    } else {
      next.delete(categoryId);
    }
    setSelectionOverride(next);
  };

  const goToLanding = () => {
    setOnboardingPending(false);
    const returnTo = (location.state as { from?: unknown } | null)?.from;
    const target =
      typeof returnTo === "string" && returnTo.startsWith("/")
        ? returnTo
        : getLandingPath(user.roleName);
    navigate(target, { replace: true });
  };

  const handleContinue = async () => {
    const alreadySaved = new Set(
      interestsQuery.data?.map((interest) => interest.categoryId) ?? [],
    );
    const pendingIds = [...selectedIds].filter((id) => !alreadySaved.has(id));

    if (pendingIds.length === 0) {
      goToLanding();
      return;
    }

    setIsSaving(true);
    try {
      const markedAt = new Date().toISOString().slice(0, 10);

      for (const categoryId of pendingIds) {
        await createInterestMutation.mutateAsync({
          userId: user.id,
          categoryId,
          markedAt,
        });
      }

      toaster.create({
        title: "Intereses guardados",
        description: "Tus preferencias ya están listas.",
        type: "success",
      });
      goToLanding();
    } catch (error) {
      toaster.create({
        title: "No se pudieron guardar tus intereses",
        description: getErrorMessage(error, "Intenta nuevamente."),
        type: "error",
      });
      void interestsQuery.refetch();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Stack gap="6" maxW="4xl" mx="auto">
      <Box>
        <Flex align="center" gap="2" mb="2">
          <Badge colorPalette="brand" variant="subtle">
            <Sparkles /> Paso 1 de 1
          </Badge>
        </Flex>
        <Heading color="fg" size="2xl">
          ¿Qué te interesa?
        </Heading>
        <Text color="fg.muted" mt="2">
          Elige las categorías de eventos que quieres ver. Podrás continuar sin
          seleccionar ninguna.
        </Text>
      </Box>

      <Box
        bg="bg.panel"
        borderColor="border"
        borderRadius="xl"
        borderWidth="1px"
        p={{ base: "4", md: "6" }}
      >
        {isLoading ? (
          <Flex align="center" color="fg.muted" gap="2" justify="center" py="10">
            <Spinner size="sm" />
            Cargando categorías...
          </Flex>
        ) : isCategoryError ? (
          <Stack align="center" gap="3" py="8">
            <Text color="fg.error">
              {getErrorMessage(categoriesQuery.error, "No se pudieron cargar las categorías.")}
            </Text>
            <Button onClick={() => void categoriesQuery.refetch()} size="sm" variant="outline">
              Reintentar
            </Button>
          </Stack>
        ) : categories.length === 0 ? (
          <EmptyState
            title="Aún no hay categorías disponibles"
            description="Puedes continuar y configurar tus intereses más adelante."
          />
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2 }} gap="3">
            {categories.map((category) => (
              <CheckboxCard.Root
                checked={selectedIds.has(category.id)}
                colorPalette="brand"
                key={category.id}
                onCheckedChange={(details) =>
                  toggleCategory(category.id, details.checked === true)
                }
                value={String(category.id)}
              >
                <CheckboxCard.HiddenInput />
                <CheckboxCard.Control>
                  <CheckboxCard.Content>
                    <CheckboxCard.Label>{category.name}</CheckboxCard.Label>
                  </CheckboxCard.Content>
                  <CheckboxCard.Indicator />
                </CheckboxCard.Control>
              </CheckboxCard.Root>
            ))}
          </SimpleGrid>
        )}
      </Box>

      <Flex align="center" gap="3" justify="space-between">
        <Text color="fg.muted" fontSize="sm">
          {selectedIds.size} {selectedIds.size === 1 ? "categoría seleccionada" : "categorías seleccionadas"}
        </Text>
        <Flex gap="3">
          <Button disabled={isSaving} onClick={goToLanding} variant="ghost">
            Saltar
          </Button>
          <Button
            colorPalette="brand"
            loading={isSaving}
            loadingText="Guardando..."
            onClick={() => void handleContinue()}
          >
            Continuar <ArrowRight />
          </Button>
        </Flex>
      </Flex>
    </Stack>
  );
}
