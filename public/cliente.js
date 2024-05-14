const socket = io();
const iconesDisponiveis = [
  "bicho",
  "indio",
  "buda",
  "fantom",
  "pika",
  "fro",
  "virus",
  "ogro",
];

let iconeSelecionado =
  iconesDisponiveis[Math.floor(Math.random() * iconesDisponiveis.length)];
document.getElementById(
  "iconeSelecionado"
).innerHTML = `<img class="perfil" src="./img/${iconeSelecionado}.png" alt="Ícone Selecionado" />`;

let codigoSala;
let donoSala;
let jogadoresEnviaramFrase = 0;
let todasFrases = [];

function criarSala() {
  const nomeUsuarioInput = document.getElementById("nomeUsuario");
  const nomeUsuario = nomeUsuarioInput.value.trim();

  if (!nomeUsuario) {
    alert("Por favor, insira um nome de usuário.");
    return;
  }

  socket.emit("createRoom", { username: nomeUsuario, icon: iconeSelecionado });
}

function gerarLinkSala() {
  const nomeUsuario = gerarNomePadrao();
  const codigoSalaParam = new URLSearchParams(window.location.search).get(
    "code"
  );
  const link =
    window.location.origin +
    `/?code=${codigoSalaParam}&username=${nomeUsuario}`;
  return link;
}

document.addEventListener("DOMContentLoaded", function () {
  const nomeUsuarioInput = document.getElementById("nomeUsuario");
  const codigoSalaInput = document.getElementById("codigoEntrada");

  const codigoSalaParam = new URLSearchParams(window.location.search).get(
    "code"
  );

  if (codigoSalaParam) {
    nomeUsuarioInput.value = gerarNomePadrao();
    codigoSalaInput.value = codigoSalaParam;
  } else {
    nomeUsuarioInput.value = gerarNomePadrao();
  }
});

function gerarNomePadrao() {
  return "user" + Math.floor(Math.random() * 1000);
}

function entrarComCodigo() {
  const nomeUsuarioInput = document.getElementById("nomeUsuario");
  const nomeUsuario = nomeUsuarioInput.value.trim();
  const codigoSala = document.getElementById("codigoEntrada").value.trim();

  if (!nomeUsuario) {
    alert("Por favor, insira um nome de usuário.");
    return;
  }

  socket.emit("joinRoom", {
    roomCode: codigoSala,
    username: nomeUsuario,
    icon: iconeSelecionado,
  });
}

socket.on("roomCreated", (data) => {
  const codigoSalaElement = document.getElementById("codigoSala");
  codigoSala = data.roomCode;

  document.getElementById("big-lobby").style.display = "none";
  document.getElementById("entradaPagina").style.display = "none";
  document.getElementById("sala").style.display = "block";

  codigoSalaElement.textContent = codigoSala;

  const linkSalaElement = document.getElementById("linkSala");
  linkSalaElement.innerHTML = `<a href="${gerarLinkSala()}" target="_blank">${gerarLinkSala()}</a>`;

  socket.in("updateUsersList");

  socket.emit("getUsersList");
});

socket.on("connect", () => {
  console.log("Conectado ao servidor");
});

socket.on("updateUsersList", ({ users, usersCount }) => {
  console.log(
    `Lista de usuários atualizada: ${JSON.stringify(
      users
    )} e o contador: ${usersCount}`
  );

  const userId = Object.keys(users);
  donoSala = userId[0];

  console.log(donoSala);
  const isDono = donoSala === socket.id;

  const initGameButton = document.getElementById("initGame");
  initGameButton.style.display = isDono ? "block" : "none";

  document.getElementById("contadorPresentes").textContent = usersCount;

  const listaUsuariosElement = document.getElementById("listaUsuarios");
  listaUsuariosElement.innerHTML = "";

  for (const userId in users) {
    const user = users[userId];
    const userElement = document.createElement("div");
    userElement.id = userId;
    userElement.classList.add("usuario");
    userElement.innerHTML = `<div id="usersLogados"><img class="perfil-sala" src="./img/${user.icon}.png" alt="${user.username}" /> <p>${user.username}</p></div>`;
    listaUsuariosElement.appendChild(userElement);
  }
});

socket.on("userLeft", ({ userId }) => {
  const userElement = document.getElementById(userId);
  if (userElement) {
    userElement.remove();
  }
});

socket.on("connect", () => {
  socket.emit("getUsersList");
});

socket.on("disconnect", () => {
  console.log("Desconectado do servidor");
});

