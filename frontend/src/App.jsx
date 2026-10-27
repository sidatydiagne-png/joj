import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Home from "./pages/Home.jsx";
import LostFound from "./pages/LostFound.jsx";
import Guide from "./pages/Guide.jsx";
import SiteMap from "./pages/SiteMap.jsx";
import Agenda from "./pages/Agenda.jsx";
import Tips from "./pages/Tips.jsx";
import Alerts from "./pages/Alerts.jsx";
import Help from "./pages/Help.jsx";
import NotFound from "./pages/NotFound.jsx";

// La page d'administration n'est téléchargée que lorsqu'on l'ouvre
const Admin = lazy(() => import("./pages/Admin.jsx"));

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="objets-perdus" element={<LostFound />} />
        <Route path="guide-pratique" element={<Guide />} />
        <Route path="carte" element={<SiteMap />} />
        <Route path="agenda" element={<Agenda />} />
        <Route path="conseils" element={<Tips />} />
        <Route path="alertes" element={<Alerts />} />
        <Route path="assistance" element={<Help />} />
        <Route
          path="admin"
          element={
            <Suspense fallback={null}>
              <Admin />
            </Suspense>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
