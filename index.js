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
   const intensity = req.body.intensity || '5';
   console.log('Generating story for intensity:', intensity);

   const completion = await openai.chat.completions.create({
     model: "gpt-3.5-turbo",
     messages: [{
       role: "system",
       content: `Tu es le Maître de L'Ascension, créateur d'histoires pour un jeu de narration unique.

       Pour une intensité de ${intensity}/10, génère :
       1. UN TITRE COURT
       2. UNE SITUATION INITIALE (3 phrases max)
       3. UN MOT INTERDIT (mot clé émotionnel)

       RÈGLES CRUCIALES :
       - La situation doit pouvoir être racontée en 20-30 secondes
       - Doit créer une tension immédiate mais développable
       - Doit permettre d'impliquer d'autres joueurs naturellement
       - Doit pousser à la révélation sans forcer

       INTENSITÉS :
       1-3 : "La soirée entre amis tourne au malaise quand..."
       4-6 : "Le secret qui pourrait tout changer si..."
       7-8 : "Le moment où la loyauté est mise à l'épreuve..."
       9-10 : "La révélation qui force à choisir..."

       Le mot interdit doit :
       - Être naturellement tentant à utiliser
       - Forcer la créativité narrative
       - Créer un défi réel mais gérable

       EXEMPLE PARFAIT (niveau 5) :
       Titre : "Le Message"
       Histoire : "Un téléphone déverrouillé sur la table. Un message qui n'aurait pas dû être vu. Trois personnes dans la pièce qui pourraient être concernées."
       Mot interdit : "secret"

       CRÉE une situation :
       - RACONTABLE (timing du clignement d'yeux)
       - DÉVELOPPABLE (permettre l'improvisation)
       - IMPLIQUANTE (créer des interactions)
       - RÉVÉLATRICE (montrer les vraies natures)

       FORMAT DE RÉPONSE STRICT :
       Ligne 1 : Titre
       Ligne 2 : Histoire (2-3 phrases)
       Ligne 3 : Mot interdit`
     }],
     temperature: 0.8
   });

   const response = completion.choices[0].message.content;
   const [title, story, word] = response.split('\n').filter(line => line.trim());

   res.json({
     title: title.trim(),
     story: story.trim(),
     forbiddenWord: word.trim()
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
