// Configuração Firebase
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SUA_AUTH_DOMAIN",
  databaseURL: "SUA_DATABASE_URL",
  projectId: "SUA_PROJECT_ID",
  storageBucket: "SUA_STORAGE_BUCKET",
  messagingSenderId: "SUA_MESSAGING_SENDER_ID",
  appId: "SUA_APP_ID"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let produtos = {};
let eventos = [];

async function carregarDados() {
  const snapshot = await db.ref('eventos').once('value');
  const eventosData = snapshot.val();
  eventos = [];

  for (let id in eventosData) {
    const evento = eventosData[id];
    evento.id = id;
    eventos.push(evento);
  }

  const prodSnapshot = await db.ref('produtos').once('value');
  produtos = prodSnapshot.val();

  popularFiltroEventos();
  gerarRelatorio();
}

function popularFiltroEventos() {
  const select = document.getElementById('nomeEventoFiltro');
  const nomes = new Set();

  eventos.forEach(ev => {
    if (ev.nomeEvento) nomes.add(ev.nomeEvento);
  });

  nomes.forEach(nome => {
    const opt = document.createElement('option');
    opt.value = nome;
    opt.textContent = nome;
    select.appendChild(opt);
  });
}

function filtrarRelatorio() {
  gerarRelatorio();
}

function gerarRelatorio() {
  const dataInicio = document.getElementById('dataInicio').value;
  const dataFim = document.getElementById('dataFim').value;
  const nomeFiltro = Array.from(document.getElementById('nomeEventoFiltro').selectedOptions).map(opt => opt.value);
  const statusFiltro = document.getElementById('statusFiltro').value;

  const relatorio = {};

  eventos.forEach(ev => {
    const dataEv = ev.data;
    const status = ev.status || '';
    const nomeEv = ev.nomeEvento || '';

    if (dataInicio && dataEv < dataInicio) return;
    if (dataFim && dataEv > dataFim) return;
    if (statusFiltro && status !== statusFiltro) return;
    if (nomeFiltro.length > 0 && !nomeFiltro.includes(nomeEv)) return;

    if (!ev.produtos || !Array.isArray(ev.produtos)) return;

    ev.produtos.forEach(prod => {
      const pid = prod.produtoId;
      if (!pid) return;

      const enviado = parseFloat(prod.quantidade) || 0;
      const congelado = parseFloat(prod.congelado) || 0;
      const assado = parseFloat(prod.assado) || 0;
      const perda = parseFloat(prod.perda) || 0;

      const vendido = enviado - (congelado + assado + perda);

      if (!relatorio[pid]) {
        relatorio[pid] = { nome: produtos[pid]?.nome || pid, eventos: [] };
      }

      // Só considerar se o produto foi levado
      if (enviado > 0) {
        relatorio[pid].eventos.push({
          data: dataEv,
          nomeEvento: nomeEv,
          vendido: vendido < 0 ? 0 : vendido
        });
      }
    });
  });

  exibirTabela(relatorio);
}

function exibirTabela(relatorio) {
  const thead = document.getElementById('theadRelatorio');
  const tbody = document.getElementById('tbodyRelatorio');

  thead.innerHTML = '';
  tbody.innerHTML = '';

  const datasUnicas = new Set();
  for (let pid in relatorio) {
    relatorio[pid].eventos.forEach(e => {
      datasUnicas.add(`${e.nomeEvento} - ${e.data}`);
    });
  }

  const datasArray = Array.from(datasUnicas).sort();

  // Cabeçalho
  const trHead = document.createElement('tr');
  trHead.innerHTML = `<th>Produto</th>`;
  datasArray.forEach(dt => {
    const th = document.createElement('th');
    th.textContent = dt;
    trHead.appendChild(th);
  });
  trHead.innerHTML += `<th>Média</th>`;
  thead.appendChild(trHead);

  for (let pid in relatorio) {
    const linha = document.createElement('tr');
    const prod = relatorio[pid];
    linha.innerHTML = `<td>${prod.nome}</td>`;

    let soma = 0;
    let contagem = 0;

    datasArray.forEach(dt => {
      const evento = prod.eventos.find(e => `${e.nomeEvento} - ${e.data}` === dt);
      const td = document.createElement('td');

      if (evento) {
        td.textContent = evento.vendido.toFixed(1);
        soma += evento.vendido;
        contagem++;
      } else {
        td.textContent = '-';
      }
      linha.appendChild(td);
    });

    const media = contagem > 0 ? (soma / contagem).toFixed(2) : '-';
    linha.innerHTML += `<td>${media}</td>`;
    tbody.appendChild(linha);
  }
}

function exportarExcel() {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.table_to_sheet(document.getElementById('tabelaRelatorio'));
  XLSX.utils.book_append_sheet(wb, ws, "Relatório");
  XLSX.writeFile(wb, "relatorio_media.xlsx");
}

function atualizarFirebase() {
  alert("Atualização no Firebase implementada conforme regras internas.");
}

carregarDados();
