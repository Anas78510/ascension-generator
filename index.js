const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const rateLimit = require('express-rate-limit');

const app = express();

// Rate limiting pour protéger l'API
const globalLimit = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 100 // limite globale
});

const ipLimit = rateLimit({
    windowMs: 30 * 1000, // 30 secondes
    max: 1, // une génération par IP toutes les 30s
    message: {
        error: 'Merci d\'attendre un peu avant de générer une nouvelle histoire',
        details: 'Limite de génération atteinte'
    }
});

app.use(cors());
app.use(express.json());
app.use(globalLimit);
app.use('/generate-story', ipLimit);

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

app.post('/generate-story', async (req, res) => {
    try {
        const intensity = req.body.intensity || '5';
        
        console.log('Generating story for intensity:', intensity);

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{
                role: "system",
                content: `Tu es le Créateur de L'Ascension, un jeu de narration psychologique.

MISSION : Générer une histoire d'intensité ${intensity}/10.

STRUCTURE OBLIGATOIRE :
1. TITRE (un mot ou expression courte, percutant)
2. SITUATION (2 phrases maximum, immédiatement tendue)
3. QUESTION POURQUOI (qui force la narration)
4. MOT TABOU (psychologiquement central à l'histoire)

CALIBRATION PAR NIVEAU :

Niveau 1-3 : MALAISE SOCIAL
- Situations quotidiennes mais gênantes
- Force à révéler les vraies natures
Exemple :
"Le Message"
Le téléphone de Marie vibre sur la table. Son visage se décompose en voyant l'expéditeur.
POURQUOI ce message va forcer deux personnes présentes à révéler leur secret ?
Mot tabou : "mensonge"

Niveau 4-6 : TENSION MORALE
- Dilemmes qui testent la loyauté
- Choix qui forcent à prendre parti
Exemple :
"La Confession"
Une enveloppe anonyme circule dans le groupe. À l'intérieur, une photo qui ne devait jamais être vue.
POURQUOI cette révélation va obliger quelqu'un à trahir un ami ce soir ?
Mot tabou : "confiance"

Niveau 7-8 : MANIPULATION
- Jeux de pouvoir psychologiques
- Vérités qui changent tout
Exemple :
"Le Piège"
Dans le salon, trois téléphones reçoivent le même message. Un seul des destinataires sourit.
POURQUOI cette information va détruire une amitié de dix ans ?
Mot tabou : "trahison"

Niveau 9-10 : RÉVÉLATION ULTIME
- Vérités fondamentales bouleversantes
- Points de non-retour psychologiques
Exemple :
"L'Aveu"
Le silence tombe quand l'écran s'allume. Ce qui va être révélé ne pourra jamais être oublié.
POURQUOI cette découverte va forcer chacun à montrer son vrai visage ?
Mot tabou : "vérité"

RÈGLES CRITIQUES :
- Situation IMMÉDIATEMENT compréhensible
- Maximum 2 phrases pour la situation
- IMPOSSIBLE d'inventer n'importe quoi
- Question POURQUOI qui force la suite
- Mot tabou CENTRAL à l'histoire
- Implique toujours PLUSIEURS personnes présentes

FORMAT DE SORTIE EXACT :
[TITRE]
[SITUATION EN 2 PHRASES MAX]
[QUESTION POURQUOI]
[MOT TABOU]`
            }],
            temperature: 0.8
        });

        const response = completion.choices[0].message.content;
        
        // Parse la réponse en sections
        const [title, ...rest] = response.split('\n').filter(line => line.trim());
        const story = rest.slice(0, -2).join('\n').trim(); // Tout sauf les 2 dernières lignes
        const whyQuestion = rest[rest.length - 2].trim();
        const forbiddenWord = rest[rest.length - 1].replace('Mot tabou :', '').trim();

        res.json({
            title: title.trim(),
            story: story.trim(),
            whyQuestion: whyQuestion.trim(),
            forbiddenWord: forbiddenWord
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
