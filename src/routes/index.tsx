import { createBrowserRouter, Outlet } from "react-router-dom";
import { AppLayout } from "../layouts/AppLayout";
import { AuthLayout } from "../layouts/AuthLayout";
import { ProtectedRoute } from "./guard/ProtectedRoute";
import { PublicRoute } from "./guard/PublicRoute";
import { RequireManager } from "./guard/RequireManager";
import { RequirePermission } from "./guard/RequirePermission";
import { RoleHomeRedirect } from "./guard/RoleHomeRedirect";
import NotFound from "../pages/notFound";
import {
  Dashboard,
  EventCategories,
  EventCreate,
  EventDetails,
  EventsCatalog,
  EventManagers,
  Login,
  ManagerDashboard,
  Register,
  UserManagement,
} from "./lazyPages";

export const router = createBrowserRouter([
  {
    element: <PublicRoute />,
    children: [
      {
        element: (
          <AuthLayout>
            <Outlet />
          </AuthLayout>
        ),
        children: [
          { path: "/login", element: <Login /> },
          { path: "/register", element: <Register /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <RoleHomeRedirect /> },
          { path: "/events", element: <EventsCatalog /> },
          { path: "/events/:eventId", element: <EventDetails /> },
          { path: "/dash", element: <Dashboard /> },
          {
            element: <RequireManager />,
            children: [{ path: "/manager", element: <ManagerDashboard /> }],
          },
          {
            element: <RequirePermission />,
            children: [
              { path: "/managers", element: <EventManagers /> },
              { path: "/categories", element: <EventCategories /> },
              { path: "/users", element: <UserManagement /> },
              { path: "/event/create", element: <EventCreate /> },
            ],
          },
        ],
      },
    ],
  },
  { path: "*", element: <NotFound /> },
]);
