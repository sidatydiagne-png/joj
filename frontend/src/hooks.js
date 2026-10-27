import { useCallback, useEffect, useState } from "react";
import { api, errorMessage } from "./api.js";
import { SITE_NAME } from "./pages.js";

export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} — ${SITE_NAME}` : SITE_NAME;
  }, [title]);
}

// Charge une route GET de l'API. reload() relance la requête (ex. après un envoi de formulaire).
export function useApi(path) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let alive = true;
    api(path)
      .then((data) => alive && setState({ data, loading: false, error: null }))
      .catch((err) => alive && setState({ data: null, loading: false, error: errorMessage(err) }));
    return () => {
      alive = false;
    };
  }, [path, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { ...state, reload };
}
