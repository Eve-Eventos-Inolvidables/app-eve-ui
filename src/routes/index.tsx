import { createBrowserRouter, Navigate } from "react-router-dom";
import { PublicRoute } from "./guard/PublicRoute";
import { ProtectedRoute } from "./guard/ProtectedRoute";
import Login from "../pages/login";

const protectedRoutes = [
  {
    element: null,  //Layout TODO
    children: [
      { path: "/dash", element: null }
    ]
  }
]

export const router = createBrowserRouter([
  {
    element: <PublicRoute />,
    children: [
      { path: "/login", element: <Login /> }
    ]
  },
  {
    element: <ProtectedRoute />,
    children: protectedRoutes
  },
  { path: "*", element: <Navigate to="/login" replace /> },
]
)


