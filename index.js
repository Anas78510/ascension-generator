require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const mongoose = require('mongoose');

const app = express();

// Codes Admin permanents
const ADMIN_CODES = [
    'MASTER-ASCENSION-2024',  // Code principal
    'ADMIN-TEST-2024'         // Code test
];

// Connexion MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connecté à MongoDB!'))
  .catch(err => console.error('Erreur MongoDB:', err));

// Modèle pour les codes de jeu
const GameCode = mongoose.model('GameCode', {
    code: String,
    isActivated: Boolean,
    deviceId: String,
    activatedAt: Date,
    type: {
        type: String,
        enum: ['admin', 'standard'],
        default: 'standard'
    },
    dailyUsage: [{
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
        const deviceId = req.headers['x-device-id'];
        
        // Vérifie si c'est un code admin
        if (ADMIN_CODES.includes(gameCode)) {
            next();
            return;
        }

        // Pour les codes standards
        const game = await GameCode.findOne({ code: gameCode });
        
        if (!game) {
            return res.status(403).json({ error: 'Code invalide' });
        }

        // Vérifie l'appareil
        if (game.isActivated && game.deviceId && game.deviceId !== deviceId) {
            return res.status(403).json({ error: 'Code déjà utilisé sur un autre appareil' });
        }

        // Active le code si premier usage
        if (!game.isActivated) {
            game.isActivated = true;
            game.deviceId = deviceId;
            game.activatedAt = new Date();
        }

        // Vérifie l'utilisation quotidienne (sauf admin)
        if (game.type !== 'admin') {
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
        }

        await game.save();
        next();
    } catch (error) {
        res.status(500).json({ error: 'Erreur de validation' });
    }
};

// Route pour générer des codes
app.post('/admin/generate-codes', async (req, res) => {
    const { count = 1, prefix = 'ASC' } = req.body;
    const adminCode = req.headers['x-admin-code'];

    if (!ADMIN_CODES.includes(adminCode)) {
        return res.status(403).json({ error: 'Accès non autorisé' });
    }
    
    try {
        const codes = [];
        for (let i = 0; i < count; i++) {
            const code = `${prefix}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
            await GameCode.create({ 
                code,
                isActivated: false,
                type: 'standard'
            });
            codes.push(code);
        }
        
        res.json({ 
            message: `${count} codes générés avec succès`,
            prefix: prefix,
            codes: codes 
        });
    } catch (error) {
        res.status(500).json({ error: 'Erreur de génération des codes' });
    }
});

// Générateur avec vérification
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
                    content: "Tu es le Créateur du jeu ultime de performance narrative. Tu génères des rôles et missions qui poussent les joueurs à créer des moments INOUBLIABLES, entre réel et imaginaire, toujours jouables mais profondément impactants. Chaque mission doit être parfaitement calibrée pour permettre au joueur de briller, qu'il invente ou utilise son vécu."
                },
                {
                    role: "user",
                    content: `Génère un profil d'intensité ${level}/10.

CALIBRAGE PAR NIVEAU :

Niveau 1-3 : PERFORMANCES ACCESSIBLES
- Talents surprenants mais jouables
- Théories fascinantes sur le quotidien
- Observations qui captent l'attention
Exemple :
VOUS ÊTES : Le roi/la reine des excuses bidon qui peut justifier l'injustifiable
VOTRE MISSION : Improvisez la meilleure excuse de tous les temps pour un retard/oubli devant le groupe
SUGGESTION : Commencez petit puis ajoutez des rebondissements de plus en plus délirants, faites participer le public

Niveau 4-6 : RÉVÉLATIONS INTRIGANTES
- Expériences troublantes
- Découvertes mystérieuses
- Talents cachés
Exemple :
VOUS ÊTES : Le seul à avoir remarqué ce détail fascinant sur la mémoire des prénoms
VOTRE MISSION : Expliquez comment vous avez découvert que la façon dont les gens se présentent révèle leur plus grand mensonge
SUGGESTION : Faites-les se présenter à nouveau, arrêtez-vous sur des détails, créez des théories folles mais crédibles

Niveau 7-8 : PERFORMANCES PSYCHOLOGIQUES
- Observations brillantes
- Théories captivantes
- Expériences fascinantes
Exemple :
VOUS ÊTES : Un expert en manipulation qui utilise son don pour une cause noble
VOTRE MISSION : Prouvez que vous pouvez faire avouer n'importe quoi à n'importe qui avec 3 questions
SUGGESTION : Choisissez votre cible avec soin, posez des questions apparemment banales, créez le moment de vérité

Niveau 9-10 : PERFORMANCES ULTIMES
- Confessions bouleversantes
- Révélations stupéfiantes
- Moments inoubliables
Exemple :
VOUS ÊTES : Le témoin d'un phénomène inexplicable qui se répète
VOTRE MISSION : Montrez comment certaines personnes présentes l'ont aussi vécu sans le savoir
SUGGESTION : Installez le doute, construisez la tension, finissez par une révélation qui marque les esprits

RÈGLES CRUCIALES :

1. PERFORMANCE
- Toujours 100% jouable
- Mix possible réel/fiction
- Impact garanti
- Permet de briller

2. IMPACT
- Crée des moments forts
- Captive l'audience
- Reste mémorable
- Pousse à l'interaction

3. CRÉDIBILITÉ
- Entre vérité et mystère
- Théories fascinantes mais plausibles
- Observations captivantes
- Révélations possibles

4. LIBERTÉ CRÉATIVE
- Permet d'inventer
- Permet d'utiliser son vécu
- Permet de mélanger les deux
- S'adapte au joueur

FORMAT DE SORTIE EXACT :
**VOUS ÊTES**
[Un rôle qui permet d'être brillant tout en restant crédible]
**VOTRE MISSION**
[Une mission qui crée un vrai moment fort tout en restant jouable]
**SUGGESTION**
[Un conseil tactique précis pour réussir sa performance]`
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
