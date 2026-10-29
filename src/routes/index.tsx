import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "../layouts/AppLayout";
import Dashboard from "../pages/dashboard";
import Login from "../pages/login";
import Register from "../pages/register";
import { ProtectedRoute } from "./guard/ProtectedRoute";
import { PublicRoute } from "./guard/PublicRoute";
import { RequirePermission } from "./guard/RequirePermission";
import EventCreate from "../pages/Events/eventCreate";
import EventManagers from "../pages/Managers/eventManagers";
export const router = createBrowserRouter([
  {
    element: <PublicRoute />,
    children: [
      { path: "/login", element: <Login /> },
      { path: "/register", element: <Register /> },
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
          { path: "/event/create", element: <EventCreate /> },
          {
            element: <RequirePermission />,
            children: [{ path: "/managers", element: <EventManagers /> }],
          },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/login" replace /> },
]);
