import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "../layouts/AppLayout";
import Dashboard from "../pages/dashboard";
import Login from "../pages/login";
import Register from "../pages/register";
import { ProtectedRoute } from "./guard/ProtectedRoute";
import { PublicRoute } from "./guard/PublicRoute";
import EventCreate from "../pages/Events/eventCreate";
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
          {path:"/event/create",element:<EventCreate/>}
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/login" replace /> },
]);
