// index.js
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const rateLimit = require('express-rate-limit');
const Redis = require('ioredis'); // Pour une meilleure gestion du cache

const app = express();
const redis = new Redis(process.env.REDIS_URL);

// Configuration anti-spam avancée
const globalLimiter = rateLimit({
   windowMs: 5 * 60 * 1000, // 5 minutes
   max: 1000, // Limite globale généreuse
   message: {
       error: 'Trop de requêtes globales',
       details: 'Le serveur est temporairement surchargé'
   }
});

const groupLimiter = rateLimit({
   windowMs: 30 * 1000, // 30 secondes
   max: 1, // Une génération par groupe
   keyGenerator: (req) => req.headers['x-group-id'] || req.ip,
   message: {
       error: 'Votre groupe doit attendre avant de générer une nouvelle histoire',
       details: 'Profitez de ce moment pour jouer l\'histoire actuelle'
   }
});

const regenerateLimiter = rateLimit({
   windowMs: 2 * 60 * 1000, // 2 minutes
   max: 3, // 3 régénérations maximum
   keyGenerator: (req) => req.headers['x-group-id'] || req.ip,
   message: {
       error: 'Limite de régénération atteinte',
       details: 'Attendez quelques minutes avant de régénérer'
   }
});

app.use(cors());
app.use(express.json());
app.use(globalLimiter);

const openai = new OpenAI({
   apiKey: process.env.OPENAI_API_KEY
});

// Générer une histoire
app.post('/generate-story', groupLimiter, async (req, res) => {
   try {
       const { intensity, groupId } = req.body;
       const level = intensity || '5';
       
       console.log(`Generating story for intensity ${level} - Group ${groupId}`);

       const completion = await openai.chat.completions.create({
           model: "gpt-3.5-turbo",
           messages: [{
               role: "system",
               content: `Tu es le Maître de L'Ascension, créateur d'expériences narratives psychologiques intenses.

MISSION : Créer une situation initiale d'intensité ${level}/10 qui force une narration captivante jusqu'au clignement des yeux.

STRUCTURE IMPÉRATIVE :

1. TITRE 
- Un ou deux mots percutants
- Évocateur et mystérieux
- Crée immédiatement une tension

2. SITUATION INITIALE 
- Deux phrases maximum
- Action ou révélation en cours
- Implique plusieurs personnes présentes
- Crée une tension immédiate
- Force à continuer l'histoire

3. QUESTION POURQUOI 
- Question directe et percutante
- Force une réponse révélatrice
- Impossible à esquiver
- Crée un dilemme moral ou social

4. MOT TABOU
- Psychologiquement central
- Impossible à éviter naturellement
- Force la créativité narrative

CALIBRAGE PAR NIVEAU :

Niveau 1-3 : TENSION SOCIALE
- Malaises relationnels subtils
- Situations quotidiennes qui révèlent
- Parfait pour débuter une partie
Exemple :
"L'Erreur"
Le téléphone passe de main en main, un rire nerveux parcourt le groupe. L'expéditeur du message est dans la pièce.
POURQUOI ce simple malentendu va révéler un secret bien gardé ?
Mot tabou : "accident"

Niveau 4-6 : DILEMME MORAL
- Choix impossibles
- Loyautés testées
- Révélations inévitables
Exemple :
"La Preuve"
Une notification illumine simultanément trois téléphones. Sur l'écran, une photo qui n'aurait jamais dû exister.
POURQUOI cette découverte va forcer quelqu'un à choisir son camp ce soir ?
Mot tabou : "confiance"

Niveau 7-8 : MANIPULATION
- Jeux de pouvoir
- Trahisons subtiles
- Vérités dangereuses
Exemple :
"L'Alliance"
Dans le groupe, deux regards se croisent et un sourire apparaît. Les autres ne savent pas encore ce qui les attend.
POURQUOI ce pacte secret va détruire une amitié de dix ans ?
Mot tabou : "trahison"

Niveau 9-10 : RÉVÉLATION ULTIME
- Vérités dévastatrices
- Points de non-retour
- Confrontations inévitables
Exemple :
"L'Aveu"
Le silence tombe quand l'enveloppe est ouverte. La personne visée n'est pas celle que tout le monde croit.
POURQUOI cette révélation va forcer chacun à montrer son vrai visage ?
Mot tabou : "vérité"

RÈGLES CRITIQUES :

1. NARRATION
- Situation IMMÉDIATEMENT claire
- Force une suite ÉVIDENTE
- Permet plusieurs développements
- Crée une tension INSTANTANÉE

2. PSYCHOLOGIE
- Test les liens entre joueurs
- Force les vraies personnalités
- Crée des camps naturels
- Pousse aux révélations

3. GAMEPLAY
- Adaptée au temps d'un clignement
- Permet les interventions d'Oracles
- Crée des opportunités de pouvoir
- Génère des alliances/trahisons

4. FORMAT EXACT :
[TITRE]
[SITUATION EN 2 PHRASES]
POURQUOI [QUESTION DIRECTE]
Mot tabou : [MOT CLÉ]`
           }],
           temperature: 0.9
       });

       const response = completion.choices[0].message.content;
       
       // Parse plus précis
       const lines = response.split('\n').filter(line => line.trim());
       const title = lines[0];
       const whyLine = lines.findIndex(line => line.startsWith('POURQUOI'));
       const story = lines.slice(1, whyLine).join(' ');
       const whyQuestion = lines[whyLine];
       const forbiddenWord = lines[lines.length - 1].replace('Mot tabou :', '').trim();

       const storyData = {
           title: title.trim(),
           story: story.trim(),
           whyQuestion: whyQuestion.trim(),
           forbiddenWord: forbiddenWord,
           timestamp: Date.now()
       };

       // Sauvegarder dans Redis
       await redis.setex(
           `story:${groupId}:${level}`,
           3600, // expire après 1h
           JSON.stringify(storyData)
       );

       res.json(storyData);

   } catch (error) {
       console.error('Error:', error);
       res.status(500).json({
           error: 'Erreur de génération',
           details: error.message
       });
   }
});

// Récupérer l'histoire sauvegardée
app.get('/story/:groupId/:level', async (req, res) => {
   try {
       const { groupId, level } = req.params;
       const story = await redis.get(`story:${groupId}:${level}`);
       
       if (!story) {
           return res.status(404).json({
               error: 'Histoire non trouvée',
               details: 'Générez une nouvelle histoire'
           });
       }

       res.json(JSON.parse(story));
   } catch (error) {
       res.status(500).json({
           error: 'Erreur de récupération',
           details: error.message
       });
   }
});

// Régénérer une histoire
app.post('/regenerate-story', regenerateLimiter, async (req, res) => {
   // Même logique que generate-story
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
   console.log(`Server running on port ${PORT}`);
});
