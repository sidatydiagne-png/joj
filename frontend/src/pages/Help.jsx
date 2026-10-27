import { useCallback, useEffect, useState } from "react";
import ModulePage from "../components/ModulePage.jsx";
import { useToast } from "../components/Toast.jsx";
import { useLang } from "../i18n.jsx";
import { api, errorMessage } from "../api.js";
import { trimWords } from "../format.js";

// Pas de compte utilisateur : chaque demande envoyée donne un jeton secret gardé dans ce navigateur,
// ce qui permet d'afficher « Mes demandes » sans jamais exposer celles des autres.
const KEY = "dk_help_tokens";
const readTokens = () => {
  try {
    const list = JSON.parse(localStorage.getItem(KEY));
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};
const SUBJECTS = { aide: "Demander de l'aide", probleme: "Signaler un problème", autre: "Autre" };

export default function Help() {
  const { t } = useLang();
  const toast = useToast();
  const [mine, setMine] = useState([]);
  const [sending, setSending] = useState(false);

  const loadMine = useCallback(async () => {
    const tokens = readTokens();
    if (!tokens.length) return setMine([]);
    try {
      setMine(await api("/api/help-requests/mine", { method: "POST", body: { tokens } }));
    } catch {
      /* la liste reste vide si le serveur est injoignable */
    }
  }, []);

  useEffect(() => {
    loadMine();
  }, [loadMine]);

  async function onSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const body = Object.fromEntries(new FormData(form));
    setSending(true);
    try {
      const { token } = await api("/api/help-requests", { method: "POST", body });
      try {
        localStorage.setItem(KEY, JSON.stringify([...readTokens(), token].slice(-20)));
      } catch {
        /* stockage indisponible */
      }
      form.reset();
      toast(t("Demande envoyée."));
      loadMine();
    } catch (err) {
      toast(t(errorMessage(err)));
    } finally {
      setSending(false);
    }
  }

  return (
    <ModulePage
      slug="assistance"
      title="Formulaire d'assistance"
      intro="Besoin d'aide ou envie de signaler un problème ? Écrivez-nous, une équipe du portail vous répondra."
    >
      <div className="two-col">
        <form className="card" onSubmit={onSubmit}>
          <div style={{ position: "absolute", left: "-9999px" }} aria-hidden="true">
            <input name="website" tabIndex={-1} autoComplete="off" />
          </div>
          <div className="field"><label htmlFor="hf-name">{t("Nom")}</label><input id="hf-name" name="name" required maxLength={80} /></div>
          <div className="field"><label htmlFor="hf-contact">{t("Email ou téléphone")}</label><input id="hf-contact" name="contact" required maxLength={120} /></div>
          <div className="field">
            <label htmlFor="hf-subject">{t("Sujet")}</label>
            <select id="hf-subject" name="subject">
              {Object.entries(SUBJECTS).map(([value, label]) => <option key={value} value={value}>{t(label)}</option>)}
            </select>
          </div>
          <div className="field"><label htmlFor="hf-msg">Message</label><textarea id="hf-msg" name="message" required maxLength={2000} /></div>
          <button type="submit" className="btn btn-primary" disabled={sending}>
            {sending ? t("Envoi...") : t("Envoyer la demande")}
          </button>
        </form>

        <div>
          <h3 style={{ fontSize: "1.05rem", marginBottom: 14 }}>{t("Mes demandes")}</h3>
          <div className="item-list">
            {mine.length === 0 ? (
              <div className="empty">{t("Aucune demande envoyée pour le moment depuis ce navigateur.")}</div>
            ) : (
              mine.map((r) => (
                <div className="item" key={r.token}>
                  <div className="meta">
                    <span className="badge">{t(SUBJECTS[r.subject] || "Autre")}</span>
                    <h4>{r.name}</h4>
                    <div className="sub">{trimWords(r.message, 20)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </ModulePage>
  );
}
