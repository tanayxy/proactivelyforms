const socketIO = require('socket.io');

class WebSocketService {
  initialize(server) {
    this.io = socketIO(server);

    this.io.on('connection', (socket) => {
      console.log('Client connected');

      // Join form room for real-time updates
      socket.on('joinForm', (formId) => {
        socket.join(`form-${formId}`);
        console.log(`Client joined form room: form-${formId}`);
      });

      // Leave form room
      socket.on('leaveForm', (formId) => {
        socket.leave(`form-${formId}`);
        console.log(`Client left form room: form-${formId}`);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected');
      });
    });

    return this.io;
  }

  // Method to emit form submission updates
  emitFormSubmission(formId, submission) {
    this.io.to(`form-${formId}`).emit('formSubmission', submission);
  }

  // Method to emit form field updates
  emitFormFieldUpdate(formId, fieldUpdate) {
    this.io.to(`form-${formId}`).emit('formFieldUpdate', fieldUpdate);
  }
}

module.exports = new WebSocketService(); 