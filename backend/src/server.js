require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

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

  socket.on('joinForm', (formId) => {
    socket.join(formId);
    console.log(`Client joined form: ${formId}`);
  });

  socket.on('formUpdate', async (data) => {
    const { formId, fieldId, value, userId } = data;
    
    try {
      // Update the database
      await pool.query(
        'UPDATE form_responses SET field_values = field_values || $1::jsonb WHERE form_id = $2',
        [{ [fieldId]: value }, formId]
      );

      // Broadcast the update to all clients in the form room
      io.to(formId).emit('formUpdated', {
        fieldId,
        value,
        userId,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error updating form:', error);
      socket.emit('error', { message: 'Failed to update form' });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 