import { Button, Field, Input, InputGroup, Link, Stack, Text } from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { FiLock, FiMail, FiUser } from "react-icons/fi";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { AuthCard } from "../components/auth/AuthCard";
import { toaster } from "../components/ui/chakra-base/toaster-instance";
import { AuthLayout } from "../layouts/AuthLayout";
import { useRegisterMutation } from "../queries/auth.queries";
import {
  registerSchema,
  type RegisterFormValues,
} from "../schemas/auth.schema";
import { getErrorMessage } from "../utils/error";

export default function Register() {
  const navigate = useNavigate();
  const registerMutation = useRegisterMutation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = handleSubmit((values) => {
    registerMutation.mutate(values, {
      onSuccess: () => {
        toaster.create({
          title: "Cuenta creada",
          description: "Tu cuenta fue creada e iniciaste sesión",
          type: "success",
        });
        navigate("/dash", { replace: true });
      },
      onError: (error) => {
        toaster.create({
          title: "No se pudo crear la cuenta",
          description: getErrorMessage(error),
          type: "error",
        });
      },
    });
  });

  return (
    <AuthLayout>
      <AuthCard
        title="Crea tu cuenta"
        subtitle="Regístrate para empezar a organizar tus eventos"
        footer={
          <Text color="fg.muted" fontSize="sm">
            ¿Ya tienes cuenta?{" "}
            <Link asChild color="brand.solid" fontWeight="semibold">
              <RouterLink to="/login">Inicia sesión</RouterLink>
            </Link>
          </Text>
        }
      >
        <form noValidate onSubmit={onSubmit}>
          <Stack gap="5">
            <Field.Root invalid={Boolean(errors.name)}>
              <Field.Label>Nombre completo</Field.Label>
              <InputGroup startElement={<FiUser />}>
                <Input
                  autoComplete="name"
                  placeholder="Tu nombre"
                  {...register("name")}
                />
              </InputGroup>
              <Field.ErrorText>{errors.name?.message}</Field.ErrorText>
            </Field.Root>

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
                  autoComplete="new-password"
                  placeholder="Mínimo 6 caracteres"
                  type="password"
                  {...register("password")}
                />
              </InputGroup>
              <Field.ErrorText>{errors.password?.message}</Field.ErrorText>
            </Field.Root>

            <Button
              colorPalette="brand"
              loading={registerMutation.isPending}
              loadingText="Creando cuenta..."
              type="submit"
              w="full"
            >
              Crear cuenta
            </Button>
          </Stack>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}
