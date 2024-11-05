const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const app = express();

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Protection contre le spam et la surconsommation
let requestCache = new Map();

app.post('/generate-story', async (req, res) => {
    try {
        const intensity = req.body.intensity || '5';
        
        // Vérification anti-spam par IP
        const clientIP = req.ip;
        const now = Date.now();
        const lastRequest = requestCache.get(clientIP);
        
        if (lastRequest && (now - lastRequest) < 10000) { // 10 secondes minimum entre requêtes
            return res.status(429).json({
                error: 'Trop de requêtes',
                details: 'Merci d\'attendre avant de regénérer une histoire'
            });
        }
        
        requestCache.set(clientIP, now);

        // Nettoyage du cache toutes les heures
        if (requestCache.size > 1000) {
            requestCache.clear();
        }

        console.log('Generating story for intensity:', intensity);

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{
                role: "system",
                content: `Tu es l'Architecte de L'Ascension, maître des révélations psychologiques.

MISSION : Générer une situation d'intensité ${intensity}/10 qui force les joueurs à révéler leur vraie nature.

STRUCTURE IMPÉRATIVE :
1. TITRE : Un mot percutant qui frappe l'esprit
2. CONTEXTE : Moment précis de tension sociale (2 phrases max)
3. DÉCLENCHEUR : Action ou révélation qui change tout
4. QUESTION "POURQUOI" : Point culminant psychologique
5. MOT TABOU : Terme central impossible à éviter

CALIBRATION PAR NIVEAU :

Niveau 1-3 : MALAISE SOCIAL
- Situations quotidiennes qui révèlent les vraies personnalités
- Force à prendre position sur des vérités dérangeantes
- Ex: "L'Appel" 
  Emma décroche son téléphone, son visage se décompose. Trois personnes présentes reconnaissent le numéro.
  Un choix doit être fait maintenant.
  POURQUOI personne n'ose dire la vérité sur cet appel ?
  Mot tabou : "peur"

Niveau 4-6 : TENSION MORALE
- Dilemmes qui testent la loyauté
- Secrets partagés qui impliquent plusieurs personnes
- Ex: "L'Aveu"
  Un message anonyme vient d'arriver sur le groupe. Deux personnes présentes évitent soudain tout contact visuel.
  Le temps est compté.
  POURQUOI cette révélation va forcer quelqu'un à trahir ce soir ?
  Mot tabou : "confiance"

Niveau 7-8 : MANIPULATION PURE
- Jeux de pouvoir psychologiques
- Vérités qui forcent à choisir un camp
- Ex: "Le Pacte"
  Marie sort une enveloppe, le silence tombe. Thomas et Julie échangent un regard qui en dit long.
  Le contenu va tout changer.
  POURQUOI cette preuve va détruire plus qu'une amitié ?
  Mot tabou : "trahison"

Niveau 9-10 : RÉVÉLATION ULTIME
- Vérités fondamentales bouleversantes
- Points de non-retour psychologiques
- Ex: "L'Effondrement"
  Une confession vient de briser le groupe en deux. Les masques tombent un à un.
  Plus rien ne sera comme avant.
  POURQUOI cette vérité va forcer chacun à révéler son vrai visage ?
  Mot tabou : "mensonge"

RÈGLES ABSOLUES :

1. IMPACT PSYCHOLOGIQUE
- Situation immédiatement tendue
- Impossible d'y échapper
- Force à se dévoiler
- Crée un malaise réel

2. DYNAMIQUE DE GROUPE
- Implique plusieurs personnes
- Crée des camps naturels
- Force les prises de position
- Permet les interventions des Oracles

3. NARRATION
- Situation claire et visuelle
- Tension immédiate
- Déclencheur fort
- Question POURQUOI inévitable

4. MOT TABOU
- Central à l'histoire
- Psychologiquement chargé
- Difficile à contourner
- Force la créativité

FORMAT DE SORTIE STRICT :

[TITRE EN UN MOT]

[CONTEXTE EN DEUX PHRASES]

[DÉCLENCHEUR EN UNE PHRASE]

POURQUOI [QUESTION QUI FORCE UNE RÉVÉLATION] ?

Mot tabou : "[MOT PSYCHOLOGIQUE CLÉ]"

OBJECTIFS CACHÉS :
- Révéler les vraies personnalités
- Créer des tensions irrésistibles
- Forcer les choix difficiles
- Rendre la narration addictive
- Pousser aux limites psychologiques
- Garder le contrôle tout en créant le chaos`
            }],
            temperature: 0.9
        });

        // Formatage et nettoyage de la réponse
        const response = completion.choices[0].message.content;
        
        // Séparation des éléments (titre, histoire, mot tabou)
        const [title, ...rest] = response.split('\n\n').filter(line => line.trim());
        
        // Extraction du contexte, déclencheur et question POURQUOI
        const storyParts = rest.slice(0, -1).join('\n');
        const forbiddenWord = rest[rest.length - 1].replace('Mot tabou : ', '').replace(/"/g, '');

        res.json({
            title: title.trim(),
            story: storyParts.trim(),
            forbiddenWord: forbiddenWord.trim()
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            error: 'Erreur de génération',
            details: error.message
        });
    }
});

app.get('/', (req, res) => {
    res.json({ message: 'Server is running' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
