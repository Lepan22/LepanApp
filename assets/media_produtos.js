const firebaseConfig = {
  apiKey: "AIzaSyBClDBA7f9-jfF6Nz6Ia-YlZ6G-hx3oerY",
  authDomain: "lepanapp.firebaseapp.com",
  databaseURL: "https://lepanapp-default-rtdb.firebaseio.com",
  projectId: "lepanapp"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let eventos = [];
let produtos = {};

function carregarProdutos() {
  db.ref('produtos').once('value').then(snapshot => {
    produtos = {};
    snapshot.forEach(child => {
      produtos[child.key] = child.val().nome;
    });
    carregarEventos();
  });
}

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

  const agrupado = {};
  const eventosNomes = new Set();

  eventos.forEach(evento => {
    if (statusFiltro && evento.status !== statusFiltro) return;
    if (dataInicio && evento.data < dataInicio) return;
    if (dataFim && evento.data > dataFim) return;
    if (nomeFiltro.length && !nomeFiltro.includes(evento.nomeEvento)) return;

    if (!evento.produtos) return;

    eventosNomes.add(evento.nomeEvento);

    evento.produtos.forEach(produto => {
      const nomeProduto = produtos[produto.produtoId] || produto.produtoId;

      if (!agrupado[nomeProduto]) agrupado[nomeProduto] = {};
      if (!agrupado[nomeProduto][evento.nomeEvento]) agrupado[nomeProduto][evento.nomeEvento] = { total: 0, count: 0 };

      const consumido = produto.quantidade - (produto.congelado || 0) - (produto.assado || 0) - (produto.perda || 0);
      agrupado[nomeProduto][evento.nomeEvento].total += consumido;
      agrupado[nomeProduto][evento.nomeEvento].count += 1;
    });
  });

  renderizarTabela(agrupado, Array.from(eventosNomes).sort());
}

function renderizarTabela(agrupado, eventosNomes) {
  const thead = document.getElementById('theadRelatorio');
  const tbody = document.getElementById('tbodyRelatorio');

  thead.innerHTML = '';
  tbody.innerHTML = '';

  // Cabeçalho
  let header = '<tr><th>Nome do Produto</th>';
  eventosNomes.forEach(evt => {
    header += `<th>${evt}</th>`;
  });
  header += '</tr>';
  thead.innerHTML = header;

  // Linhas
  Object.keys(agrupado).forEach(produto => {
    let row = `<tr><td>${produto}</td>`;
    eventosNomes.forEach(evt => {
      const data = agrupado[produto][evt];
      const media = data ? (data.total / data.count).toFixed(2) : '0.00';
      row += `<td>${media}</td>`;
    });
    row += '</tr>';
    tbody.innerHTML += row;
  });
}

function exportarExcel() {
  const tabela = document.getElementById('tabelaRelatorio');
  const wb = XLSX.utils.table_to_book(tabela, { sheet: "Relatório" });
  XLSX.writeFile(wb, 'media_consumo_evento.xlsx');
}

document.addEventListener('DOMContentLoaded', carregarProdutos);
