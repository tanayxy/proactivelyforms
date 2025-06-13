import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

export const initializeSocket = (token) => {
  return io(SOCKET_URL, {
    autoConnect: false,
    auth: {
      token: token
    }
  });
};

export const socket = io(SOCKET_URL, { autoConnect: false }); 