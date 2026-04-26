const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST"]
  }
});

const users = new Map();

io.on('connection', (socket) => {
  console.log('a user connected:', socket.id);

  socket.on('join', (userData) => {
    users.set(socket.id, { ...userData, id: socket.id });
    io.emit('users', Array.from(users.values()));
    console.log('User joined:', userData.name);
  });

  socket.on('call-user', (data) => {
    socket.to(data.to).emit('call-made', {
      offer: data.offer,
      socket: socket.id,
      user: data.user
    });
  });

  socket.on('make-answer', (data) => {
    socket.to(data.to).emit('answer-made', {
      socket: socket.id,
      answer: data.answer
    });
  });

  socket.on('ice-candidate', (data) => {
    socket.to(data.to).emit('ice-candidate', {
      candidate: data.candidate,
      from: socket.id
    });
  });

  socket.on('reject-call', (data) => {
    socket.to(data.from).emit('call-rejected', {
      socket: socket.id
    });
  });

  socket.on('end-call', (data) => {
    socket.to(data.to).emit('call-ended');
  });

  // Messages are now handled via Firestore in the frontend.
  // We keep the socket for presence and signaling.

  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      console.log('user disconnected:', user.name);
      users.delete(socket.id);
      io.emit('users', Array.from(users.values()));
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
