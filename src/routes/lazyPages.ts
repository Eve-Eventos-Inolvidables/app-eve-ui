import { lazy } from "react";

export const Dashboard = lazy(() => import("../pages/dashboard"));
export const Login = lazy(() => import("../pages/login"));
export const Register = lazy(() => import("../pages/register"));
export const EventCreate = lazy(() => import("../pages/Events/eventCreate"));
export const EventManagers = lazy(
  () => import("../pages/Managers/eventManagers"),
);
export const EventCategories = lazy(
  () => import("../pages/Categories/eventCategories"),
);
export const UserManagement = lazy(
  () => import("../pages/Users/userManagement"),
);
