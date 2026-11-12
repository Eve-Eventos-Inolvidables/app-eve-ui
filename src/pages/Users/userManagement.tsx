import {
  Badge,
  Box,
  Button,
  Field,
  Flex,
  Heading,
  Input,
  NativeSelect,
  Stack,
  Text,
} from "@chakra-ui/react";
import { Users } from "lucide-react";
import { useState } from "react";
import type { Role } from "../../api/users.api";
import {
  DataTable,
  type DataTableColumn,
} from "../../components/ui/DataTable";
import { EmptyState } from "../../components/ui/EmptyState";
import { PaginationControl } from "../../components/ui/PaginationControl";
import { toaster } from "../../components/ui/chakra-base/toaster-instance";
import { USER_PAGE_SIZE } from "../../constants/pagination";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import {
  useGetRoles,
  useGetUsers,
  useUpdateUser,
} from "../../queries/users.queries";
import type { UserDto } from "../../types/auth.types";
import { getErrorMessage } from "../../utils/error";

interface UserRow extends UserDto {
  currentRole?: Role;
  selectedRoleId: string;
  roleOptions: Role[];
  isUpdating: boolean;
}

function getCurrentRole(user: UserDto, roles: Role[]): Role | undefined {
  return (
    roles.find((role) => role.id === user.roleId) ??
    roles.find(
      (role) =>
        role.name.trim().toLocaleLowerCase() ===
        user.roleName.trim().toLocaleLowerCase(),
    )
  );
}

