// index.js - Version ULTIME
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
                   content: "Tu es le Créateur de L'Ascension. Tu génères des rôles et des missions qui poussent les joueurs à se révéler et à briller. Réponds UNIQUEMENT avec deux lignes selon le format demandé."
               },
               {
                   role: "user",
                   content: `Génère un rôle et une mission d'intensité ${level}/10.

CALIBRAGE PAR NIVEAU :

Niveau 1-3 : PROFILS ACCESSIBLES
- Situations quotidiennes avec twist
- Missions qui mettent en confiance
Exemple :
VOUS ÊTES : Un observateur du comportement humain qui a développé une théorie fascinante
VOTRE MISSION : Expliquer pourquoi les habitudes des gens présents confirment votre découverte révolutionnaire

Niveau 4-6 : PROFILS INTRIGANTS
- Situations personnelles fortes
- Missions qui poussent à se dévoiler
Exemple :
VOUS ÊTES : Le confident involontaire de secrets troublants
VOTRE MISSION : Révéler comment vous avez découvert un fil conducteur entre les confidences reçues

Niveau 7-8 : PROFILS MYSTÉRIEUX
- Situations intenses
- Missions qui créent de la tension
Exemple :
VOUS ÊTES : Un maître manipulateur qui utilise son don pour une cause noble
VOTRE MISSION : Démontrer comment vous pouvez lire les véritables intentions des gens présents

Niveau 9-10 : PROFILS ULTIMES
- Situations extraordinaires
- Missions qui bouleversent
Exemple :
VOUS ÊTES : Le gardien d'une vérité qui change tout
VOTRE MISSION : Expliquer pourquoi ce que vous venez de comprendre va transformer la vision que les gens ont d'eux-mêmes

RÈGLES CRUCIALES :

1. LE RÔLE
- Facile à comprendre
- Donne envie d'être joué
- Permet d'être créatif
- Crée une identité forte

2. LA MISSION
- Claire et spécifique
- Pousse à être convaincant
- Permet l'improvisation
- Crée des moments forts

3. FORMAT
- Langage direct
- Pas de complexité inutile
- Force à être captivant
- Laisse place à l'imagination

FORMAT DE SORTIE EXACT :
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
