const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post('/generate-story', async (req, res) => {
  try {
    const { intensity } = req.body;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "system",
        content: `Génère une histoire courte initiale pour un jeu de narration. 
                  Niveau d'intensité: ${intensity}/10. 
                  Format requis: 
                  - Un titre court
                  - Une histoire de 2-3 phrases
                  - Un mot interdit lié à l'histoire
                  L'intensité 1 est légère et amusante, 10 est profonde et psychologique.`
      }],
      temperature: 0.8
    });

    const story = completion.choices[0].message.content;
    
    // Parse the response
    const [title, content, forbiddenWord] = story.split('\n').filter(line => line.trim());

    res.json({
      title: title,
      story: content,
      forbiddenWord: forbiddenWord
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur de génération' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
