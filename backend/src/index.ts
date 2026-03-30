import cors from 'cors';
import express from 'express';
import { authRouter } from './routes/auth.routes.js';
import { parentRouter } from './routes/parent.routes.js';
import { studentRouter } from './routes/student.routes.js';

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('*', cors());

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'synapse-backend' });
});

app.use('/api/auth', authRouter);
app.use('/api/student', studentRouter);
app.use('/api/parent', parentRouter);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Synapse backend running on port ${PORT}`);
});
