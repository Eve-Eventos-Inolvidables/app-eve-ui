import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { AppLayout } from "../layouts/AppLayout";
import { AuthLayout } from "../layouts/AuthLayout";
import { ProtectedRoute } from "./guard/ProtectedRoute";
import { PublicRoute } from "./guard/PublicRoute";
import { RequirePermission } from "./guard/RequirePermission";
import NotFound from "../pages/notFound";
import {
  Dashboard,
  EventCreate,
  EventManagers,
  Login,
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
          { index: true, element: <Navigate to="/dash" replace /> },
          { path: "/dash", element: <Dashboard /> },
          {
            element: <RequirePermission />,
            children: [
              { path: "/managers", element: <EventManagers /> },
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
