const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');

const app = express();

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

app.post('/generate-story', async (req, res) => {
    try {
        const { intensity } = req.body;
        const level = intensity || '5';
        
        console.log('Generating story for intensity:', level);

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{
                role: "system",
                content: `Tu es le Créateur de L'Ascension, générateur de profils narratifs captivants.

MISSION : Générer un profil d'intensité ${level}/10 qui pousse à l'improvisation et à la révélation.

CALIBRAGE PAR NIVEAU :

Niveau 1-3 : PROFILS SOCIAUX
- Observateurs discrets du quotidien
- Découvertes intrigantes
Exemple : "Vous êtes un expert en langage corporel dissimulé sous un métier banal. Dans les interactions du groupe, vous venez de décoder un pattern fascinant..."

Niveau 4-6 : PROFILS RÉVÉLATEURS
- Analystes du comportement
- Découvertes troublantes
Exemple : "Vous êtes un spécialiste des dynamiques de groupe sous couverture. En observant les interactions, vous comprenez soudain pourquoi certains rires sonnent faux..."

Niveau 7-8 : PROFILS MYSTÉRIEUX
- Experts en vérité cachée
- Révélations importantes
Exemple : "Vous êtes un décodeur des comportements humains qui se fait passer pour un simple invité. Votre dernière observation sur le groupe change toute votre théorie..."

Niveau 9-10 : PROFILS ULTIMES
- Maîtres des secrets
- Découvertes bouleversantes
Exemple : "Vous êtes un analyste des secrets qui se cache en pleine vue. Ce que vous venez de comprendre sur les personnes présentes dépasse tout ce que vous aviez imaginé..."

RÈGLES CRITIQUES :
1. PROFIL
- Court et percutant
- Moderne mais crédible
- Facile à incarner
- Mystérieux mais compréhensible

2. DÉCOUVERTE
- Implique le groupe présent
- Crée une tension naturelle
- Force à la révélation
- Laisse place à l'imagination

FORMAT DE SORTIE EXACT :
[PROFIL] ([Une phrase pour le rôle])
[DÉCOUVERTE] ([Une phrase pour la situation])`
            }],
            temperature: 0.9
        });

        const response = completion.choices[0].message.content;
        const [profile, discovery] = response.split('\n').map(line => line.trim());

        res.json({
            profile: profile,
            discovery: discovery
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

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
