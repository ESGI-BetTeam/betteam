# 📖 Guide d'utilisation - Service de Synchronisation TheSportsDB

## 🎯 Introduction

Le service de synchronisation TheSportsDB permet de récupérer et synchroniser automatiquement les données de compétitions, équipes et matchs depuis l'API TheSportsDB vers votre base de données.

## 🚀 Démarrage rapide

### 1. Prérequis

- API Key TheSportsDB configurée dans `.env`:
  ```bash
  THESPORTSDB_API_KEY=your-api-key
  ```

- Base de données PostgreSQL configurée et migrations appliquées:
  ```bash
  npm run db:migrate:deploy
  ```

### 2. Premier lancement - Synchronisation complète

Démarrez votre serveur:
```bash
npm run dev
```

## 📡 Endpoints de Synchronisation

### Synchronisation complète (recommandé pour la première fois)

**POST** `/api/sync/all`

Synchronise tout: compétitions → équipes → matchs

```bash
curl -X POST http://localhost:3000/api/sync/all
```

**Réponse:**
```json
{
  "message": "Full synchronization completed successfully",
  "steps": ["competitions", "teams", "matches"]
}
```

⏱️ **Temps estimé:** 5-10 minutes (selon rate limiting)

---

### Synchroniser les compétitions

#### Toutes les compétitions (14 sports)

**POST** `/api/sync/competitions`

```bash
curl -X POST http://localhost:3000/api/sync/competitions
```

#### Uniquement le football (5 ligues)

**POST** `/api/sync/competitions/football`

```bash
curl -X POST http://localhost:3000/api/sync/competitions/football
```

**Compétitions synchronisées:**
- ⚽ Ligue 1 (4334)
- ⚽ Premier League (4328)
- ⚽ La Liga (4335)
- ⚽ Bundesliga (4331)
- ⚽ Serie A (4332)

#### Une compétition spécifique

**POST** `/api/sync/competitions`

```bash
curl -X POST http://localhost:3000/api/sync/competitions \
  -H "Content-Type: application/json" \
  -d '{"leagueId": "4334"}'
```

---

### Synchroniser les équipes

#### Pour toutes les compétitions

**POST** `/api/sync/teams`

```bash
curl -X POST http://localhost:3000/api/sync/teams
```

#### Pour une compétition spécifique

**POST** `/api/sync/teams`

```bash
curl -X POST http://localhost:3000/api/sync/teams \
  -H "Content-Type: application/json" \
  -d '{"leagueId": "4334"}'
```

---

### Synchroniser les matchs

#### Tous les matchs (upcoming + past)

**POST** `/api/sync/matches`

```bash
curl -X POST http://localhost:3000/api/sync/matches
```

#### Matchs à venir d'une compétition

**POST** `/api/sync/matches`

```bash
curl -X POST http://localhost:3000/api/sync/matches \
  -H "Content-Type: application/json" \
  -d '{"leagueId": "4334", "type": "upcoming"}'
```

#### Matchs passés d'une compétition

**POST** `/api/sync/matches`

```bash
curl -X POST http://localhost:3000/api/sync/matches \
  -H "Content-Type: application/json" \
  -d '{"leagueId": "4334", "type": "past"}'
```

---

### Statut de la synchronisation

**GET** `/api/sync/status`

```bash
curl http://localhost:3000/api/sync/status
```

**Réponse:**
```json
{
  "counts": {
    "competitions": 5,
    "teams": 100,
    "matches": 250
  },
  "recentLogs": [
    {
      "id": "...",
      "type": "matches",
      "status": "success",
      "itemsSynced": 15,
      "durationMs": 2345,
      "createdAt": "2026-01-13T10:30:00.000Z",
      "competition": {
        "name": "Ligue 1"
      }
    }
  ]
}
```

---

## 📊 Endpoints de consultation

### Compétitions

**GET** `/api/competitions` - Liste toutes les compétitions

**Filtres disponibles:**
- `?sport=football` - Filtrer par sport
- `?country=France` - Filtrer par pays
- `?isActive=true` - Uniquement les compétitions actives

```bash
curl "http://localhost:3000/api/competitions?sport=football"
```

**GET** `/api/competitions/:id` - Détails d'une compétition

**GET** `/api/competitions/:id/teams` - Équipes d'une compétition

**GET** `/api/competitions/:id/matches` - Matchs d'une compétition

---

### Matchs

