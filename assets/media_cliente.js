const firebaseConfig = {
  apiKey: "AIzaSyBClDBA7f9-jfF6Nz6Ia-YlZ6G-hx3oerY",
  authDomain: "lepanapp.firebaseapp.com",
  databaseURL: "https://lepanapp-default-rtdb.firebaseio.com",
  projectId: "lepanapp"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let clientes = {};
let eventos = [];
let mediasPorCliente = {};

function carregarClientes() {
  db.ref('clientes').once('value').then(snapshot => {
    clientes = {};
    snapshot.forEach(child => {
      const val = child.val();
      const clienteAtivo = val.clienteAtivo;
      if (clienteAtivo && clienteAtivo.status === 'Ativo') {  // ✅ Ajustado aqui!
        clientes[child.key] = {
          nome: val.nome || 'Sem Nome',
          id: child.key,
          nomeEvento: clienteAtivo.nomeEvento || ''
        };
      }
    });
    carregarEventos();
  }).catch(err => {
    console.error('Erro ao carregar clientes:', err);
    alert('Erro ao carregar clientes. Veja o console.');
  });
}

function carregarEventos() {
  db.ref('eventos').once('value').then(snapshot => {
    eventos = [];
    snapshot.forEach(child => {
      const evento = child.val();
      evento.id = child.key;
      eventos.push(evento);
    });
    preencherFiltroClientes();
    filtrarRelatorio();
  }).catch(err => {
    console.error('Erro ao carregar eventos:', err);
    alert('Erro ao carregar eventos. Veja o console.');
  });
}

function preencherFiltroClientes() {
  const select = document.getElementById('clienteFiltro');
  select.innerHTML = '';

  if (Object.keys(clientes).length === 0) {
    const opt = document.createElement('option');
    opt.textContent = 'Nenhum cliente ativo encontrado';
    opt.disabled = true;
    select.appendChild(opt);
    return;
  }

  Object.values(clientes).forEach(cliente => {
    const opt = document.createElement('option');
    opt.value = cliente.id;
    opt.textContent = cliente.nome;
    select.appendChild(opt);
  });
}

function filtrarRelatorio() {
  const dataInicio = document.getElementById('dataInicio').value;
  const dataFim = document.getElementById('dataFim').value;
  const clienteFiltro = Array.from(document.getElementById('clienteFiltro').selectedOptions).map(opt => opt.value);
  const statusFiltro = document.getElementById('statusFiltro').value;

  mediasPorCliente = {};
  const tabelaDados = [];

  Object.keys(clientes).forEach(clienteId => {
    if (clienteFiltro.length && !clienteFiltro.includes(clienteId)) return;

    const cliente = clientes[clienteId];
    let totalPDV = 0;
    let totalEventos = 0;

    eventos.forEach(evento => {
      if (evento.nomeEvento === cliente.nomeEvento) {  // ✅ Baseado no nome do evento
        if (statusFiltro && evento.status !== statusFiltro) return;
        if (dataInicio && evento.data < dataInicio) return;
        if (dataFim && evento.data > dataFim) return;
        const valorPDV = parseFloat(evento.vendaPDV) || 0;
        totalPDV += valorPDV;
        totalEventos += 1;
      }
    });

    let media = '-';
    if (totalEventos > 0) {
      media = (totalPDV / totalEventos).toFixed(2);
      mediasPorCliente[clienteId] = parseFloat(media);
    }

    tabelaDados.push({
      nome: cliente.nome,
      id: clienteId,
      media: media
    });
  });

  renderizarTabela(tabelaDados);
}

function renderizarTabela(dados) {
  const thead = document.getElementById('theadRelatorio');
  const tbody = document.getElementById('tbodyRelatorio');

  thead.innerHTML = '';
  tbody.innerHTML = '';

  let header = '<tr><th>Cliente</th><th>Média Venda PDV</th></tr>';
  thead.innerHTML = header;

  if (dados.length === 0) {
    tbody.innerHTML = '<tr><td colspan="2">Nenhum dado encontrado.</td></tr>';
    return;
  }

  dados.forEach(item => {
    let row = `<tr><td>${item.nome}</td><td>${item.media}</td></tr>`;
    tbody.innerHTML += row;
  });
}

function exportarExcel() {
  const tabela = document.getElementById('tabelaRelatorio');
  const wb = XLSX.utils.table_to_book(tabela, { sheet: "Relatório" });
  XLSX.writeFile(wb, 'media_venda_cliente.xlsx');
}

function atualizarFirebase() {
  if (Object.keys(mediasPorCliente).length === 0) {
    alert('Nenhuma média calculada para salvar!');
    return;
  }

  const updates = {};

  Object.keys(mediasPorCliente).forEach(clienteId => {
    updates[`media_cliente/${clienteId}`] = mediasPorCliente[clienteId];
  });

  db.ref().update(updates).then(() => {
    alert("Médias salvas com sucesso no Firebase!");
  }).catch(err => {
    console.error('Erro ao salvar médias:', err);
    alert('Erro ao salvar no Firebase. Veja o console.');
  });
}

document.addEventListener('DOMContentLoaded', carregarClientes);
