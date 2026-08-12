#!/bin/bash
# ROYAL ORBITECH — lanceur (double-cliquez ce fichier)
cd "$(dirname "$0")"
clear
echo "=================================================="
echo "        ROYAL ORBITECH — Démarrage du site"
echo "=================================================="
echo

# 1) Node.js présent ?
if ! command -v node >/dev/null 2>&1; then
  echo "❌ Node.js n'est pas installé."
  echo "   Installez-le depuis https://nodejs.org (version LTS 22 ou +),"
  echo "   puis double-cliquez à nouveau sur ce fichier."
  echo
  read -p "Appuyez sur Entrée pour fermer..."
  exit 1
fi
echo "✅ Node.js détecté : $(node -v)"
echo

# 2) Dépendances installées ?
if [ ! -d node_modules ]; then
  echo "📦 Première installation des composants (patientez ~1 min)..."
  npm install || { echo "❌ Échec de l'installation."; read -p "Entrée pour fermer..."; exit 1; }
  echo "✅ Composants installés."
  echo
fi

# 3) Ouvre le navigateur puis démarre le serveur
echo "🌐 Ouverture de la boutique dans le navigateur..."
( sleep 2; open "http://localhost:3000" ) >/dev/null 2>&1 &
echo
echo "   Boutique : http://localhost:3000"
echo "   Admin    : http://localhost:3000/admin.html  (mot de passe : admin)"
echo
echo "   ⏹  Pour ARRÊTER le site : fermez cette fenêtre ou appuyez sur Ctrl + C."
echo "=================================================="
echo
npm start
