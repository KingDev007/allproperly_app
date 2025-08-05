import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import Layout from "./components/Layout";
import Properties from "./pages/Properties";
import AddProperty from "./pages/AddProperty";
import PropertyDetail from "./pages/PropertyDetail";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route element={<Layout />}>
          <Route path="/properties" element={<Properties />} />
          <Route path="/properties/new" element={<AddProperty />} />
          <Route path="/property/:id" element={<PropertyDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);