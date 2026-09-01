require('dotenv').config();
require('./database/database').connect();

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;
const router = require("./routes/index")

// Allow CORS for development and production frontend URL
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
}));
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello from the backend!');
});

app.use('/api', router);

app.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}`);
});