export default function UserManagement() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim());
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedRoleByUser, setSelectedRoleByUser] = useState<
    Record<number, string>
  >({});

  const usersQuery = useGetUsers({
    page: pageIndex,
    size: USER_PAGE_SIZE,
    name: debouncedSearch || undefined,
  });
  const rolesQuery = useGetRoles();
  const updateUserMutation = useUpdateUser();

  const users = usersQuery.data?.data ?? [];
  const pagination = usersQuery.data?.pagination;
  const totalItems = pagination?.totalItems ?? 0;
  const roles = rolesQuery.data?.data ?? [];
  const activeRoles = roles.filter((role) => !role.archived);

  const rows: UserRow[] = users.map((user) => {
    const currentRole = getCurrentRole(user, roles);
    const currentRoleId = currentRole ? String(currentRole.id) : "";
    const selectedRoleId = selectedRoleByUser[user.id] ?? currentRoleId;
    const roleOptions = currentRole?.archived
      ? [...activeRoles, currentRole]
      : activeRoles;

    return {
      ...user,
      currentRole,
      selectedRoleId,
      roleOptions,
      isUpdating:
        updateUserMutation.isPending &&
        updateUserMutation.variables?.id === user.id,
    };
  });

  const handleRoleChange = (userId: number, roleId: string) => {
    setSelectedRoleByUser((current) => ({ ...current, [userId]: roleId }));
  };

  const handleSaveRole = (user: UserRow) => {
    const roleId = Number(user.selectedRoleId);
    const role = activeRoles.find((item) => item.id === roleId);

    if (!Number.isInteger(roleId) || !role || role.id === user.currentRole?.id) {
      return;
    }

    updateUserMutation.mutate(
      { id: user.id, body: { roleId } },
      {
        onSuccess: (response) => {
          if (!response.success) {
            toaster.create({
              title: "No se pudo actualizar el rol",
              description:
                response.message ??
                "Ocurrió un error al cambiar el rol del usuario.",
              type: "error",
            });
            return;
          }

          setSelectedRoleByUser((current) => ({
            ...current,
            [user.id]: String(role.id),
          }));
          toaster.create({
            title: "Rol actualizado",
            description: `${user.name} ahora tiene el rol ${role.name}.`,
            type: "success",
          });
        },
        onError: (error) => {
          toaster.create({
            title: "No se pudo actualizar el rol",
            description: getErrorMessage(
              error,
              "Ocurrió un error al cambiar el rol del usuario.",
            ),
            type: "error",
          });
        },
      },
    );
  };

  const columns: DataTableColumn<UserRow>[] = [
    {
      key: "name",
      header: "Usuario",
      render: (user) => <Text fontWeight="medium">{user.name}</Text>,
    },
    {
      key: "email",
      header: "Email",
      render: (user) => <Text color="fg.muted">{user.email}</Text>,
    },
    {
      key: "currentRole",
      header: "Rol actual",
      render: (user) => (
        <Badge colorPalette="brand" variant="subtle">
          {user.roleName || "Sin rol"}
        </Badge>
      ),
    },
    {
      key: "role",
      header: "Cambiar rol",
      minWidth: "52",
      render: (user) => (
        <NativeSelect.Root
          disabled={
            rolesQuery.isPending ||
            rolesQuery.isError ||
            updateUserMutation.isPending
          }
        >
          <NativeSelect.Field
            aria-label={`Nuevo rol para ${user.name}`}
            onChange={(event) =>
              handleRoleChange(user.id, event.target.value)
            }
            value={user.selectedRoleId}
          >
            <option value="">Selecciona un rol</option>
            {user.roleOptions.map((role) => (
              <option
                disabled={role.archived}
                key={role.id}
                value={role.id}
              >
                {role.name}
                {role.archived ? " (archivado)" : ""}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      ),
    },
    {
      key: "action",
      header: "Acción",
      align: "end",
      render: (user) => (
        <Button
          colorPalette="brand"
          disabled={
            !user.selectedRoleId ||
            user.selectedRoleId ===
              (user.currentRole ? String(user.currentRole.id) : "") ||
            updateUserMutation.isPending ||
            rolesQuery.isError
          }
          loading={user.isUpdating}
          onClick={() => handleSaveRole(user)}
          size="sm"
        >
          Guardar
        </Button>
      ),
    },
  ];

  return (
    <Stack gap="6">
      <Flex
        align={{ base: "flex-start", md: "center" }}
        direction={{ base: "column", md: "row" }}
        gap="4"
        justify="space-between"
      >
        <Box>
          <Heading color="fg" size="2xl">
            Gestión de usuarios
          </Heading>
          <Text color="fg.muted" mt="2">
            Consulta los usuarios y actualiza sus roles.
          </Text>
        </Box>
        <Badge colorPalette="brand" px="3" py="2" variant="subtle">
          <Users /> {totalItems} usuarios
        </Badge>
      </Flex>

      <Box
        bg="bg.panel"
        borderColor="border"
        borderRadius="xl"
        borderWidth="1px"
        overflow="hidden"
      >
        <Box borderBottomColor="border" borderBottomWidth="1px" p="4">
          <Field.Root>
            <Field.Label>Buscar usuario</Field.Label>
            <Input
              onChange={(event) => {
                setSearch(event.target.value);
                setPageIndex(0);
              }}
              placeholder="Buscar por nombre"
              value={search}
            />
          </Field.Root>
          {rolesQuery.isError && (
            <Text color="fg.error" fontSize="sm" mt="2">
              {getErrorMessage(
                rolesQuery.error,
                "No se pudieron cargar los roles disponibles.",
              )}
            </Text>
          )}
        </Box>

        <DataTable
          bordered={false}
          columns={columns}
          emptyState={<EmptyState title="No se encontraron usuarios" />}
          errorMessage={
            usersQuery.isError
              ? getErrorMessage(
                  usersQuery.error,
                  "No se pudieron cargar los usuarios.",
                )
              : undefined
          }
          isLoading={usersQuery.isPending}
          loadingMessage="Cargando usuarios..."
          onRetry={() => void usersQuery.refetch()}
          rows={rows}
          size="md"
        />

        <PaginationControl
          isFetching={usersQuery.isFetching}
          itemLabel="usuarios"
          onPageChange={setPageIndex}
          pageIndex={pageIndex}
          pagination={pagination}
        />
      </Box>
    </Stack>
  );
}
