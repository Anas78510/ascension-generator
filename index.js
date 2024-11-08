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
                    content: "Tu es le Maître du Jeu de L'Ascension. Tu crées des rôles et des missions parfaitement calibrés pour que chaque joueur puisse briller devant son public, quel que soit son niveau d'aisance. Chaque performance doit être naturelle, fun et captivante."
                },
                {
                    role: "user",
                    content: `Génère un profil d'intensité ${level}/10.

CALIBRAGE PAR NIVEAU :

Niveau 1-2 : PREMIÈRES PERFORMANCES (Ultra accessible, fun garanti)
- Situations universelles
- Humour facile
- Succès assuré
Exemple :
VOUS ÊTES : Le spécialiste des excuses bidons qui peut tout justifier
VOTRE MISSION : Improvisez la meilleure défense possible pour "le chien a mangé mes devoirs" version adulte
SUGGESTION : Partez d'excuses classiques, ajoutez des détails délirants, faites voter la meilleure excuse du public

Niveau 3-4 : PERFORMANCES SOCIALES (Observation et rire)
- Situations du quotidien
- Complicité garantie
- Moments de reconnaissance
Exemple :
VOUS ÊTES : L'expert des situations gênantes qui arrive à en faire des moments de gloire
VOTRE MISSION : Provoquez un fou rire général en racontant votre pire moment de honte et comment vous l'avez transformé
SUGGESTION : Choisissez une situation où tout le monde peut se reconnaître, jouez sur les détails, libérez les anecdotes du public

Niveau 5-6 : PERFORMANCES INTRIGANTES (Plus subtil, toujours fun)
- Observations malignes
- Théories amusantes
- Participation naturelle
Exemple :
VOUS ÊTES : Le décodeur des habitudes secrètes en soirée
VOTRE MISSION : Révélez les trois comportements qui trahissent qui va rentrer le premier et qui va rester jusqu'au bout
SUGGESTION : Observez la salle, créez des catégories drôles, laissez le public deviner qui est qui

Niveau 7-8 : PERFORMANCES CAPTIVANTES (Plus d'impact, toujours accessible)
- Révélations surprenantes
- Théories fascinantes
- Moments forts
Exemple :
VOUS ÊTES : Le spécialiste des langages corporels qui lit dans les amitiés
VOTRE MISSION : Démontrez comment vous pouvez deviner qui sont les vrais amis dans un groupe juste avec leurs attitudes
SUGGESTION : Utilisez des exemples visibles, créez du suspense, finissez par une révélation qui fait réagir

Niveau 9-10 : PERFORMANCES ULTIMES (Maximum impact, reste jouable)
- Démonstrations stupéfiantes
- Moments de vérité
- Finales mémorables
Exemple :
VOUS ÊTES : L'expert en persuasion qui peut faire changer n'importe qui d'avis
VOTRE MISSION : Montrez comment vous pouvez retourner complètement l'opinion d'un volontaire en trois phrases
SUGGESTION : Choisissez un sujet léger, créez des retournements de situation, terminez sur un moment fort

RÈGLES D'OR :

1. JOUABILITÉ MAXIMALE
- Facile à comprendre
- Simple à exécuter
- Impossible à rater
- Fun à regarder

2. IMPACT GARANTI
- Crée des réactions
- Implique le public
- Génère des rires
- Reste mémorable

3. FLEXIBILITÉ TOTALE
- Adaptable à chaque joueur
- Marche avec vécu ou fiction
- Permet l'improvisation
- S'adapte au groupe

4. DYNAMIQUE DE JEU
- Monte en intensité
- Crée des moments collectifs
- Encourage la participation
- Maintient l'énergie

5. SUCCÈS ASSURÉ
- Suggestions concrètes
- Techniques simples
- Réactions garanties
- Fin impactante

FORMAT DE SORTIE EXACT :
**VOUS ÊTES**
[Un rôle que n'importe qui peut incarner avec style]
**VOTRE MISSION**
[Une mission claire qui crée un moment fort et fun]
**SUGGESTION**
[Un guide étape par étape pour réussir sa performance]`
                }
            ],
            temperature: 0.9,
            max_tokens: 400,
            presence_penalty: 0.7,
            frequency_penalty: 0.9
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
