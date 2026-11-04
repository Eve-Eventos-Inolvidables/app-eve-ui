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
  Table,
  Text,
} from "@chakra-ui/react";
import { Users } from "lucide-react";
import { useState } from "react";
import type { Role } from "../../api/users.api";
import { toaster } from "../../components/ui/chakra-base/toaster-instance";
import {
  useAllUsersQuery,
  useRolesQuery,
  useUpdateUserMutation,
} from "../../queries/users.queries";
import type { UserDto } from "../../types/auth.types";
import { getErrorMessage } from "../../utils/error";

const PAGE_SIZE = 10;

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
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedRoleByUser, setSelectedRoleByUser] = useState<
    Record<number, string>
  >({});

  const usersQuery = useAllUsersQuery();
  const rolesQuery = useRolesQuery();
  const updateUserMutation = useUpdateUserMutation();

  const users = usersQuery.data ?? [];
  const roles = rolesQuery.data?.data ?? [];
  const activeRoles = roles.filter((role) => !role.archived);
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const filteredUsers = users.filter((user) =>
    `${user.name} ${user.email} ${user.roleName}`
      .toLocaleLowerCase()
      .includes(normalizedSearch),
  );
  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE);
  const currentPage = totalPages > 0 ? Math.min(pageIndex + 1, totalPages) : 1;
  const pageUsers = filteredUsers.slice(
    pageIndex * PAGE_SIZE,
    (pageIndex + 1) * PAGE_SIZE,
  );

  const handleRoleChange = (userId: number, roleId: string) => {
    setSelectedRoleByUser((current) => ({ ...current, [userId]: roleId }));
  };

  const handleSaveRole = (user: UserDto, currentRole?: Role) => {
    const roleId = Number(selectedRoleByUser[user.id]);
    const role = activeRoles.find((item) => item.id === roleId);

    if (!Number.isInteger(roleId) || !role || role.id === currentRole?.id) {
      return;
    }

    updateUserMutation.mutate(
      { id: user.id, body: { roleId } },
      {
        onSuccess: () => {
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
          <Users /> {users.length} usuarios
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
              placeholder="Buscar por nombre, correo o rol"
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

        <Table.ScrollArea>
          <Table.Root size="md" variant="line">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Usuario</Table.ColumnHeader>
                <Table.ColumnHeader>Email</Table.ColumnHeader>
                <Table.ColumnHeader>Rol actual</Table.ColumnHeader>
                <Table.ColumnHeader>Cambiar rol</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">Acción</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {usersQuery.isPending ? (
                <Table.Row>
                  <Table.Cell colSpan={5} color="fg.muted" textAlign="center">
                    Cargando usuarios...
                  </Table.Cell>
                </Table.Row>
              ) : usersQuery.isError ? (
                <Table.Row>
                  <Table.Cell colSpan={5} color="fg.muted" textAlign="center">
                    {getErrorMessage(
                      usersQuery.error,
                      "No se pudieron cargar los usuarios.",
                    )}
                  </Table.Cell>
                </Table.Row>
              ) : filteredUsers.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={5} color="fg.muted" textAlign="center">
                    No se encontraron usuarios.
                  </Table.Cell>
                </Table.Row>
              ) : (
                pageUsers.map((user) => {
                  const currentRole = getCurrentRole(user, roles);
                  const currentRoleId = currentRole
                    ? String(currentRole.id)
                    : "";
                  const selectedRoleId =
                    selectedRoleByUser[user.id] ?? currentRoleId;
                  const roleOptions = currentRole?.archived
                    ? [...activeRoles, currentRole]
                    : activeRoles;
                  const isUpdatingThisUser =
                    updateUserMutation.isPending &&
                    updateUserMutation.variables?.id === user.id;

                  return (
                    <Table.Row key={user.id}>
                      <Table.Cell fontWeight="medium">{user.name}</Table.Cell>
                      <Table.Cell color="fg.muted">{user.email}</Table.Cell>
                      <Table.Cell>
                        <Badge colorPalette="brand" variant="subtle">
                          {user.roleName || "Sin rol"}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell minW="52">
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
                            value={selectedRoleId}
                          >
                            <option value="">Selecciona un rol</option>
                            {roleOptions.map((role) => (
                              <option
                                disabled={role.archived}
                                key={role.id}
                                value={role.id}
                              >
                                {role.name}{role.archived ? " (archivado)" : ""}
                              </option>
                            ))}
                          </NativeSelect.Field>
                          <NativeSelect.Indicator />
                        </NativeSelect.Root>
                      </Table.Cell>
                      <Table.Cell textAlign="end">
                        <Button
                          colorPalette="brand"
                          disabled={
                            !selectedRoleId ||
                            selectedRoleId === currentRoleId ||
                            updateUserMutation.isPending ||
                            rolesQuery.isError
                          }
                          loading={isUpdatingThisUser}
                          onClick={() => handleSaveRole(user, currentRole)}
                          size="sm"
                        >
                          Guardar
                        </Button>
                      </Table.Cell>
                    </Table.Row>
                  );
                })
              )}
            </Table.Body>
          </Table.Root>
        </Table.ScrollArea>

        {!usersQuery.isPending &&
          !usersQuery.isError &&
          filteredUsers.length > 0 && (
            <Flex
              align="center"
              borderTopColor="border"
              borderTopWidth="1px"
              gap="3"
              justify="space-between"
              px="4"
              py="3"
            >
              <Text color="fg.muted" fontSize="sm">
                Página {currentPage} de {totalPages} · {filteredUsers.length} usuarios
              </Text>
              <Flex gap="2">
                <Button
                  disabled={pageIndex <= 0}
                  onClick={() =>
                    setPageIndex((current) => Math.max(current - 1, 0))
                  }
                  size="sm"
                  variant="outline"
                >
                  Anterior
                </Button>
                <Button
                  disabled={currentPage >= totalPages}
                  onClick={() => setPageIndex((current) => current + 1)}
                  size="sm"
                  variant="outline"
                >
                  Siguiente
                </Button>
              </Flex>
            </Flex>
          )}
      </Box>
    </Stack>
  );
}
