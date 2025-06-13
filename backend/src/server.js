require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Export the io instance so it can be used in other modules
module.exports.io = io;

// In-memory store for active participants (formId -> Set of { userId, email, socketId })
const activeFormParticipants = new Map();
const userSocketMap = new Map(); // socketId -> { userId, formId }

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'collaborative_forms',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

// Middleware
app.use(cors());
app.use(express.json());

// Add API routes
const apiRoutes = require('./routes');
app.use('/', apiRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected');

  // Authenticate the socket connection using JWT token
  const token = socket.handshake.auth.token;
  console.log("Socket received token:", token ? "Yes" : "No"); // Log if token is present
  let userId = null;
  let userEmail = null;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      console.log("JWT decoded user:", decoded);
      userId = decoded.id;
      userEmail = decoded.email;
      socket.user = { id: userId, email: userEmail };
    } catch (err) {
      console.error('Socket authentication failed:', err.message);
      socket.emit('error', { message: 'Authentication failed. Please log in again.' });
      socket.disconnect(true);
      return;
    }
  } else {
    console.log('Client connected without token.');
  }

  socket.on('joinForm', async (formId) => {
    socket.join(formId);
    console.log(`Client joined form: ${formId}`);

    if (socket.user && socket.user.id) {
      try {
        // Add user to active participants for this form
        if (!activeFormParticipants.has(formId)) {
          activeFormParticipants.set(formId, new Set());
        }
        activeFormParticipants.get(formId).add({ id: socket.user.id, email: socket.user.email, socketId: socket.id, joinedAt: new Date() });
        userSocketMap.set(socket.id, { userId: socket.user.id, formId });

        // Broadcast updated participants to all in the room (including admins)
        io.to(formId).emit('activeParticipants', Array.from(activeFormParticipants.get(formId)));
      } catch (error) {
        console.error('Error joining form and tracking participants:', error);
      }
    } else {
      console.log('Guest user joined form, not tracking in active participants.');
    }
  });

  socket.on('requestParticipants', (formId) => {
    if (activeFormParticipants.has(formId)) {
      socket.emit('activeParticipants', Array.from(activeFormParticipants.get(formId)));
    }
  });

  socket.on('formUpdate', async (data) => {
    const { formId, fieldId, value, currentVersion } = data;
    const userId = socket.user?.id;

    if (!userId) {
      socket.emit('error', { message: 'User not authenticated for update.' });
      return;
    }

    try {
      const currentFormResponse = await pool.query(
        'SELECT version FROM form_responses WHERE form_id = $1',
        [formId]
      );

      if (currentFormResponse.rows.length === 0) {
        socket.emit('error', { message: 'Form response not found.' });
        return;
      }

      const dbVersion = currentFormResponse.rows[0].version;

      // Check for optimistic locking conflict
      if (currentVersion !== dbVersion) {
        socket.emit('formConflict', { 
          message: 'Conflict: Form has been updated by another user.',
          latestVersion: dbVersion
        });
        return;
      }

      // Update the database and increment the version
      const updateResult = await pool.query(
        'UPDATE form_responses SET field_values = field_values || $1::jsonb, version = version + 1 WHERE form_id = $2 RETURNING version',
        [{ [fieldId]: value }, formId]
      );

      const newVersion = updateResult.rows[0].version;

      // Broadcast the update to all clients in the form room
      io.to(formId).emit('formUpdated', {
        fieldId,
        value,
        userId,
        timestamp: new Date(),
        version: newVersion
      });
    } catch (error) {
      console.error('Error updating form:', error);
      socket.emit('error', { message: 'Failed to update form' });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
    const userInfo = userSocketMap.get(socket.id);
    if (userInfo) {
      const { userId, formId } = userInfo;
      if (activeFormParticipants.has(formId)) {
        const participants = activeFormParticipants.get(formId);
        const newParticipants = new Set(Array.from(participants).filter(p => p.socketId !== socket.id));
        activeFormParticipants.set(formId, newParticipants);

        // Broadcast updated participants to all in the room
        io.to(formId).emit('activeParticipants', Array.from(newParticipants));
      }
      userSocketMap.delete(socket.id);
    }
  });
});

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 