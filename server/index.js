import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import settingsRoutes from './routes/settings.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/settings', settingsRoutes);

app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
