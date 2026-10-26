import { Button, Field, Input, InputGroup, Link, Stack, Text } from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { FiLock, FiMail } from "react-icons/fi";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { AuthCard } from "../components/auth/AuthCard";
import { toaster } from "../components/ui/chakra-base/toaster-instance";
import { AuthLayout } from "../layouts/AuthLayout";
import { useLoginMutation } from "../queries/auth.queries";
import {
  loginSchema,
  type LoginFormValues,
} from "../schemas/auth.schema";
import { getErrorMessage } from "../utils/error";

export default function Login() {
  const navigate = useNavigate();
  const loginMutation = useLoginMutation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit((values) => {
    loginMutation.mutate(values, {
      onSuccess: () => {
        toaster.create({
          title: "Sesión iniciada",
          description: "Bienvenido de vuelta a EVE",
          type: "success",
        });
        navigate("/dash", { replace: true });
      },
      onError: (error) => {
        toaster.create({
          title: "No se pudo iniciar sesión",
          description: getErrorMessage(error),
          type: "error",
        });
      },
    });
  });

  return (
    <AuthLayout>
      <AuthCard
        title="Bienvenido a EVE"
        subtitle="Inicia sesión para gestionar tus eventos"
        footer={
          <Text color="fg.muted" fontSize="sm">
            ¿No tienes cuenta?{" "}
            <Link asChild color="brand.solid" fontWeight="semibold">
              <RouterLink to="/register">Regístrate</RouterLink>
            </Link>
          </Text>
        }
      >
        <form noValidate onSubmit={onSubmit}>
          <Stack gap="5">
            <Field.Root invalid={Boolean(errors.email)}>
              <Field.Label>Correo electrónico</Field.Label>
              <InputGroup startElement={<FiMail />}>
                <Input
                  autoComplete="email"
                  placeholder="tu@correo.com"
                  type="email"
                  {...register("email")}
                />
              </InputGroup>
              <Field.ErrorText>{errors.email?.message}</Field.ErrorText>
            </Field.Root>

            <Field.Root invalid={Boolean(errors.password)}>
              <Field.Label>Contraseña</Field.Label>
              <InputGroup startElement={<FiLock />}>
                <Input
                  autoComplete="current-password"
                  placeholder="Tu contraseña"
                  type="password"
                  {...register("password")}
                />
              </InputGroup>
              <Field.ErrorText>{errors.password?.message}</Field.ErrorText>
            </Field.Root>

            <Button
              colorPalette="brand"
              loading={loginMutation.isPending}
              loadingText="Ingresando..."
              type="submit"
              w="full"
            >
              Iniciar sesión
            </Button>
          </Stack>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}
