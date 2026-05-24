# Gestock-Ferme

Application de gestion intégrée pour ferme (Élevage, Personnel, Stocks, Achats, Ventes).

## Objectif
Centraliser toutes les données de la ferme pour améliorer la traçabilité, réduire les pertes, optimiser les coûts et faciliter la prise de décision.

## Fonctionnalités (Modules)
- **Élevage**: Suivi des lots, planning sanitaire, rations, performances.
- **Cultures**: Parcelles, calendriers, intrants, rendements.
- **Stocks et Magasin**: Gestion des entrées/sorties, alertes de seuil, inventaire.
- **Achats**: Commandes, fournisseurs, réceptions.
- **Ventes**: Catalogue, facturation, suivi clients (dettes).
- **Personnel et Paie**: Dossiers employés, présence, paie.
- **Trésorerie**: Caisse, banque, budgets, états financiers simples.
- **Maintenance**: Équipements, véhicules, bâtiments.
- **Tableaux de bord**: Indicateurs de performance (mortalité, GMQ, marge, etc.).

## Installation

Suivez ces étapes pour installer et lancer le projet localement.

### Prérequis
- [Node.js](https://nodejs.org/) (version 18 ou supérieure recommandée)
- [PostgreSQL](https://www.postgresql.org/) (installé et en cours d'exécution)

### 1. Configuration de la Base de Données
1. Connectez-vous à votre instance PostgreSQL.
2. Créez une nouvelle base de données nommée `gestock_ferme`.
3. Exécutez le script SQL situé dans `database/schema.sql` pour créer les tables et les rôles initiaux.
   ```bash
   psql -d gestock_ferme -f database/schema.sql
   ```

### 2. Configuration du Backend
1. Naviguez vers le dossier backend :
   ```bash
   cd backend
   ```
2. Installez les dépendances :
   ```bash
   npm install
   ```
3. Démarrez le serveur :
   ```bash
   node index.js
   ```
   Le serveur sera accessible à l'adresse `http://localhost:3000`.

### 3. Configuration du Frontend
1. Naviguez vers le dossier frontend (depuis la racine) :
   ```bash
   cd frontend
   ```
2. Installez les dépendances :
   ```bash
   npm install
   ```
3. Démarrez l'application React :
   ```bash
   npm start
   ```
   L'application sera accessible à l'adresse `http://localhost:3000` (ou un autre port si le 3000 est déjà pris par le backend). *Note: En développement, React vous proposera probablement d'utiliser le port 3001.*

## Caractéristiques Techniques
- **Backend**: Node.js / Express
- **Base de données**: PostgreSQL
- **Frontend**: React (Responsive & PWA)
- **Authentification**: JWT avec gestion des rôles (Admin, Gestionnaire, Magasinier, Vétérinaire, RH, Ventes).
- **Langue**: Français
- **Devise**: FCFA
