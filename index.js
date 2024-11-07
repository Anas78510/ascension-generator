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
                    content: "Tu es le Créateur du jeu ultime de performance narrative. Tu génères des rôles et missions qui poussent les joueurs à créer des moments INOUBLIABLES, entre réel et imaginaire, toujours jouables mais profondément impactants."
                },
                {
                    role: "user",
                    content: `Génère un profil d'intensité ${level}/10.

CALIBRAGE PAR NIVEAU :

Niveau 1-3 : PERFORMANCES IMPACTANTES
- Talents surprenants
- Révélations du quotidien
Exemple :
VOUS ÊTES : Un spécialiste des derniers mots qui collectionne les phrases finales
VOTRE MISSION : Expliquez pourquoi la dernière phrase d'une personne révèle toujours sa vraie nature
SUGGESTION : Utilisez des exemples connus, puis passez aux personnes présentes, créez des théories fascinantes

Niveau 4-6 : PERFORMANCES PSYCHOLOGIQUES
- Observations brillantes
- Analyses percutantes
Exemple :
VOUS ÊTES : Un expert en négociation qui a découvert le point faible universel
VOTRE MISSION : Démontrez comment vous avez obtenu tout ce que vous vouliez en utilisant une technique interdite
SUGGESTION : Commencez par une demande innocente au public, révélez progressivement votre méthode

Niveau 7-8 : RÉVÉLATIONS FASCINANTES
- Découvertes troublantes
- Vérités cachées
Exemple :
VOUS ÊTES : Un analyste des comportements qui décrypte les rituels sociaux
VOTRE MISSION : Prouvez que certains gestes quotidiens révèlent nos plus grands mensonges
SUGGESTION : Observez les tics nerveux dans la salle, construisez une théorie captivante

Niveau 9-10 : PERFORMANCES ULTIMES
- Confessions bouleversantes
- Démonstrations stupéfiantes
Exemple :
VOUS ÊTES : Un profiler qui a découvert un lien entre le choix des mots et les secrets
VOTRE MISSION : Révélez comment une simple phrase peut trahir le plus grand secret d'une personne
SUGGESTION : Analysez le langage de volontaires, créez une tension palpable, finissez par une révélation choc

RÈGLES CRUCIALES :

1. IMPACT MAXIMUM
- Toujours surprenant
- Profondément fascinant
- Subtilement troublant
- Parfaitement jouable

2. CRÉDIBILITÉ ABSOLUE
- Basé sur des éléments réels
- Mélange vérité et théorie
- Permet l'improvisation
- Reste toujours plausible

3. FLEXIBILITÉ TOTALE
- Adaptable à chaque joueur
- Utilisable avec vécu ou fiction
- Permet différents styles
- Crée des moments uniques

4. TENSION NARRATIVE
- Monte en intensité
- Crée des moments forts
- Implique l'audience
- Finit sur un climax

5. EXECUTION PARFAITE
- Guide clair et précis
- Techniques réalisables
- Conseils pratiques
- Effet garanti

FORMAT EXACT :
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

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
