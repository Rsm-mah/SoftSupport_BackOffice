# SoftSupport — back-office de la base de connaissances

Refonte du **back-office BDC** (ASP.NET MVC + AdminLTE) sur l'architecture et la charte graphique
de SOFTAPPLICATION / SoftHelp. Les fonctionnalités sont celles de BDC et la **base de données est
inchangée** : le nouveau backend se branche sur les tables existantes (base `BDC`) et sur le CRM
(`CRMSOFTWELL`) sans migration. Le portail client (FrontOffice BDC) n'est pas concerné.

## Structure

```
SoftSupport.sln
src/
  core/
    SoftSupport.Domain/          Entités mappées sur les tables BDC, règles métier (identifiants
                                 d'articles, diffusion interne/clients, départements validateurs,
                                 périodes de contrat, alertes d'échéance), exceptions
    SoftSupport.Application/     DTO, contrats (repositories, CRM, e-mail), services métier,
                                 validateurs FluentValidation, gabarits d'e-mail
  infrastructure/
    SoftSupport.Infrastructure/  EF Core (mapping exact des tables BDC et CRM), repositories,
                                 JWT, mots de passe, file d'envoi SMTP, alertes de contrat
  api/
    SoftSupport.Api/             Contrôleurs `api/softsupport/*`, politiques d'accès par rôle,
                                 gestion d'erreurs `ApiResponse<T>`
  tests/
    SoftSupport.Domain.Tests/    Tests des règles métier (xUnit)
  ui/
    SoftSupport.Front/           Espace Nx Angular 21
      apps/softsupport/          Coque : connexion, sidebar, topbar, routes, i18n fr/en, animations
      libs/shared-*/             Composants communs repris de SOFTAPPLICATION / SoftHelp
      libs/_softsupport/
        softsupport-models/      Contrats d'API, rôles, menu
        softsupport-service/     Clients HTTP, session, gardes, intercepteurs
        softsupport-ui/          Pagination, badges, éditeur riche, modales article
        softsupport-feature/     Pages : articles, validation, catalogue, utilisateurs,
                                 clients et contrats, historique, profil
