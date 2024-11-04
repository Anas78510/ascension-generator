const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Route de test simple
app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

app.post('/generate-story', async (req, res) => {
  try {
    console.log('Received request for intensity:', req.body.intensity);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "system",
        content: `Génère une histoire courte initiale pour un jeu de narration. 
                  Niveau d'intensité: ${req.body.intensity}/10. 
                  Format requis: 
                  - Un titre court
                  - Une histoire de 2-3 phrases
                  - Un mot interdit lié à l'histoire
                  L'intensité 1 est légère et amusante, 10 est profonde et psychologique.`
      }],
      temperature: 0.8
    });

    console.log('OpenAI response:', completion.choices[0]);

    res.json({
      title: "Test Title",
      story: "Test Story",
      forbiddenWord: "test"
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Erreur de génération', details: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
