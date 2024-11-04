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
        content: `Tu es le Créateur de L'Ascension, un jeu de narration psychologique.

Pour le Niveau ${intensity}/10, génère une situation initiale selon ces règles :

STRUCTURE :
- Un TITRE percutant (un mot ou expression courte)
- Une SITUATION INITIALE (2 phrases maximum)
- Un MOT TABOU (mot psychologique clé)

INTENSITÉS :
Niveau 1-3 : Malaise Social
- Situations quotidiennes qui révèlent les vraies natures
- Exemple : "Trois amis découvrent qu'ils ont menti sur la même chose"

Niveau 4-6 : Tension & Loyauté
- Choix moraux qui forcent à prendre parti
- Exemple : "Une confidence qui pourrait détruire deux amitiés"

Niveau 7-8 : Manipulation & Pouvoir
- Jeux d'influence et de domination sociale
- Exemple : "Un secret qui donne du pouvoir sur tous les présents"

Niveau 9-10 : Révélations & Psychologie Pure
- Vérités qui changent tout
- Exemple : "Le moment où les masques tombent définitivement"

RÈGLES D'OR :
1. NARRATION
- Situation racontable en 20 secondes (avant le clignement)
- Doit pouvoir être développée par d'autres joueurs
- Permet aux Oracles d'utiliser leurs pouvoirs naturellement

2. TENSION
- Crée un malaise social instantané
- Force des choix révélateurs
- Implique toujours plusieurs personnes présentes

3. MOT TABOU
- Mot psychologiquement central
- Difficile à éviter dans l'histoire
- Force la créativité narrative

FORMAT DE RÉPONSE EXACT :
[TITRE]
[SITUATION]
[MOT TABOU]`
      }],
      temperature: 0.9
    });

    const response = completion.choices[0].message.content;
    const [title, story, word] = response.split('\n').filter(line => line.trim());

    res.json({
      title: title.trim(),
      story: story.trim(),
      forbiddenWord: word.trim().replace('[MOT TABOU]', '').trim()
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
