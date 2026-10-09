import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TONES = ['bell', 'beep', 'chime', 'custom'];

const Settings = mongoose.model('Settings', new mongoose.Schema({
  deviceId: { type: String, unique: true, required: true },
  studyMin: { type: Number, default: 25 },
  breakMin: { type: Number, default: 5 },
  ringtone: { type: String, enum: TONES, default: 'bell' },
  volume: { type: Number, default: 70 },
}, { timestamps: true }));

const Session = mongoose.model('Session', new mongoose.Schema({
  deviceId: { type: String, index: true, required: true },
  type: { type: String, enum: ['study', 'break'], required: true },
  minutes: { type: Number, required: true },
  completedAt: { type: Date, default: Date.now },
}));

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, Math.round(Number(n)) || lo));
const wrap = (fn) => (req, res, next) => fn(req, res).catch(next);

const app = express();
app.use(cors());
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.get('/api/settings/:id', wrap(async (req, res) => {
  const doc = await Settings.findOneAndUpdate(
    { deviceId: req.params.id }, { $setOnInsert: { deviceId: req.params.id } },
    { upsert: true, new: true });
  res.json(doc);
}));

app.put('/api/settings/:id', wrap(async (req, res) => {
  const b = req.body;
  const update = {
    studyMin: clamp(b.studyMin, 1, 99),
    breakMin: clamp(b.breakMin, 1, 99),
    ringtone: TONES.includes(b.ringtone) ? b.ringtone : 'bell',
    volume: clamp(b.volume, 0, 100),
  };
  const doc = await Settings.findOneAndUpdate(
    { deviceId: req.params.id }, update, { upsert: true, new: true });
  res.json(doc);
}));

app.post('/api/sessions', wrap(async (req, res) => {
  const { deviceId, type, minutes } = req.body;
  if (!deviceId || !['study', 'break'].includes(type)) return res.status(400).json({ error: 'Invalid session' });
  res.status(201).json(await Session.create({ deviceId, type, minutes: clamp(minutes, 1, 99) }));
}));

app.get('/api/sessions/:id/stats', wrap(async (req, res) => {
  const since = new Date(req.query.since || Date.now() - 864e5);
  const today = await Session.find({ deviceId: req.params.id, type: 'study', completedAt: { $gte: since } });
  const recent = await Session.find({ deviceId: req.params.id }).sort({ completedAt: -1 }).limit(5);
  res.json({
    todaySessions: today.length,
    todayMinutes: today.reduce((s, x) => s + x.minutes, 0),
    recent,
  });
}));

const dist = path.join(__dirname, '../client/dist');
app.use(express.static(dist));
app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));

app.use((err, _req, res, _next) => { console.error(err); res.status(500).json({ error: 'Server error' }); });

const port = process.env.PORT || 5000;
mongoose.connect(process.env.MONGODB_URI)
  .then(() => app.listen(port, () => console.log(`.dotTime running on :${port}`)))
  .catch((e) => { console.error('MongoDB connection failed:', e.message); process.exit(1); });
