const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname))); // Serve arquivos estáticos (html, css, js, assets)

// Rota principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// API Proxy (opcional - para evitar CORS)
app.get('/api/coins', async (req, res) => {
  try {
    const response = await fetch('https://coinhat.onrender.com/api/coins');
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar dados' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 BCswap rodando em: http://localhost:${PORT}`);
});