```

Sens des dépendances : `Api → Infrastructure → Application → Domain` côté .NET,
`feature → ui → service → models` côté front.

## Fonctionnalités (reprises de BDC)

| Menu | Rôles | Contenu |
|---|---|---|
| Tableau de bord *(ajout)* | Administrateur ; Commercial, Responsable Commercial | bloc **Articles** (Administrateur) : articles validés les plus lus et les plus mal notés par les clients du portail (au moins autant de votes négatifs que positifs) ; bloc **Clients** (rôles commerciaux) : contrats dont l'échéance tombe ce mois-ci, renouvelés ou non, et comptes du portail par société au regard du nombre prévu au contrat. Chaque bloc a sa propre route d'API et sa propre politique d'accès |
| Tous les articles | tous | recherche, filtres produit / version / thème / diffusion, fiche (problème, solution) ; l'administrateur règle la diffusion, renvoie en validation et fait l'**extraction CSV** par département |
| Ajoutés récemment | tous | les 20 derniers articles |
| Mes articles, Non validés | Administrateur, Ecriture | rédaction, modification, suppression ; correction et resoumission des articles refusés |
| En attente de validation | utilisateurs ayant des départements à valider (`Users.Validator`) | valider (avec corrections et diffusion), refuser ou supprimer avec un commentaire envoyé par e-mail, import des articles du CRM |
| Produits, Packs, Versions, Thèmes, Catégories | Administrateur | référentiels ; import CRM des produits et des versions |
| Clients, Historiques | Commercial, Responsable Commercial | sociétés, périodes de contrat (ajout, modification, renouvellement), utilisateurs du portail client, historique des contrats |
| Utilisateurs | Administrateur | comptes, rôle, département, départements validés |

La tâche Hangfire « contrat-verification » est remplacée par un service d'arrière-plan qui
envoie chaque nuit les alertes d'échéance (3 mois avant, puis chaque lundi du dernier mois),
sans utiliser les tables Hangfire (laissées intactes).

## Configuration

| Cible | Base BDC | API | Front | Fichiers |
|---|---|---|---|---|
| Développement (`dotnet run`, F5) | 127.0.0.1 (sa) | localhost:5051 | localhost:4230 | `appsettings.Development.json`, `config/development` |
| Réseau local (`npm run serve:lan`) | celle de l'API lancée | 192.168.0.112:5051 | 192.168.0.112:4230 | `config/lan` |
| Serveur 151 | 151.80.218.41 | :5051 | :3013 | `config/appsettings.srv151.json`, `config/srv151` |
| Serveur 141 | 141.95.229.197 | :5051 | :3013 | `config/appsettings.srv141.json`, `config/srv141` |

Les fichiers de l'API sont sous `src/api/SoftSupport.Api/`, ceux du front sous
`src/ui/SoftSupport.Front/apps/softsupport/config/`. Les ports évitent tout conflit avec SoftHelp,
installé sur les mêmes serveurs (API 5011 / 5041, front 3012) : SoftSupport utilise l'API en 5051
et le front en 3013. Pour changer un port, modifier `Kestrel` et `Cors` dans le fichier de l'API,
et `softSupportApiUrl` dans le `config.json` du front.

**Identifiants SQL** : les fichiers `appsettings.srv151.json` et `appsettings.srv141.json`
contiennent `A_RENSEIGNER` à la place de l'utilisateur et du mot de passe SQL de la base `BDC` du
serveur ; `publish.ps1` refuse de publier tant qu'ils ne sont pas renseignés.

Réglages communs dans `src/api/SoftSupport.Api/appsettings.json` :

- `Jwt` : clé de signature (32 caractères minimum), durée des jetons (12 h).
- `Smtp` : compte d'envoi (`serviceinfo@softwell.mg`, comme l'e-mail d'identifiants de BDC).
- `SoftSupport:DefaultPassword` : mot de passe d'un compte créé par l'administrateur (`123`, comme BDC).
- `SoftSupport:CustomerPortalUrl` : lien rappelé dans l'e-mail d'identifiants des clients.
- `SoftSupport:ContractAlertsEnabled` : alertes d'échéance (désactivées en développement).
- `Security:HashPasswords` : voir ci-dessous.

### Mots de passe du back-office

Les comptes BDC ont un mot de passe enregistré en clair. Par défaut (`HashPasswords: false`),
SoftSupport les lit et les enregistre de la même façon : l'ancien back-office reste utilisable en
parallèle. Une fois l'ancien back-office arrêté, passer `Security:HashPasswords` à `true` : chaque
nouveau mot de passe est alors haché (BCrypt) et les mots de passe en clair le sont à la connexion
suivante. Les mots de passe des **clients** restent en clair : le portail client les compare tel quel.

### Publier pour un serveur

```powershell
.\publish.ps1 -Server srv151              # un serveur
.\publish.ps1 -Server srv151, srv141      # plusieurs serveurs à la suite
.\publish.ps1 -Server all                 # tous les serveurs
.\publish.ps1 -Server srv141 -SkipFront   # API seule
```

Résultat dans `publish\<serveur>` :

- `api` : l'API, avec le fichier du serveur copié sous `appsettings.Production.json`
  (environnement utilisé quand `ASPNETCORE_ENVIRONMENT` n'est pas défini) et l'écoute Kestrel
  sur le bon port. Démarrage : `dotnet SoftSupport.Api.dll`.
- `front` : les fichiers statiques à servir sur le port 3013 ; `config.json` pointe vers l'API
  du serveur et reste modifiable sur place sans reconstruire.

Le front se construit aussi seul : `npm run build:srv151` ou `npm run build:srv141`.

Ajouter un serveur : `config/appsettings.<nom>.json` côté API, `config/<nom>/config.json` et une
configuration `<nom>` dans `apps/softsupport/project.json` côté front, puis le nom dans le
`ValidateSet` et la liste `$servers` de `publish.ps1`.

## Lancer en local

```bash
# API — http://localhost:5051 (Swagger sur /swagger)
dotnet run --project src/api/SoftSupport.Api

# Front — http://localhost:4230
cd src/ui/SoftSupport.Front
npm install
npm start              # ou npm run serve:lan pour l'ouvrir depuis le réseau

# Contrôles
dotnet test src/tests/SoftSupport.Domain.Tests
```

## Écarts assumés avec BDC

- **Authentification par jeton** : BDC renvoyait l'e-mail et le mot de passe (gardés dans le
  `sessionStorage`) à chaque appel ; SoftSupport délivre un jeton JWT (12 h) et vérifie les rôles
  côté serveur, alors que BDC ne masquait les menus que dans le navigateur.
- **Validation** limitée aux articles des départements confiés au validateur, contrôlée en base
  à chaque appel ; modification et suppression d'un article réservées à son rédacteur (ou à un
  administrateur).
- **Désignation** recalculée par l'API (« Produit Version - Titre ») à chaque enregistrement,
  y compris lors de la validation.
- **Report vers le CRM** : à la validation d'un article importé, le produit et la version sont
  reportés avec leurs codes CRM (BDC y écrivait les identifiants internes).
- **Suppressions protégées** : un produit sous contrat ou dans un pack n'est plus supprimable
  (la base supprimait les contrats en cascade) ; un utilisateur ayant rédigé des articles non plus
  (comme dans BDC).
- **Contrats** : une période modifiée ne peut pas chevaucher les autres périodes du produit ; un
  renouvellement doit suivre la dernière période ; un contrat ajouté dure au moins 3 mois.
- **Identifiants clients** : le mot de passe provisoire est généré aléatoirement, affiché une fois
  pour être copié et, au choix, envoyé par e-mail.
- **Éditeur riche** intégré au front (gras, italique, titres, listes, code, liens) à la place de
  Summernote ; le contenu reste du HTML, compatible avec les articles existants.
- **Extraction CSV** : la date de fin est incluse, le fichier est encodé en UTF-8 lisible par Excel.
