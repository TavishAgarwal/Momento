import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { offerRouter } from './routes/offer.js';
import { payoneRouter } from './routes/payone.js';
import { pushRouter, initPushIO } from './routes/push.js';
import { contextRouter } from './routes/context.js';
import { merchantRouter } from './routes/merchant.js';
import { redemptionRouter } from './routes/redemption.js';
import { placesRouter } from './routes/places.js';
import * as merchantSocket from './services/merchantSocket.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// Env validation
if (!process.env.OPENAI_API_KEY) {
  console.warn('[Server] ⚠ OPENAI_API_KEY not set — will use context-aware fallback offers');
}

app.use(cors());
app.use(express.json());

// Rate limiting on offer generation
const offerLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many offer requests. Max 10 per minute.' },
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now(), service: 'momento-api' });
});

// Routes
app.use('/api/offer', offerLimiter, offerRouter);
app.use('/api/payone', payoneRouter);
app.use('/api/push', pushRouter);
app.use('/api/context', contextRouter);
app.use('/api/merchant', merchantRouter);
app.use('/api/redemption', redemptionRouter);
app.use('/api/places', placesRouter);

// Initialise merchant socket with io instance
merchantSocket.init(io);
initPushIO(io);

// Socket.io connections
io.on('connection', (socket) => {
  console.log('[Socket] Client connected:', socket.id);

  socket.on('join-merchant', (merchantId) => {
    socket.join(`merchant:${merchantId}`);
    console.log(`[Socket] ${socket.id} joined merchant:${merchantId}`);
  });

  socket.on('disconnect', () => {
    console.log('[Socket] Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`[MOMENTO] Server running on http://localhost:${PORT}`);
  console.log(`[MOMENTO] API Key: ${process.env.OPENAI_API_KEY ? '✓ Set' : '✗ Missing'}`);
  console.log(`[MOMENTO] Weather Key: ${process.env.OPENWEATHERMAP_API_KEY ? '✓ Set' : '✗ Missing'}`);
  // Print LAN IP for mobile access
  import('os').then(os => {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
      for (const net of nets[name] || []) {
        if (net.family === 'IPv4' && !net.internal) {
          console.log(`[MOMENTO] 📱 Mobile access: http://${net.address}:${PORT}`);
        }
      }
    }
  });
});
