const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Route de test
app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Route principale
app.post('/generate-story', async (req, res) => {
  try {
    const intensity = req.body.intensity || '5';
    console.log('Generating story for intensity:', intensity);

    // Pour tester, on renvoie une histoire fixe
    return res.json({
      title: "Test Story",
      story: "Ceci est une histoire test de niveau " + intensity,
      forbiddenWord: "test"
    });

    /* On commentera le code OpenAI pour l'instant
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "system",
        content: `Génère une histoire courte...`
      }]
    });
    */
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Erreur de génération',
      details: error.message 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
