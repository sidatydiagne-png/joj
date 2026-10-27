import { useCallback, useEffect, useState } from "react";
import { api, errorMessage, photoSrc } from "../api.js";
import { formatDate } from "../format.js";
import { usePageTitle } from "../hooks.js";

// Page d'administration (remplace l'admin WordPress) : /admin, protégée par le jeton ADMIN_TOKEN du backend.
// Le jeton est gardé dans sessionStorage : il disparaît à la fermeture de l'onglet.
const TOKEN_KEY = "dk_admin_token";

const TYPE_OPTIONS = [["competition", "Compétition"], ["culture", "Culture"], ["public", "Public"]];
const KIND_OPTIONS = [["", "— Aucun —"], ["horaires", "Horaires"], ["circulation", "Circulation"], ["meteo", "Météo"]];

const TABS = [
  { key: "help-requests", label: "Demandes d'assistance", list: "/api/admin/help-requests" },
  { key: "messages", label: "Messages objets", list: "/api/admin/messages" },
  { key: "lost-items", label: "Objets déclarés", list: "/api/admin/lost-items" },
  {
    key: "events", label: "Agenda", list: "/api/events",
    fields: [
      { name: "title", label: "Titre", required: true },
      { name: "date", label: "Date", type: "date" },
      { name: "place", label: "Lieu" },
      { name: "type", label: "Type", type: "select", options: TYPE_OPTIONS },
    ],
  },
  {
    key: "sites", label: "Sites de la carte", list: "/api/sites",
    fields: [
      { name: "title", label: "Nom du site", required: true },
      { name: "description", label: "Description", type: "textarea" },
      { name: "x", label: "Position X (0 à 480)", type: "number", required: true },
      { name: "y", label: "Position Y (0 à 360)", type: "number", required: true },
    ],
  },
  {
    key: "alerts", label: "Alertes", list: "/api/alerts",
    fields: [
      { name: "title", label: "Titre", required: true },
      { name: "body", label: "Texte", type: "textarea" },
      { name: "kind", label: "Type d'alerte", type: "select", options: KIND_OPTIONS },
    ],
  },
];

// Comment afficher une ligne de chaque tableau
function describe(tab, r) {
  const when = formatDate(r.createdAt, "fr");
  switch (tab) {
    case "help-requests": return { title: `${r.name} — ${r.subject}`, sub: `${r.contact} · ${when}`, body: r.message };
    case "messages": return { title: `${r.name} → ${r.itemTitle}`, sub: `${r.contact} · ${when}`, body: r.message };
    case "lost-items": return { title: `[${r.type === "trouve" ? "trouvé" : "perdu"}] ${r.title}`, sub: `${r.category} · ${r.place} · ${r.email} · ${when}`, photo: r.photo };
    case "events": return { title: r.title, sub: `${r.date || "—"} · ${r.place || ""} · ${r.type}` };
    case "sites": return { title: r.title, sub: `x ${r.x} · y ${r.y}`, body: r.description };
    default: return { title: r.title, sub: `${r.kind || "—"} · ${when}`, body: r.body };
  }
}

export default function Admin() {
  usePageTitle("Administration");
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY) || "");
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(Boolean(sessionStorage.getItem(TOKEN_KEY)));
  const [error, setError] = useState("");

  const verify = useCallback(async (value) => {
    setError("");
    try {
      await api("/api/admin/check", { token: value });
      sessionStorage.setItem(TOKEN_KEY, value);
      setToken(value);
      setReady(true);
    } catch (err) {
      sessionStorage.removeItem(TOKEN_KEY);
      setReady(false);
      setError(errorMessage(err));
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem(TOKEN_KEY);
    if (saved) verify(saved);
  }, [verify]);

  function logout() {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken("");
    setReady(false);
  }

  return (
    <main id="main">
      <section className="mod" data-accent="teal" style={{ borderBottom: "none", minHeight: "60vh" }}>
        <div className="wrap">
          <div className="mod-head">
            <h1>Administration</h1>
            {ready && <button className="contact-btn" onClick={logout} style={{ marginLeft: "auto" }}>Se déconnecter</button>}
          </div>

          {checking ? (
            <p>Vérification…</p>
          ) : !ready ? (
            <form className="card" style={{ maxWidth: 420 }} onSubmit={(e) => { e.preventDefault(); verify(token.trim()); }}>
              <div className="field">
                <label htmlFor="adm-token">Jeton d'administration</label>
                <input id="adm-token" type="password" autoComplete="current-password" value={token} onChange={(e) => setToken(e.target.value)} required />
              </div>
              {error && <p style={{ color: "var(--clay)" }}>{error}</p>}
              <button className="btn btn-primary" type="submit">Se connecter</button>
            </form>
          ) : (
            <Dashboard token={token} onAuthError={logout} />
          )}
        </div>
      </section>
    </main>
  );
}

function Dashboard({ token, onAuthError }) {
  const [tabKey, setTabKey] = useState(TABS[0].key);
  const tab = TABS.find((t) => t.key === tabKey);
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      setRows(await api(tab.list, { token }));
    } catch (err) {
      if (err.status === 401 || err.status === 429) return onAuthError();
      setRows([]);
      setError(errorMessage(err));
    }
  }, [tab, token, onAuthError]);

  useEffect(() => {
    setRows(null);
    load();
  }, [load]);

  async function remove(id) {
    if (!window.confirm("Supprimer définitivement cet élément ?")) return;
    try {
      await api(`/api/admin/${tab.key}/${id}`, { method: "DELETE", token });
      load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function add(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const body = Object.fromEntries(new FormData(form));
    try {
      await api(`/api/admin/${tab.key}`, { method: "POST", body, token });
      form.reset();
      load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <>
      <div className="filters" style={{ margin: "6px 0 22px" }}>
        {TABS.map((t) => (
          <button key={t.key} className={t.key === tabKey ? "active" : ""} onClick={() => setTabKey(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {error && <p style={{ color: "var(--clay)" }}>{error}</p>}

      <div className="two-col">
        {tab.fields && (
          <form className="card" onSubmit={add} style={{ alignSelf: "start" }}>
            <h3 style={{ fontSize: "1.05rem", marginBottom: 14 }}>Ajouter</h3>
            {tab.fields.map((f) => (
              <div className="field" key={f.name}>
                <label htmlFor={"adm-" + f.name}>{f.label}</label>
                {f.type === "textarea" ? (
                  <textarea id={"adm-" + f.name} name={f.name} required={f.required} />
                ) : f.type === "select" ? (
                  <select id={"adm-" + f.name} name={f.name}>
                    {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                ) : (
                  <input id={"adm-" + f.name} name={f.name} type={f.type || "text"} required={f.required} />
                )}
              </div>
            ))}
            <button className="btn btn-primary" type="submit">Ajouter</button>
          </form>
        )}

        <div style={tab.fields ? undefined : { gridColumn: "1 / -1" }}>
          <div className="item-list">
            {rows === null ? (
              <div className="empty">Chargement…</div>
            ) : rows.length === 0 ? (
              <div className="empty">Rien pour le moment.</div>
            ) : (
              rows.map((r) => {
                const d = describe(tab.key, r);
                return (
                  <div className="item" key={r.id}>
                    {d.photo && <img src={photoSrc(d.photo)} alt="" width="64" height="64" loading="lazy" />}
                    <div className="meta">
                      <h4>{d.title}</h4>
                      <div className="sub">{d.sub}</div>
                      {d.body && <p style={{ margin: "0 0 8px", whiteSpace: "pre-wrap" }}>{d.body}</p>}
                      <button className="contact-btn" onClick={() => remove(r.id)}>Supprimer</button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}
