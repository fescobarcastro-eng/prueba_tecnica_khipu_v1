import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import App from "./components/App";
import Checkout from "./pages/Checkout";
import Return from "./pages/Return";
import Cancel from "./pages/Cancel";
import PayEmbedded from "./pages/PayEmbedded";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Checkout /> },
      { path: "return", element: <Return /> },
      { path: "cancel", element: <Cancel /> },
      {
        path: "embedded",
        element: (
          <PayEmbedded />
        ),
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
