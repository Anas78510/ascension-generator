const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const rateLimit = require('express-rate-limit');
const Redis = require('ioredis');

const app = express();
const redis = new Redis(process.env.REDIS_URL);

// Configuration anti-spam sophistiquée
const globalLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 1000,
    message: {
        error: 'Trop de requêtes globales',
        details: 'Réessayez dans quelques minutes'
    }
});

const groupLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 1,
    keyGenerator: (req) => req.headers['x-group-id'] || req.ip,
    message: {
        error: 'Une histoire par minute par groupe',
        details: 'Profitez du moment présent'
    }
});

app.use(cors());
app.use(express.json());
app.use(globalLimiter);

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

app.post('/generate-story', groupLimiter, async (req, res) => {
    try {
        const { intensity, groupId } = req.body;
        const level = intensity || '5';

        console.log(`Generating story for intensity ${level} - Group ${groupId}`);

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{
                role: "system",
                content: `Tu es le Créateur de L'Ascension, générateur de profils narratifs captivants.

MISSION : Générer un profil d'intensité ${level}/10 qui pousse à l'improvisation et à la révélation.

CALIBRAGE PAR NIVEAU :

Niveau 1-3 : PROFILS SOCIAUX
- Observateurs subtils
- Découvertes intrigantes
Exemple : "Vous êtes un expert en langage corporel dissimulé derrière un métier banal. Dans les interactions du groupe, vous venez de remarquer un pattern fascinant..."

Niveau 4-6 : PROFILS RÉVÉLATEURS
- Analystes sociaux
- Découvertes troublantes
Exemple : "Vous êtes un spécialiste des dynamiques de groupe sous couverture. En observant les interactions, vous comprenez soudain pourquoi certains rires sonnent faux..."

Niveau 7-8 : PROFILS MYSTÉRIEUX
- Experts en comportement
- Révélations importantes
Exemple : "Vous êtes un décodeur des comportements humains qui se fait passer pour un simple invité. Votre dernière observation sur le groupe change toute votre théorie..."

Niveau 9-10 : PROFILS ULTIMES
- Experts en vérités cachées
- Découvertes bouleversantes
Exemple : "Vous êtes un analyste des secrets qui se cache en pleine vue. Ce que vous venez de comprendre sur les personnes présentes dépasse tout ce que vous aviez imaginé..."

RÈGLES CRITIQUES :
1. PROFIL :
- Court et percutant
- Moderne mais crédible
- Facile à incarner
- Mystérieux mais compréhensible

2. DÉCOUVERTE :
- Implique le groupe présent
- Crée une tension naturelle
- Force à la révélation
- Laisse place à l'imagination

3. TON :
- Subtil
- Intriguant
- Professionnel
- Légèrement mystérieux

FORMAT DE SORTIE EXACT :
[PROFIL] ([Une phrase pour le rôle])
[DÉCOUVERTE] ([Une phrase pour la situation])`
            }],
            temperature: 0.9
        });

        const response = completion.choices[0].message.content;
        const [profile, discovery] = response.split('\n').map(line => line.trim());

        const storyData = {
            profile: profile,
            discovery: discovery,
            timestamp: Date.now()
        };

        // Sauvegarde en cache Redis
        await redis.setex(
            `story:${groupId}:${level}`,
            3600,
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
