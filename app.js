// app.js
const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

// Enable CORS so your Vue.js app can access the API
app.use(cors());

// Array of words to generate random text
const words = ['apple', 'banana', 'cherry', 'date', 'fig', 'grape', 'lemon'];

app.get('/items', (req, res) => {
    // Get the 'q' query parameter for filtering (optional)
    const query = req.query.q ? req.query.q.toLowerCase() : '';

    // Generate an array of items
    const items = [];
    for (let i = 1; i <= 50; i++) {
        const randomWord = words[Math.floor(Math.random() * words.length)];
        const text = `${randomWord}`;
        if (text.toLowerCase().includes(query)) {
            items.push({ id: i, text: text });
        }
    }

    res.json(items);
});

app.listen(port, () => {
    console.log(`API server running at http://localhost:${port}`);
});
