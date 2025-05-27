const firebaseConfig = {
  apiKey: "AIzaSyBClDBA7f9-jfF6Nz6Ia-YlZ6G-hx3oerY",
  authDomain: "lepanapp.firebaseapp.com",
  databaseURL: "https://lepanapp-default-rtdb.firebaseio.com",
  projectId: "lepanapp"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let eventos = [];
let clientes = {};
let mediasPorCliente = {};

function carregarClientes() {
  db.ref('clientes').once('value').then(snapshot => {
    clientes = {};
    snapshot.forEach(child => {
      clientes[child.key] = child.val().nome;
    });
    carregarEventos();
  });
}

function carregarEventos() {
  db.ref('eventos').once('value').then(snapshot => {
    eventos = [];
    const clientesSet = new Set();

    snapshot.forEach(child => {
      const evento = child.val();
      evento.id = child.key;
      eventos.push(evento);
      if (evento.clienteId) {
        clientesSet.add(evento.clienteId);
      }
    });

    const select = document.getElementById('clienteFiltro');
    select.innerHTML = '';
    clientesSet.forEach(clienteId => {
      const opt = document.createElement('option');
      opt.value = clienteId;
      opt.textContent = clientes[clienteId] || clienteId;
      select.appendChild(opt);
    });

    filtrarRelatorio();
  });
}

function filtrarRelatorio() {
  const dataInicio = document.getElementById('dataInicio').value;
  const dataFim = document.getElementById('dataFim').value;
  const clienteFiltro = Array.from(document.getElementById('clienteFiltro').selectedOptions).map(opt => opt.value);
  const statusFiltro = document.getElementById('statusFiltro').value;

  const agrupado = {};
  const clientesSelecionados = new Set();

  mediasPorCliente = {};

  eventos.forEach(evento => {
    if (statusFiltro && evento.status !== statusFiltro) return;
    if (dataInicio && evento.data < dataInicio) return;
    if (dataFim && evento.data > dataFim) return;
    if (clienteFiltro.length && !clienteFiltro.includes(evento.clienteId)) return;
    if (!evento.valorPDV) return;

    clientesSelecionados.add(evento.clienteId);

    const clienteNome = clientes[evento.clienteId] || evento.clienteId;
    const valorPDV = parseFloat(evento.valorPDV) || 0;

    if (!agrupado[clienteNome]) agrupado[clienteNome] = { total: 0, count: 0 };
    agrupado[clienteNome].total += valorPDV;
    agrupado[clienteNome].count += 1;

    if (!mediasPorCliente[evento.clienteId]) mediasPorCliente[evento.clienteId] = { total: 0, count: 0 };
    mediasPorCliente[evento.clienteId].total += valorPDV;
    mediasPorCliente[evento.clienteId].count += 1;
  });

  renderizarTabela(agrupado, Array.from(clientesSelecionados).sort());
}

function renderizarTabela(agrupado, clientesSelecionados) {
  const thead = document.getElementById('theadRelatorio');
  const tbody = document.getElementById('tbodyRelatorio');

  thead.innerHTML = '';
  tbody.innerHTML = '';

  let header = '<tr><th>Cliente</th><th>Média Venda PDV</th></tr>';
  thead.innerHTML = header;

  clientesSelecionados.forEach(clienteId => {
    const clienteNome = clientes[clienteId] || clienteId;
    const data = agrupado[clienteNome];
    const media = data ? (data.total / data.count).toFixed(2) : '-';
    let row = `<tr><td>${clienteNome}</td><td>${media}</td></tr>`;
    tbody.innerHTML += row;
  });
}

function exportarExcel() {
  const tabela = document.getElementById('tabelaRelatorio');
  const wb = XLSX.utils.table_to_book(tabela, { sheet: "Relatório" });
  XLSX.writeFile(wb, 'media_venda_cliente.xlsx');
}

function atualizarFirebase() {
  const updates = {};

  Object.keys(mediasPorCliente).forEach(clienteId => {
    const mediaObj = mediasPorCliente[clienteId];
    const media = (mediaObj.total / mediaObj.count).toFixed(1);
    updates[`media_cliente/${clienteId}`] = parseFloat(media);
  });

  db.ref().update(updates).then(() => {
    alert("Médias salvas com sucesso no Firebase!");
  });
}

document.addEventListener('DOMContentLoaded', carregarClientes);
