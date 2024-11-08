require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const mongoose = require('mongoose');

const app = express();

// Connexion MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connecté à MongoDB!'))
  .catch(err => console.error('Erreur MongoDB:', err));

// Modèle pour les codes de jeu
const GameCode = mongoose.model('GameCode', {
    code: String,           // Code unique dans la boîte
    isActivated: Boolean,   // Si le code a été utilisé
    activatedAt: Date,      // Quand
    dailyUsage: [{         // Suivi utilisation
        date: Date,
        count: Number
    }]
});

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Middleware de vérification
const validateGameAccess = async (req, res, next) => {
    try {
        const gameCode = req.headers['x-game-code'];
        
        if (!gameCode) {
            return res.status(401).json({ error: 'Code requis' });
        }

        // Vérifie le code
        const game = await GameCode.findOne({ code: gameCode });
        
        if (!game || !game.isActivated) {
            return res.status(403).json({ error: 'Code invalide ou non activé' });
        }

        // Vérifie l'utilisation quotidienne
        const today = new Date().toDateString();
        const todayUsage = game.dailyUsage.find(
            u => u.date.toDateString() === today
        );

        if (todayUsage && todayUsage.count >= 50) {
            return res.status(429).json({ error: 'Limite quotidienne atteinte' });
        }

        // Met à jour le compteur
        if (!todayUsage) {
            game.dailyUsage.push({ date: new Date(), count: 1 });
        } else {
            todayUsage.count++;
        }
        await game.save();

        next();
    } catch (error) {
        res.status(500).json({ error: 'Erreur de validation' });
    }
};

// Route pour activer un code de jeu
app.post('/activate-game', async (req, res) => {
    const { gameCode } = req.body;
    
    try {
        const game = await GameCode.findOne({ code: gameCode });
        
        if (!game || game.isActivated) {
            return res.status(400).json({ error: 'Code invalide ou déjà utilisé' });
        }

        game.isActivated = true;
        game.activatedAt = new Date();
        await game.save();

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Erreur d\'activation' });
    }
});

// Générateur avec la vérification ajoutée
app.post('/generate-story', validateGameAccess, async (req, res) => {
    try {
        const { intensity } = req.body;
        const level = intensity || '5';
        
        console.log('Generating story for intensity:', level);

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "Tu es le Créateur du jeu ultime de performance narrative. Tu génères des rôles et missions qui poussent les joueurs à créer des moments INOUBLIABLES, entre réel et imaginaire, toujours jouables mais profondément impactants."
                },
                {
                    role: "user",
                    content: `Génère un profil d'intensité ${level}/10.

CALIBRAGE PAR NIVEAU :

Niveau 1-3 : PERFORMANCES IMPACTANTES
- Performance naturelle
- Talents surprenants
- Révélations légères
Exemple :
VOUS ÊTES : Un expert en comportements absurdes qui analyse les manies inavouables
VOTRE MISSION : Prouvez que nos petites hontes quotidiennes révèlent qui on est vraiment
SUGGESTION : Commencez par avouer un truc gênant, observez les sourires complices, enchaînez les révélations

Niveau 4-6 : PERFORMANCES PSYCHOLOGIQUES
- Observations brillantes
- Analyses percutantes
- Tests sociaux
Exemple :
VOUS ÊTES : Un expert en négociation qui a découvert le point faible universel
VOTRE MISSION : Démontrez comment vous avez obtenu tout ce que vous vouliez en utilisant une technique interdite
SUGGESTION : Commencez par une demande innocente au public, révélez progressivement votre méthode

Niveau 7-8 : RÉVÉLATIONS FASCINANTES
- Découvertes troublantes
- Vérités cachées
- Moments forts
Exemple :
VOUS ÊTES : Un analyste des comportements qui décrypte les rituels sociaux
VOTRE MISSION : Prouvez que certains gestes quotidiens révèlent nos plus grands mensonges
SUGGESTION : Observez les tics nerveux dans la salle, construisez une théorie captivante

Niveau 9-10 : PERFORMANCES ULTIMES
- Confessions bouleversantes
- Démonstrations stupéfiantes
- Révélations choc
Exemple :
VOUS ÊTES : Un profiler qui a découvert un lien entre le choix des mots et les secrets
VOTRE MISSION : Révélez comment une simple phrase peut trahir le plus grand secret d'une personne
SUGGESTION : Analysez le langage de volontaires, créez une tension palpable, finissez par une révélation choc

RÈGLES D'OR :

1. JOUABILITÉ
- Situations 100% réalisables
- Performances accessibles
- Impact garanti
- Fun à jouer

2. CRÉDIBILITÉ
- Basé sur du possible
- Entre réel et imaginaire
- Toujours plausible
- Mystérieux mais crédible

3. IMPACT
- Crée des moments forts
- Implique l'audience
- Pousse aux révélations
- Reste mémorable

4. ÉQUILIBRE
- Mélange humour et mystère
- Dose le sérieux
- Permet l'improvisation
- S'adapte au joueur

FORMAT DE SORTIE EXACT :
**VOUS ÊTES**
[Un rôle captivant et jouable qui permet d'être brillant]
**VOTRE MISSION**
[Une mission qui pousse à créer un moment inoubliable]
**SUGGESTION**
[Un conseil tactique qui garantit une performance réussie]`
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

// Route pour générer des codes de jeu (à protéger!)
app.post('/admin/generate-codes', async (req, res) => {
    const { count = 1 } = req.body;
    
    try {
        const codes = [];
        for (let i = 0; i < count; i++) {
            const code = 'ASC-' + Math.random().toString(36).substr(2, 6).toUpperCase();
            await GameCode.create({ code });
            codes.push(code);
        }
        
        res.json({ codes });
    } catch (error) {
        res.status(500).json({ error: 'Erreur de génération des codes' });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
