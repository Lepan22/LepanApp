// planejamento_evento.js

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SUA_AUTH_DOMAIN",
  databaseURL: "https://lepanapp-default-rtdb.firebaseio.com",
  projectId: "lepanapp",
  storageBucket: "SUA_STORAGE_BUCKET",
  messagingSenderId: "SUA_SENDER_ID",
  appId: "SUA_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

function obterInicioEFimDaSemana() {
  const hoje = new Date();
  const diaSemana = hoje.getDay();
  const diferencaSegunda = hoje.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1);
  const segunda = new Date(hoje.setDate(diferencaSegunda));
  segunda.setHours(0, 0, 0, 0);
  const domingo = new Date(segunda);
  domingo.setDate(segunda.getDate() + 6);
  domingo.setHours(23, 59, 59, 999);
  return { segunda, domingo };
}

function formatarDataBR(dataStr) {
  const data = new Date(dataStr);
  if (isNaN(data)) return "Data inválida";
  return data.toLocaleDateString("pt-BR", { weekday: 'short', day: '2-digit', month: '2-digit' });
}

async function carregarEquipe() {
  const snap = await db.ref("equipe").once("value");
  const equipeData = snap.val() || {};
  const mapaEquipe = {};
  for (const [id, dados] of Object.entries(equipeData)) {
    mapaEquipe[id] = dados.nomeCompleto || "Sem nome";
  }
  return mapaEquipe;
}

async function carregarEventosSemana() {
  const { segunda, domingo } = obterInicioEFimDaSemana();
  const snap = await db.ref("eventos").once("value");
  const eventos = snap.val() || {};
  const equipeMap = await carregarEquipe();
  const lista = [];

  for (const [id, evento] of Object.entries(eventos)) {
    const data = evento.data;
    const dataObj = new Date(data);
    if (dataObj >= segunda && dataObj <= domingo) {
      const equipe = (evento.equipe || []).map(e => equipeMap[e.membroId] || "Desconhecido");
      lista.push({
        nomeEvento: evento.nomeEvento || "Sem nome",
        data,
        equipe: equipe.join(", ")
      });
    }
  }

  lista.sort((a, b) => new Date(a.data) - new Date(b.data));
  exibirEventos(lista);
}

function exibirEventos(lista) {
  const container = document.getElementById("listaEventos");
  container.innerHTML = "";

  if (lista.length === 0) {
    container.innerHTML = "<p>Nenhum evento encontrado nesta semana.</p>";
    return;
  }

  lista.forEach(evento => {
    const div = document.createElement("div");
    div.className = "evento";
    div.innerHTML = `
      <h2>${formatarDataBR(evento.data)} - ${evento.nomeEvento}</h2>
      <p><strong>Equipe:</strong> ${evento.equipe || "Nenhuma equipe alocada"}</p>
    `;
    container.appendChild(div);
  });
}

// Inicializar
window.addEventListener("DOMContentLoaded", carregarEventosSemana);
