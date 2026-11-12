import { Suspense } from "react";
import { RouterProvider } from "react-router-dom";
import { RouteFallback } from "./components/ui/RouteFallback";
import { router } from "./routes";

function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <RouterProvider router={router} />
    </Suspense>
  );
}

export default App;