function selecionarIcone(icone) {
  iconeSelecionado = icone;

  const iconeSelecionadoElement = document.getElementById("iconeSelecionado");
  iconeSelecionadoElement.innerHTML = `<img class="perfil" src="./img/${icone}.png" alt="Ícone Selecionado" />`;
}

document.getElementById("botaoCopiar").addEventListener("click", function () {
  const codigoSalaElement = document.getElementById("codigoSala");
  const urlAtual = window.location.href;
  const ultimaBarraIndex = urlAtual.lastIndexOf("/");
  const parteAnterior = urlAtual.substring(0, ultimaBarraIndex);

  const link = `${parteAnterior}/?code=${codigoSalaElement.textContent}`;

  const tempInput = document.createElement("textarea");
  tempInput.value = link;

  document.body.appendChild(tempInput);
  tempInput.select();

  document.execCommand("copy");

  document.body.removeChild(tempInput);

  alert("Link da sala copiado para a área de transferência!");
});

function sairDaSala() {
  document.getElementById("big-lobby").style.display = "block";
  document.getElementById("entradaPagina").style.display = "block";
  document.getElementById("sala").style.display = "none";

  socket.emit("leaveRoom");
}

function initGame() {
  socket.emit("initGame", iconeSelecionado);
}

socket.on("receiveFrases", ({ userFrases, fraseAleatoriaPreta }) => {
  document.getElementById("sala-actions").style.display = "none";

  console.log("Frases recebidas:", userFrases);

  const listaUsuariosElement = document.getElementById("listaUsuarios");

  const jogoElement = document.getElementById("jogo");
  jogoElement.innerHTML = "";

  let ultimoBotaoExibirFrase = null;

  userFrases.forEach((frase) => {
    const cartinhaElement = document.createElement("div");
    cartinhaElement.classList.add("cartinha");

    const fraseElement = document.createElement("p");
    fraseElement.textContent = `${frase}`;

    const botaoExibirFrase = document.createElement("button");
    botaoExibirFrase.textContent = "Enviar Frase";
    botaoExibirFrase.style.display = "none";

    cartinhaElement.addEventListener("click", () => {
      if (ultimoBotaoExibirFrase) {
        ultimoBotaoExibirFrase.style.display = "none";
      }

      botaoExibirFrase.style.display = "block";
      ultimoBotaoExibirFrase = botaoExibirFrase;
    });

    botaoExibirFrase.addEventListener("click", () => {
      const roomCode = document.getElementById("codigoSala").textContent;
      const usersCount = parseInt(
        document.getElementById("contadorPresentes").textContent,
        10
      );

      const fraseUnicaElement =
        document.getElementById("fraseUnica").textContent;
      console.log(fraseUnicaElement);
      socket.emit("enviarFrase", {
        fraseUnicaElement,
        frase,
        jogador: socket.id,
        usersCount,
        roomCode,
      });

      botaoExibirFrase.disabled = true;
    });

    cartinhaElement.appendChild(fraseElement);
    cartinhaElement.appendChild(botaoExibirFrase);

    jogoElement.appendChild(cartinhaElement);
  });

  jogoElement.style.display = "flex";

  const fraseUnicaElement = document.getElementById("fraseUnica");
  fraseUnicaElement.innerHTML = `<div class="cartinha preta">${fraseAleatoriaPreta}</div>`;
});

socket.on("frasesCompletas", ({ frases }) => {
  const jogoElement = document.getElementById("jogo");
  jogoElement.innerHTML = "";

  const uniqueFraseUnicaElement = frases[0].fraseUnicaElement;

  for (let i = 0; i < frases.length; i++) {
    const fraseObj = frases[i];

    const cartinhaElement = document.createElement("div");
    cartinhaElement.classList.add("cartinha");

    const fraseElement = document.createElement("p");
    fraseElement.textContent = `${fraseObj.frase}`;

    const buttonCard = document.createElement("button")
    buttonCard.textContent = 'clica'
    buttonCard.addEventListener("click", () => passarValores(fraseObj));

    console.log(fraseObj)

    cartinhaElement.appendChild(fraseElement);
    cartinhaElement.appendChild(buttonCard);

    jogoElement.appendChild(cartinhaElement);
  }

  const fraseUnicaElement = document.getElementById("fraseUnica");
  fraseUnicaElement.innerHTML = `<div class="cartinha preta">${uniqueFraseUnicaElement}</div>`;

  jogoElement.style.display = "flex";
});

function passarValores(fraseObj) {
  console.log("Valores a serem passados:", fraseObj);
}
