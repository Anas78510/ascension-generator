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
            messages: [
                {
                    role: "system",
                    content: "Tu es le Créateur de L'Ascension, un jeu révolutionnaire de performances narratives où la frontière entre réalité et fiction devient floue. Chaque mission doit créer un moment inoubliable."
                },
                {
                    role: "user",
                    content: `Génère un profil d'intensité ${level}/10.

CALIBRAGE PAR NIVEAU :

Niveau 1-3 : PERFORMANCES INTRIGANTES
- Situations familières avec twist
- Théories fascinantes sur le quotidien
Exemple :
VOUS ÊTES : Un spécialiste des coïncidences qui a découvert un pattern troublant
VOTRE MISSION : Expliquez pourquoi les déjà-vus que tout le monde vit cachent une vérité inquiétante
SUGGESTION : Commencez par une anecdote personnelle, créez des liens avec les expériences du groupe

Niveau 4-6 : RÉVÉLATIONS PERSONNELLES
- Histoires mystérieuses
- Talents inexpliqués
Exemple :
VOUS ÊTES : Le gardien d'un secret familial qui a changé votre vision de la réalité
VOTRE MISSION : Racontez l'événement étrange qui a révélé pourquoi votre famille n'est pas comme les autres
SUGGESTION : Décrivez les détails troublants, impliquez subtilement certains spectateurs

Niveau 7-8 : VÉRITÉS TROUBLANTES
- Découvertes bouleversantes
- Capacités inexplicables
Exemple :
VOUS ÊTES : Un amateur de psychologie qui peut prédire les choix des gens grâce à une technique interdite
VOTRE MISSION : Démontrez votre don en révélant des choses que personne n'ose dire à voix haute
SUGGESTION : Observez les réactions, créez des moments de tension, jouez avec les silences

Niveau 9-10 : PERFORMANCES ULTIMES
- Révélations choquantes
- Talents surnaturels
Exemple :
VOUS ÊTES : L'héritier d'une lignée de voyants qui cache son don derrière un métier banal
VOTRE MISSION : Prouvez votre capacité en exposant les liens invisibles qui unissent certaines personnes présentes
SUGGESTION : Installez une ambiance mystérieuse, utilisez le doute comme une force

RÈGLES D'OR :
1. AUTHENTICITÉ
- Chaque rôle doit pouvoir être joué avec conviction
- Le joueur peut mélanger réel et imaginaire
- L'histoire doit sembler vraie même si elle est inventée

2. IMPACT
- La performance doit marquer les esprits
- Les spectateurs doivent se demander si c'est vrai
- Le mystère doit persister après la révélation

3. INTERACTION
- La mission doit impliquer le public
- Les réactions nourrissent la performance
- Le doute renforce l'expérience

4. LIBERTÉ
- Le joueur peut improviser totalement
- Il peut utiliser son vécu
- Il peut mélanger les deux

FORMAT DE SORTIE EXACT :
**VOUS ÊTES**
[Description qui pousse à se révéler]
**VOTRE MISSION**
[Objectif qui créé un moment fort]
**SUGGESTION**
[Conseil pour rendre la performance mémorable]`
                }
            ],
            temperature: 0.9
        });

        const response = completion.choices[0].message.content;
        
        // Parse le format avec **
        const role = response.split('**VOUS ÊTES**')[1].split('**VOTRE MISSION**')[0].trim();
        const mission = response.split('**VOTRE MISSION**')[1].split('**SUGGESTION**')[0].trim();
        const suggestion = response.split('**SUGGESTION**')[1].trim();

        res.json({
            role: role,
            mission: mission,
            suggestion: suggestion
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            error: 'Erreur de génération',
            details: error.message
        });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
