require('dotenv').config();
const express = require('express');
const cors = require('cors');
const taskRoutes = require('./routes/taskRoutes');
const weatherRoutes = require('./routes/weatherRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '100kb' }));
const connectDB = require('./config/db');


app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use(async (req, res, next) => {
  try { await connectDB(); next(); } catch (err) { next(err); }
});
app.use('/api/tasks', taskRoutes);
app.use('/api/weather', weatherRoutes);

app.use(notFound);
app.use(errorHandler);
module.exports = app;


const PORT = process.env.PORT || 5000;

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  connectDB()
    .then(() => app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`)))
    .catch((err) => { console.error(err.message); process.exit(1); });
}
