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
                   content: "Tu es le Créateur de L'Ascension, un jeu de narration psychologique qui pousse les joueurs à se dépasser et à créer des moments inoubliables. Réponds UNIQUEMENT avec un rôle et une mission selon le format demandé."
               },
               {
                   role: "user",
                   content: `Génère un rôle et une mission d'intensité ${level}/10.

CALIBRAGE PAR NIVEAU :

Niveau 1-3 : IMAGINATION & CHARISME
- Rôles percutants et amusants
- Missions qui poussent à captiver son audience
Exemple :
VOUS ÊTES : Un expert en psychologie qui a découvert que le rire cache des secrets inavoués
VOTRE MISSION : Démontrer comment la façon de rire de chacun révèle sa véritable personnalité

Niveau 4-6 : MYSTÈRE & TENSION
- Rôles intrigants et mystérieux
- Missions qui créent du suspense
Exemple :
VOUS ÊTES : Un maître dans l'art de déchiffrer les non-dits
VOTRE MISSION : Révéler les véritables intentions qui se cachent derrière les gestes anodins du groupe

Niveau 7-8 : MANIPULATION & POUVOIR
- Rôles qui donnent du pouvoir
- Missions qui testent les limites
Exemple :
VOUS ÊTES : Un expert en manipulation psychologique qui utilise son don à des fins éthiques
VOTRE MISSION : Prouver votre talent en révélant les secrets que certains pensaient avoir bien cachés

Niveau 9-10 : RÉVÉLATION ULTIME
- Rôles qui bouleversent
- Missions qui marquent les esprits
Exemple :
VOUS ÊTES : Un être capable de lire dans les souvenirs les plus profonds
VOTRE MISSION : Démontrer comment un événement passé relie secrètement plusieurs personnes présentes

RÈGLES CRUCIALES :

1. LE RÔLE
- Original mais crédible
- Donne envie d'impressionner
- Permet d'être créatif
- Pousse à se dépasser

2. LA MISSION
- Implique le groupe
- Force à être captivant
- Crée de la tension
- Permet des moments forts

3. PRINCIPES
- Pas de clichés
- Profondeur psychologique
- Engagement émotionnel
- Impact social fort

FORMAT EXACT :
VOUS ÊTES : [Le rôle en une phrase]
VOTRE MISSION : [La mission en une phrase]`
               }
           ],
           temperature: 0.9
       });

       const response = completion.choices[0].message.content;
       const [role, mission] = response.split('\n').map(line => {
           if (line.startsWith('VOUS ÊTES : ')) {
               return line.replace('VOUS ÊTES : ', '');
           }
           if (line.startsWith('VOTRE MISSION : ')) {
               return line.replace('VOTRE MISSION : ', '');
           }
           return line;
       });

       res.json({
           role: role.trim(),
           mission: mission.trim()
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
