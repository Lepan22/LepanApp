const firebaseConfig = {
  apiKey: "AIzaSyBClDBA7f9-jfF6Nz6Ia-YlZ6G-hx3oerY",
  authDomain: "lepanapp.firebaseapp.com",
  databaseURL: "https://lepanapp-default-rtdb.firebaseio.com",
  projectId: "lepanapp"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let eventos = [];

function carregarEventos() {
  db.ref('eventos').once('value').then(snapshot => {
    eventos = [];
    const nomesEventos = new Set();

    snapshot.forEach(child => {
      const evento = child.val();
      evento.id = child.key;
      eventos.push(evento);
      if (evento.nomeEvento) {
        nomesEventos.add(evento.nomeEvento);
      }
    });

    const select = document.getElementById('nomeEventoFiltro');
    select.innerHTML = '';
    nomesEventos.forEach(nome => {
      const opt = document.createElement('option');
      opt.value = nome;
      opt.textContent = nome;
      select.appendChild(opt);
    });

    filtrarRelatorio();
  });
}

function filtrarRelatorio() {
  const dataInicio = document.getElementById('dataInicio').value;
  const dataFim = document.getElementById('dataFim').value;
  const nomeFiltro = Array.from(document.getElementById('nomeEventoFiltro').selectedOptions).map(opt => opt.value);
  const statusFiltro = document.getElementById('statusFiltro').value;

  const produtosAgrupados = {};

  eventos.forEach(evento => {
    if (statusFiltro && evento.status !== statusFiltro) return;
    if (dataInicio && evento.data < dataInicio) return;
    if (dataFim && evento.data > dataFim) return;
    if (nomeFiltro.length && !nomeFiltro.includes(evento.nomeEvento)) return;

    if (evento.status !== "Fechado") return; // Considera só Fechado para média

    evento.produtos?.forEach(produto => {
      const chave = `${produto.produtoId}_${evento.nomeEvento}`;
      if (!produtosAgrupados[chave]) {
        produtosAgrupados[chave] = {
          nomeProduto: produto.produtoId,
          nomeEvento: evento.nomeEvento,
          total: 0,
          count: 0
        };
      }

      const consumido = produto.quantidade - (produto.congelado || 0) - (produto.assado || 0) - (produto.perda || 0);
      produtosAgrupados[chave].total += consumido;
      produtosAgrupados[chave].count += 1;
    });
  });

  renderizarTabela(produtosAgrupados);
}

function renderizarTabela(produtosAgrupados) {
  const tbody = document.getElementById('tabelaRelatorio');
  tbody.innerHTML = '';

  Object.values(produtosAgrupados).forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.nomeProduto}</td>
      <td>${item.nomeEvento}</td>
      <td>${(item.total / item.count).toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function exportarExcel() {
  const tabela = document.querySelector('table');
  const wb = XLSX.utils.table_to_book(tabela, {sheet:"Relatório"});
  XLSX.writeFile(wb, 'media_consumo_evento.xlsx');
}

document.addEventListener('DOMContentLoaded', carregarEventos);
