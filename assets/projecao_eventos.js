// Arquivo: assets/projecao_eventos.js

const firebaseConfig = {
  apiKey: "AIzaSyBClDBA7f9-jfF6Nz6Ia-YlZ6G-hx3oerY",
  authDomain: "lepanapp.firebaseapp.com",
  databaseURL: "https://lepanapp-default-rtdb.firebaseio.com",
  projectId: "lepanapp",
  storageBucket: "lepanapp.appspot.com",
  messagingSenderId: "542989944344",
  appId: "1:542989944344:web:576e28199960fd5440a56d"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let clientes = [];
let eventosReais = [];
let indisponibilidades = [];
let eventosProjetados = [];

function normalizeDate(dateStr) {
  return new Date(dateStr).toISOString().split('T')[0];
}

function formatDateBR(dateStr) {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year.slice(2)}`;
}

function reforcarValidacaoIndisponibilidade(dataStr) {
  const dataNorm = normalizeDate(dataStr);
  return indisponibilidades.some(i => {
    if (i.data) return normalizeDate(i.data) === dataNorm;
    if (i.inicio && i.fim) return dataNorm >= normalizeDate(i.inicio) && dataNorm <= normalizeDate(i.fim);
    return false;
  });
}

function carregarDados() {
  const ano = document.getElementById('anoSelect').value;
  const mes = document.getElementById('mesSelect').value;

  clientes = [];
  eventosReais = [];
  indisponibilidades = [];
  eventosProjetados = [];

  Promise.all([
    db.ref('clientes').once('value'),
    db.ref('eventos').once('value'),
    db.ref('configuracao/diasIndisponiveis').once('value')
  ]).then(([clientesSnap, eventosSnap, indisSnap]) => {

    clientesSnap.forEach(c => {
      const cli = c.val();
      cli.id = c.key;
      if (cli.status === "Fechado" && cli.clienteAtivo && cli.clienteAtivo.statusEvento === "Ativo") {
        clientes.push(cli);
      }
    });

    eventosSnap.forEach(e => eventosReais.push(e.val()));

    indisSnap.forEach(i => indisponibilidades.push(i.val()));

    gerarProjecoes(ano, mes);
  });
}

function gerarProjecoes(ano, mes) {
  const dataInicio = new Date(`${ano}-${mes}-01`);
  const dataFim = new Date(dataInicio);
  dataFim.setMonth(dataFim.getMonth() + 1);

  clientes.forEach(cliente => {
    const ativo = cliente.clienteAtivo;
    const nomeEvento = ativo.nomeEvento || "Evento";
    const frequencia = ativo.frequencia;
    const diasSemana = ativo.diasSemana || [];

    let datas = [];

    if (frequencia === "Semanal") {
      diasSemana.forEach(dia => {
        for (let dt = new Date(dataInicio); dt < dataFim; dt.setDate(dt.getDate() + 1)) {
          if (diaSemanaTexto(dt.getDay()) === dia) {
            datas.push(new Date(dt));
          }
        }
      });
    } else if (frequencia === "Quinzenal") {
      for (let dt = new Date(dataInicio); dt < dataFim; dt.setDate(dt.getDate() + 14)) {
        datas.push(new Date(dt));
      }
    } else if (frequencia === "Mensal") {
      let primeiroDia = new Date(dataInicio);
      while (primeiroDia.getDay() !== 1) primeiroDia.setDate(primeiroDia.getDate() + 1);
      datas.push(primeiroDia);
    }

    datas.forEach(data => {
      const dataStr = normalizeDate(data);
      if (existeEventoReal(nomeEvento, dataStr) || reforcarValidacaoIndisponibilidade(dataStr)) return;

      eventosProjetados.push({
        nomeEvento,
        data: dataStr,
        frequencia,
        status: "Projetado"
      });
    });
  });

  exibirProjetados();
}

function diaSemanaTexto(num) {
  const dias = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
  return dias[num];
}

function existeEventoReal(nome, data) {
  return eventosReais.some(e => e.nomeEvento === nome && normalizeDate(e.data) === data);
}

function exibirProjetados() {
  const tbody = document.getElementById('tabelaProjetados');
  tbody.innerHTML = '';

  eventosProjetados.sort((a, b) => new Date(a.data) - new Date(b.data));

  eventosProjetados.forEach((ev, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${ev.nomeEvento}</td>
      <td contenteditable="true" onblur="editarData(${index}, this.innerText)">${formatDateBR(ev.data)}</td>
      <td>${ev.frequencia}</td>
      <td>
        ${ev.status} <button class='btn btn-sm btn-danger' onclick='excluirEvento(${index})'>Excluir</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function editarData(index, novaData) {
  const partes = novaData.split('/');
  const novaISO = `20${partes[2]}-${partes[1]}-${partes[0]}`;
  eventosProjetados[index].data = novaISO;
  exibirProjetados();
}

function excluirEvento(index) {
  eventosProjetados.splice(index, 1);
  exibirProjetados();
}

function incluirEvento() {
  const nomeEvento = prompt('Nome do Evento:');
  const data = prompt('Data (dd/mm/aa):');
  const partes = data.split('/');
  const isoData = `20${partes[2]}-${partes[1]}-${partes[0]}`;
  const frequencia = prompt('Frequência:');

  eventosProjetados.push({
    nomeEvento,
    data: isoData,
    frequencia,
    status: 'Projetado'
  });

  exibirProjetados();
}

function atualizarProjecao() {
  if (!confirm('Tem certeza que deseja atualizar a projeção dos eventos para este mês? Isso irá sobrescrever a projeção atual.')) return;

  const ano = document.getElementById('anoSelect').value;
  const mes = document.getElementById('mesSelect').value;
  const anoMes = `${ano}_${mes}`;

  db.ref(`projecao_eventos/${anoMes}`).remove().then(() => {
    const updates = {};

    eventosProjetados.forEach((ev, index) => {
      const id = `${ev.nomeEvento.replace(/\s/g, '_')}_${index}`;
      updates[id] = {
        nomeEvento: ev.nomeEvento,
        data: ev.data,
        frequencia: ev.frequencia,
        status: "Projetado"
      };
    });

    db.ref(`projecao_eventos/${anoMes}`).update(updates).then(() => {
      alert('Projeção atualizada com sucesso!');
    }).catch(error => {
      console.error('Erro ao salvar projeção:', error);
    });
  }).catch(error => {
    console.error('Erro ao deletar projeção antiga:', error);
  });
}

document.getElementById('carregarBtn').addEventListener('click', carregarDados);
document.getElementById('incluirBtn').addEventListener('click', incluirEvento);
document.getElementById('atualizarBtn').addEventListener('click', atualizarProjecao);
document.addEventListener('DOMContentLoaded', carregarDados);
