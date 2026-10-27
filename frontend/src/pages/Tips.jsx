import ModulePage from "../components/ModulePage.jsx";
import { useLang } from "../i18n.jsx";

const TIPS = [
  ["Sécurité", "Restez vigilant, gardez une copie de vos documents. Urgences : 17 ou 1515."],
  ["Déplacements", "Taxis jaune et noir, VTC, TER entre Dakar et Diamniadio, et la route pour rejoindre Saly."],
  ["Paiement", "Franc CFA (XOF). Cartes acceptées dans les grands établissements, Mobile Money ailleurs."],
  ["Connexion Internet", "Cartes SIM locales abordables. Wi-Fi gratuit dans la plupart des hôtels."],
  ["Coutumes sénégalaises", "La Teranga (hospitalité) est centrale : saluez chaleureusement."],
];

export default function Tips() {
  const { t } = useLang();
  return (
    <ModulePage
      slug="conseils"
      title="Conseils aux visiteurs"
      intro="Quelques repères pour profiter de votre séjour à Dakar en toute sérénité."
    >
      <div className="tips-grid">
        {TIPS.map(([title, text]) => (
          <div className="tip" key={title}>
            <h4>{t(title)}</h4>
            <p>{t(text)}</p>
          </div>
        ))}
      </div>
    </ModulePage>
  );
}
