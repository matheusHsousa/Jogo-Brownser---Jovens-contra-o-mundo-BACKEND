const express = require("express");
const http = require("http");
const socketIO = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static("public"));

const rooms = {};
let meuArray = [];
let frasesEnviadas = 0;

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function updateUsersList(roomCode) {}

io.on("connection", (socket) => {
  console.log("Novo usuário conectado");

  socket.on("createRoom", ({ username, icon }) => {
    const roomCode = generateRoomCode();

    if (!rooms[roomCode]) {
      socket.join(roomCode);
      rooms[roomCode] = { users: {} };
      rooms[roomCode].users[socket.id] = { username, icon };

      console.log(`Usuário ${username} entrou na sala ${roomCode}`);
      console.log(`Sala criada: ${roomCode}`);
      socket.emit("roomCreated", { roomCode });

      io.to(roomCode).emit("updateUsersList", {
        users: rooms[roomCode].users,
        usersCount: Object.keys(rooms[roomCode].users).length,
      });

      updateUsersList(roomCode);
    } else {
      if (Object.keys(rooms[roomCode].users).length >= 8) {
        socket.emit("roomFull");
      } else {
        socket.join(roomCode);
        rooms[roomCode].users[socket.id] = { username, icon };

        console.log(`Usuário ${username} entrou na sala ${roomCode}`);
        socket.emit("roomCreated", { roomCode });

        io.to(roomCode).emit("updateUsersList", {
          users: rooms[roomCode].users,
          usersCount: Object.keys(rooms[roomCode].users).length,
        });

        updateUsersList(roomCode);
      }
    }
  });

  socket.on("joinRoom", ({ roomCode, username, icon }) => {
    if (rooms[roomCode]) {
      socket.join(roomCode);
      rooms[roomCode].users[socket.id] = { username, icon };

      const usersCount = Object.keys(rooms[roomCode].users).length;

      console.log(`Usuário ${username} entrou na sala ${roomCode}`);

      io.to(roomCode).emit("userJoined", { username, icon });
      socket.emit("roomCreated", { roomCode });
      io.to(roomCode).emit("updateUsersList", {
        users: rooms[roomCode].users,
        usersCount: Object.keys(rooms[roomCode].users).length,
        usersCount,
      });
    } else {
      socket.emit("invalidRoomCode");
    }
  });

  socket.on("disconnect", () => {
    console.log("Usuário desconectado");

    for (const roomCode in rooms) {
      if (rooms[roomCode].users[socket.id]) {
        delete rooms[roomCode].users[socket.id];
        io.to(roomCode).emit("updateUsersList", {
          users: rooms[roomCode].users,
          usersCount: Object.keys(rooms[roomCode].users).length,
        });
        io.to(roomCode).emit("userLeft", { userId: socket.id });
        break;
      }
    }
  });

  socket.on("leaveRoom", () => {
    for (const roomCode in rooms) {
      if (rooms[roomCode].users[socket.id]) {
        delete rooms[roomCode].users[socket.id];
        io.to(roomCode).emit("updateUsersList", {
          users: rooms[roomCode].users,
          usersCount: Object.keys(rooms[roomCode].users).length,
        });
        io.to(roomCode).emit("userLeft", { userId: socket.id });
        break;
      }
    }
  });

  socket.on("initGame", () => {
    const roomCode = getRoomCode(socket.id);

    if (roomCode && rooms[roomCode]) {
      const usersCount = Object.keys(rooms[roomCode].users).length;

      const shuffledFrases = frasesAleatorias.sort(() => Math.random() - 0.5);
      const fraseAleatoriaPreta =
        frasesAleatoriasPretas[
          Math.floor(Math.random() * frasesAleatoriasPretas.length)
        ];

      let userFrasesIndex = 0;

      for (const userId in rooms[roomCode].users) {
        const userFrases = shuffledFrases.slice(
          userFrasesIndex,
          userFrasesIndex + 5
        );

        userFrasesIndex += 5;

        usersFrases[userId] = userFrases;

        io.to(userId).emit("receiveFrases", {
          userFrases,
          fraseAleatoriaPreta,
          usersCount,
        });
      }
    }
  });

  let frasesJogadores = {};
  let meuArray = [];
  
  socket.on("enviarFrase", ({ fraseUnicaElement, frase, jogador, usersCount, roomCode }) => {
    frasesEnviadas++;
  
    if (!frasesJogadores[roomCode]) {
      frasesJogadores[roomCode] = [];
    }
  
    frasesJogadores[roomCode].push({ frase, jogador, fraseUnicaElement });
  
    const frases = { frase, jogador, fraseUnicaElement };
    meuArray.push(frases);
  
    console.log(meuArray);
  
    if (frasesEnviadas === usersCount) {
      console.log("Todas as frases foram enviadas com sucesso!");
      frasesEnviadas = 0;
  
      io.to(roomCode).emit("frasesCompletas", {
        frases: meuArray,
        mensagem: "Todas as frases foram enviadas com sucesso!",
      });
  
      frasesJogadores[roomCode] = [];
    }
  });
})  

