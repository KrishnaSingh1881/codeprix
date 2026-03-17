require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const eventsRouter      = require('./routes/events');
const questionsRouter   = require('./routes/questions');
const leaderboardRouter = require('./routes/leaderboard');
const teamsRouter       = require('./routes/teams');
const pagesRouter       = require('./routes/pageRoutes');
const usersRouter       = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 4000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected successfully!'))
  .catch((err) => console.log('Error connecting to MongoDB:', err));

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/events', eventsRouter);
app.use('/api/questions', questionsRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/teams', teamsRouter);
app.use('/api/pages', pagesRouter);
app.use('/api/users', usersRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`CodePrix API running on http://localhost:${PORT}`);
});
