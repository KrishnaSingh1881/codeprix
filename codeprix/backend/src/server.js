require('dotenv').config();
const express = require('express');
const cors = require('cors');

const eventsRouter      = require('./routes/events');
const questionsRouter   = require('./routes/questions');
const leaderboardRouter = require('./routes/leaderboard');
const teamsRouter       = require('./routes/teams');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/events', eventsRouter);
app.use('/api/questions', questionsRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/teams', teamsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`CodePrix API running on http://localhost:${PORT}`);
});
