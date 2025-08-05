// planejamento_evento.js

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
      const equipeAlocada = (evento.equipe || []).map(e => e.membroId);
      lista.push({
        id,
        nomeEvento: evento.nomeEvento || "Sem nome",
        data,
        equipeSelecionada: equipeAlocada,
        equipeMap
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

  lista.forEach((evento, index) => {
    const div = document.createElement("div");
    div.className = "evento";

    const titulo = document.createElement("h2");
    titulo.textContent = `${formatarDataBR(evento.data)} - ${evento.nomeEvento}`;
    div.appendChild(titulo);

    const label = document.createElement("label");
    label.textContent = "Equipe:";
    div.appendChild(label);

    const select = document.createElement("select");
    select.setAttribute("multiple", true);
    select.id = `selectEquipe_${index}`;
    select.dataset.eventoId = evento.id;

    for (const [id, nome] of Object.entries(evento.equipeMap)) {
      const option = document.createElement("option");
      option.value = id;
      option.textContent = nome;
      if (evento.equipeSelecionada.includes(id)) {
        option.setAttribute("selected", "selected");
      }
      select.appendChild(option);
    }

    div.appendChild(select);
    container.appendChild(div);

    // Inicializar Choices.js após garantir que os selected estão no DOM
    setTimeout(() => {
      new Choices(select, {
        removeItemButton: true,
        placeholder: true,
        placeholderValue: 'Selecione membros...',
        searchEnabled: true,
        shouldSort: false
      });
    }, 0);
  });
}

// Inicializar ao carregar a página
window.addEventListener("DOMContentLoaded", carregarEventosSemana);
