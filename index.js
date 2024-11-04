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
        content: `Tu es un générateur d'histoires pour un jeu de rôle narratif.
                  Génère une histoire courte avec les éléments suivants, séparés par des retours à la ligne :
                  - Un titre court et accrocheur
                  - Une histoire de 2-3 phrases maximum
                  - Un mot unique qui sera interdit aux joueurs pendant leur narration

                  L'intensité est de ${intensity}/10 où :
                  1 = histoire légère et amusante
                  5 = histoire avec un peu de tension
                  10 = histoire profonde et psychologique`
      }],
      temperature: 0.8
    });

    const response = completion.choices[0].message.content;
    const [title, story, word] = response.split('\n').filter(line => line.trim());

    res.json({
      title: title.replace('- ', ''),
      story: story.replace('- ', ''),
      forbiddenWord: word.replace('- ', '')
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
