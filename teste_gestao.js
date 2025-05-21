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

let equipeAlocada = [];
let logisticaAlocada = [];
let listaProdutos = [];

function carregarEventoExistente() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) return;

  db.ref('eventos/' + id).once('value').then(snapshot => {
    const evento = snapshot.val();
    if (!evento) return;

    document.getElementById('nomeEvento').value = evento.nomeEvento || '';
    document.getElementById('data').value = evento.data || '';
    document.getElementById('responsavel').value = evento.responsavel || '';
    document.getElementById('status').value = evento.status || '';
    document.getElementById('vendaPDV').value = evento.vendaPDV || '';
    document.getElementById('cmvReal').value = evento.cmvReal || '';
    document.getElementById('estimativaVenda').value = evento.estimativaVenda || '';

    equipeAlocada = evento.equipe || [];
    logisticaAlocada = evento.logistica || [];
    listaProdutos = evento.produtos || [];

    renderizarEquipe();
    renderizarLogistica();
    renderizarProdutos();
    calcularTotais();
  });
}

function renderizarEquipe() {
  const container = document.getElementById('equipeContainer');
  container.innerHTML = '';
  equipeAlocada.forEach(item => {
    const div = document.createElement('div');
    div.textContent = `Membro: ${item.membroId}, Valor: ${item.valor}`;
    container.appendChild(div);
  });
}

function renderizarLogistica() {
  const container = document.getElementById('logisticaContainer');
  container.innerHTML = '';
  logisticaAlocada.forEach(item => {
    const div = document.createElement('div');
    div.textContent = `Prestador: ${item.prestadorId}, Valor: ${item.valor}`;
    container.appendChild(div);
  });
}

function renderizarProdutos() {
  const tabela = document.getElementById('tabelaProdutos');
  tabela.innerHTML = '';
  listaProdutos.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.produtoId}</td>
      <td>${item.quantidade}</td>
      <td>${item.congelado}</td>
      <td>${item.assado}</td>
      <td>${item.perda}</td>
    `;
    tabela.appendChild(row);
  });
}

function calcularTotais() {
  const custoEquipe = equipeAlocada.reduce((s, e) => s + (e.valor || 0), 0);
  const custoLogistica = logisticaAlocada.reduce((s, l) => s + (l.valor || 0), 0);
  document.getElementById('custoEquipe').innerText = custoEquipe.toFixed(2);
  document.getElementById('custoLogistica').innerText = custoLogistica.toFixed(2);
}

document.addEventListener('DOMContentLoaded', carregarEventoExistente);
