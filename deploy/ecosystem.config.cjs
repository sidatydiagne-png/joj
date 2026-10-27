// Lance l'API avec PM2 (redémarrage automatique en cas de plantage ou de reboot du VPS) :
//   pm2 start deploy/ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: "dakar-accueil-api",
      script: "server.js",
      cwd: __dirname + "/../backend", // le fichier .env du backend est lu depuis ce dossier
      env: { NODE_ENV: "production" },
      max_memory_restart: "300M",
    },
  ],
};
