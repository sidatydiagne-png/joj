# Dakar Accueil 2026 — React + API Node

Le thème WordPress « Dakar Accueil 2026 » recodé en application React, avec un backend Node/Express + SQLite.

```
navigateur ──► Vercel (frontend React)  ──►  VPS (backend Express + SQLite + photos)
                dossier frontend/              dossier backend/
```

| Dans WordPress | Maintenant |
|---|---|
| Thème PHP (`templates/*.php`) | `frontend/src/pages/*.jsx` (même CSS, mêmes classes, même mascotte) |
| `main.js` (langue FR/EN) | `frontend/src/i18n.jsx` + `en.js` (même dictionnaire, même clé `dk_lang`) |
| Types de contenu (objets, agenda, sites, alertes, assistance) | Tables SQLite dans `backend/db.js` |
| `admin-post.php` + e-mails `wp_mail` | Routes `/api/...` dans `backend/server.js` + Nodemailer |
| Admin WordPress | Page `/admin` (protégée par un jeton) |

## 1. Lancer en local

Prérequis : Node.js 22 ou plus récent.

```bash
npm run install:all                      # installe racine + backend + frontend
cp backend/.env.example backend/.env     # puis édite backend/.env (voir ci-dessous)
cp frontend/.env.example frontend/.env
npm run dev                              # API sur :3001, site sur http://localhost:5173
```

Dans `backend/.env`, mets au minimum un `ADMIN_TOKEN` (16 caractères ou plus) :

```bash
node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"
```

Ouvre ensuite `http://localhost:5173/admin` pour ajouter des événements, des alertes, des sites.

> Si `better-sqlite3` ne s'installe pas sur Windows, installe les « Outils de génération Visual Studio » (charge de travail C++), ou utilise Node 22 LTS.

## 2. Déployer le backend sur le VPS (Ubuntu)

Il te faut un sous-domaine qui pointe vers l'IP du VPS (enregistrement DNS de type A, ex. `api.ton-domaine.com`). Le HTTPS est obligatoire : le site Vercel est en HTTPS et le navigateur refuse d'appeler une API en HTTP.

```bash
# Paquets
sudo apt update && sudo apt install -y nginx git sqlite3 build-essential
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt install -y nodejs
sudo npm install -g pm2

# Code
git clone https://github.com/TON-COMPTE/dakar-accueil-2026.git
cd dakar-accueil-2026/backend
npm ci --omit=dev
cp .env.example .env && nano .env
```

Dans `.env` : `CORS_ORIGIN` = l'adresse de ton site Vercel (tu la connaîtras à l'étape 3, tu pourras revenir la remplir), `ADMIN_TOKEN`, et si tu veux des e-mails les lignes `SMTP_*`.

```bash
# Démarrage automatique
pm2 start ../deploy/ecosystem.config.cjs
pm2 save && pm2 startup          # copie-colle la commande que PM2 affiche

# Nginx
sudo cp ../deploy/nginx-api.conf /etc/nginx/sites-available/dakar-api
sudo nano /etc/nginx/sites-available/dakar-api          # change server_name
sudo ln -s /etc/nginx/sites-available/dakar-api /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# HTTPS gratuit
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.ton-domaine.com

# Pare-feu : seuls SSH et le web sont ouverts (le port 3001 reste interne)
sudo ufw allow OpenSSH && sudo ufw allow 'Nginx Full' && sudo ufw enable
```

Test : `curl https://api.ton-domaine.com/api/health` doit répondre `{"ok":true}`.

Sauvegardes : `deploy/backup.sh` copie la base et les photos (dossier `backend/data`). Ajoute-le dans `crontab -e`.

Mise à jour du code plus tard : `git pull && cd backend && npm ci --omit=dev && pm2 restart dakar-accueil-api`.

## 3. Déployer le frontend sur Vercel

1. Pousse le projet sur GitHub (dépôt `dakar-accueil-2026`, sans le fichier `.env`).
2. Sur vercel.com : **Add New → Project**, importe le dépôt.
3. **Root Directory : `frontend`**. Vercel détecte Vite tout seul.
4. **Environment Variables** : `VITE_API_URL` = `https://api.ton-domaine.com` (sans `/` à la fin).
5. **Deploy**.
6. Copie l'adresse obtenue (ex. `https://dakar-accueil.vercel.app`) dans `CORS_ORIGIN` du `.env` du VPS (plusieurs adresses possibles, séparées par des virgules, par exemple Vercel + ton domaine), puis `pm2 restart dakar-accueil-api`.

`VITE_API_URL` est lue au moment de la construction du site : si tu la changes, relance un déploiement sur Vercel.

## 4. Gérer le contenu

`https://ton-site/admin` → entre le `ADMIN_TOKEN`. Tu y trouves :
les demandes d'assistance (avec le contact), les messages « objets perdus », les objets déclarés (avec l'e-mail du déclarant, pour modérer et supprimer), l'agenda, les sites de la carte, les alertes.

## 5. Sécurité en place

- E-mail du déclarant jamais renvoyé par l'API publique ; le message est transmis par e-mail (ou lu dans `/admin` si le SMTP n'est pas configuré).
- Photos : 5 Mo maximum, JPG/PNG/WebP/GIF uniquement, vérifiées sur leur contenu réel, renommées aléatoirement.
- Limites de débit par IP (formulaires, connexion admin), champ piège anti-robots, validation de toutes les entrées, requêtes SQL préparées.
- CORS restreint à ton site, en-têtes de sécurité (Helmet), jeton admin comparé en temps constant, API écoutant seulement en local derrière Nginx.
- « Mes demandes » : chaque demande reçoit un jeton aléatoire gardé dans le navigateur ; personne ne peut lister les demandes des autres.

## 6. À savoir

- **Référencement (SEO)** : une application React ne fournit pas de HTML déjà rempli aux moteurs de recherche, ce qui est moins favorable que WordPress. Pour un vrai travail de SEO, il faudra du rendu côté serveur (par exemple Next.js).
- Les contenus saisis dans l'admin (titres d'événements, alertes…) ne sont pas traduits ; les textes du portail le sont.
- Les pages WordPress optionnelles « Adresses utiles » et « Conseils » éditables ne sont pas reprises : ces textes sont dans `Guide.jsx` et `Tips.jsx`.
- Les e-mails ne partent que si `SMTP_*` est rempli (un compte Gmail avec mot de passe d'application, ou un service comme Brevo, fonctionne).
