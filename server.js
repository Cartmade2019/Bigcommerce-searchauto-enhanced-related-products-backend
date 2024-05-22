const express = require('express');
const app = express();
const path = require('path');
require('dotenv').config();
const port = process.env.PORT || 3000;

// server.js
const storeRoutes = require('./routes/appRoutes');

app.use('/static', express.static(path.join(__dirname, 'public')));
// Middleware to use the routes
app.use('/api', storeRoutes);

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});