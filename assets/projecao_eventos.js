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
      const dataStr = data.toISOString().split('T')[0];
      if (existeEventoReal(nomeEvento, dataStr) || indisponivel(dataStr)) return;

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
  return eventosReais.some(e => e.nomeEvento === nome && e.data === data);
}

function indisponivel(data) {
  return indisponibilidades.some(i => {
    if (i.data) return i.data === data;
    if (i.inicio && i.fim) return data >= i.inicio && data <= i.fim;
    return false;
  });
}

function exibirProjetados() {
  const tbody = document.getElementById('tabelaProjetados');
  tbody.innerHTML = '';

  eventosProjetados.forEach(ev => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${ev.nomeEvento}</td><td>${ev.data}</td><td>${ev.frequencia}</td><td>${ev.status}</td>`;
    tbody.appendChild(tr);
  });
}

document.getElementById('carregarBtn').addEventListener('click', carregarDados);

document.addEventListener('DOMContentLoaded', carregarDados);