function getRoomCode(socketId) {
  for (const roomCode in rooms) {
    if (rooms[roomCode].users[socketId]) {
      return roomCode;
    }
  }
  return null;
}

const frasesAleatorias = [
  "O sol brilha no céu azul.",
  "A chuva cai suavemente lá fora.",
  "Cada dia é uma nova oportunidade.",
  "As estrelas iluminam a noite escura.",
  "A natureza é cheia de beleza.",
  "O riso é a melhor medicina.",
  "A música alimenta a alma.",
  "A amizade é um tesouro precioso.",
  "O tempo voa quando estamos felizes.",
  "A paciência é uma virtude.",
  "A esperança é a última que morre.",
  "A simplicidade é a chave da elegância.",
  "A vida é feita de escolhas.",
  "A gratidão transforma o que temos em suficiente.",
  "O amor é a força que nos impulsiona.",
  "A criatividade é a inteligência se divertindo.",
  "A gentileza gera gentileza.",
  "O conhecimento é poder.",
  "A perseverança supera a velocidade.",
  "A verdade liberta.",
  "A beleza está nos olhos de quem vê.",
  "A fé move montanhas.",
  "A vida é uma jornada, não um destino.",
  "A educação é a chave para o futuro.",
  "O silêncio é uma fonte de grande força.",
  "A honestidade é a melhor política.",
  "A família é nosso porto seguro.",
  "A felicidade está nas pequenas coisas.",
  "A saúde é riqueza.",
  "O perdão é a chave da liberdade.",
  "A resiliência nos torna mais fortes.",
  "A mudança é a única constante.",
  "A solidariedade une corações.",
  "A alegria está no caminho, não no destino.",
  "A comunicação é a base de todo relacionamento.",
  "O otimismo é a fé em ação.",
  "A autenticidade atrai boas energias.",
  "A tolerância constrói pontes.",
  "A coragem enfrenta o desconhecido.",
  "A imaginação é a chave da inovação.",
  "A gentileza é a linguagem do coração.",
  "A natureza fala, mas é preciso saber ouvir.",
  "A curiosidade impulsiona a descoberta.",
  "A gratidão é o antídoto para a insatisfação.",
  "A amizade verdadeira é um tesouro eterno.",
  "A empatia conecta almas.",
  "A modéstia é a verdadeira grandeza.",
  "A diversidade enriquece a vida.",
  "A simplicidade torna a vida mais leve.",
  "A sabedoria vem com a experiência.",
];

const frasesAleatoriasPretas = [
  "O sol brilha no céu azul.",
  "A chuva cai suavemente lá fora.",
  "Cada dia é uma nova oportunidade.",
  "As estrelas iluminam a noite escura.",
  "A natureza é cheia de beleza.",
  "O riso é a melhor medicina.",
  "A música alimenta a alma.",
  "A amizade é um tesouro precioso.",
  "O tempo voa quando estamos felizes.",
  "A paciência é uma virtude.",
  "A esperança é a última que morre.",
  "A simplicidade é a chave da elegância.",
  "A vida é feita de escolhas.",
  "A gratidão transforma o que temos em suficiente.",
  "O amor é a força que nos impulsiona.",
  "A criatividade é a inteligência se divertindo.",
  "A gentileza gera gentileza.",
  "O conhecimento é poder.",
  "A perseverança supera a velocidade.",
  "A verdade liberta.",
  "A beleza está nos olhos de quem vê.",
  "A fé move montanhas.",
  "A vida é uma jornada, não um destino.",
  "A educação é a chave para o futuro.",
  "O silêncio é uma fonte de grande força.",
  "A honestidade é a melhor política.",
  "A família é nosso porto seguro.",
  "A felicidade está nas pequenas coisas.",
  "A saúde é riqueza.",
  "O perdão é a chave da liberdade.",
  "A resiliência nos torna mais fortes.",
  "A mudança é a única constante.",
  "A solidariedade une corações.",
  "A alegria está no caminho, não no destino.",
  "A comunicação é a base de todo relacionamento.",
  "O otimismo é a fé em ação.",
  "A autenticidade atrai boas energias.",
  "A tolerância constrói pontes.",
  "A coragem enfrenta o desconhecido.",
  "A imaginação é a chave da inovação.",
  "A gentileza é a linguagem do coração.",
  "A natureza fala, mas é preciso saber ouvir.",
  "A curiosidade impulsiona a descoberta.",
  "A gratidão é o antídoto para a insatisfação.",
  "A amizade verdadeira é um tesouro eterno.",
  "A empatia conecta almas.",
  "A modéstia é a verdadeira grandeza.",
  "A diversidade enriquece a vida.",
  "A simplicidade torna a vida mais leve.",
  "A sabedoria vem com a experiência.",
];

const usersFrases = {};

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor ouvindo na porta ${PORT}`);
});