**GET** `/api/matches` - Liste des matchs avec filtres

**Filtres disponibles:**
- `?sport=football`
- `?competitionId=xxx`
- `?status=upcoming|live|finished`
- `?startDate=2026-01-13`
- `?endDate=2026-01-20`
- `?limit=50`
- `?offset=0`

```bash
# Matchs à venir de football
curl "http://localhost:3000/api/matches?sport=football&status=upcoming&limit=10"

# Matchs de Ligue 1 terminés
curl "http://localhost:3000/api/matches?competitionId=xxx&status=finished"
```

**GET** `/api/matches/today` - Matchs du jour

```bash
curl http://localhost:3000/api/matches/today
```

**GET** `/api/matches/upcoming` - Prochains matchs (7 jours)

```bash
curl http://localhost:3000/api/matches/upcoming
```

**GET** `/api/matches/:id` - Détails d'un match

---

## ⚙️ Configuration avancée

### Cache

Le système utilise un cache en mémoire avec les TTL suivants:

- **Compétitions:** 24 heures
- **Équipes:** 24 heures
- **Matchs à venir:** 1 heure
- **Matchs passés:** 15 minutes

### Rate Limiting

- **API gratuite (V1):** 30 requêtes/minute
- **API premium (V2):** Limites plus élevées

Le client gère automatiquement le rate limiting avec:
- File d'attente (queue)
- Retry automatique sur erreur 429
- Délai entre requêtes (100ms)

---

## 🔄 Automatisation (CRON) - À venir

Vous pouvez configurer des CRON jobs pour synchroniser automatiquement:

```typescript
// À ajouter dans index.ts
import cron from 'node-cron';
import { competitionsService, teamsService, matchesService } from './services/thesportsdb';

// Sync compétitions: 1x/jour à 3h du matin
cron.schedule('0 3 * * *', async () => {
  console.log('🔄 Daily competitions sync...');
  await competitionsService.syncAllCompetitions();
});

// Sync équipes: 1x/jour à 4h du matin
cron.schedule('0 4 * * *', async () => {
  console.log('🔄 Daily teams sync...');
  await teamsService.syncAllTeams();
});

// Sync matchs: toutes les 6 heures
cron.schedule('0 */6 * * *', async () => {
  console.log('🔄 Matches sync...');
  await matchesService.syncAllMatches();
});
```

---

## 🐛 Dépannage

### Erreur: "Competition not found. Sync competition first."

Synchronisez d'abord les compétitions avant les équipes/matchs:

```bash
curl -X POST http://localhost:3000/api/sync/competitions/football
```

### Erreur 429: "Rate limit exceeded"

Le client gère automatiquement le retry. Si vous voyez cette erreur:
- Attendez 1 minute
- Vérifiez que vous n'avez pas plusieurs instances qui synchronisent en même temps

### Erreur: "Team not found for match"

Synchronisez les équipes avant les matchs:

```bash
curl -X POST http://localhost:3000/api/sync/teams
```

---

## 📝 Logs

Les logs de synchronisation sont stockés dans la table `sync_logs`:

```sql
SELECT * FROM sync_logs ORDER BY created_at DESC LIMIT 10;
```

---

## 🎯 Workflow recommandé

### Première installation

1. **Sync compétitions de football:**
   ```bash
   curl -X POST http://localhost:3000/api/sync/competitions/football
   ```

2. **Sync équipes:**
   ```bash
   curl -X POST http://localhost:3000/api/sync/teams
   ```

3. **Sync matchs:**
   ```bash
   curl -X POST http://localhost:3000/api/sync/matches
   ```

### Mise à jour quotidienne

Utilisez simplement:
```bash
curl -X POST http://localhost:3000/api/sync/all
```

Ou configurez les CRON jobs automatiques.

---

## 📚 Ressources

- [TheSportsDB API Documentation](https://www.thesportsdb.com/api.php)
- [Liste des sports & compétitions](https://www.thesportsdb.com/api/v1/json/3/all_leagues.php)
- [Support Premium (V2)](https://www.patreon.com/thedatadb)

---

## 💡 Prochaines étapes

- [ ] Ajouter les CRON jobs automatiques
- [ ] Implémenter la synchronisation des joueurs
- [ ] Implémenter la synchronisation des classements (standings)
- [ ] Ajouter les champs enrichis (stadium, description, etc.)
- [ ] WebSockets pour scores live (si premium)
