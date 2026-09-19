const express = require('express');

const app = express();
app.use(express.json({ limit: '1mb' }));

app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/campaigns/:id/prompt-versions', require('./routes/promptVersions'));
app.use('/campaigns', require('./routes/campaigns'));
app.use('/prospects', require('./routes/prospects'));
app.use('/campaign-prospects', require('./routes/campaignProspects'));
app.use('/activities', require('./routes/activities'));
app.use('/reps', require('./routes/reps'));
app.use('/campaign-reps', require('./routes/campaignReps'));
app.use('/suppression-list', require('./routes/suppressionList'));
app.use('/global-settings', require('./routes/globalSettings'));
app.use('/approvals', require('./routes/approvals'));
app.use('/meetings', require('./routes/meetings'));

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Catches errors thrown outside route handlers, e.g. malformed JSON bodies.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: status >= 500 ? 'Internal server error' : err.message });
});

module.exports = app;
