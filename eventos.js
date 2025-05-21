const firebaseConfig = {
  apiKey: "AIzaSyBClDBA7f9-jfF6Nz6Ia-YlZ6G-hx3oerY",
  authDomain: "lepanapp.firebaseapp.com",
  databaseURL: "https://lepanapp-default-rtdb.firebaseio.com",
  projectId: "lepanapp",
  storageBucket: "lepanapp.firebasestorage.app",
  messagingSenderId: "542989944344",
  appId: "1:542989944344:web:576e28199960fd5440a56d"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let eventos = [];

function carregarEventos() {
  db.ref('eventos').once('value').then(snapshot => {
    eventos = [];
    snapshot.forEach(child => {
      const evento = child.val();
      evento.id = child.key;
      eventos.push(evento);
    });
    aplicarFiltros();
    calcularKPIs();
  });
}

function aplicarFiltros() {
  const status = document.getElementById('filtroStatus').value;
  const nome = document.getElementById('filtroNome').value.toLowerCase();
  const dataInicio = document.getElementById('filtroDataInicio').value;
  const dataFim = document.getElementById('filtroDataFim').value;

  const tabela = document.getElementById('tabelaEventos');
  tabela.innerHTML = '';

  eventos.filter(e => {
    if (status !== 'Todos' && e.status !== status) return false;
    if (nome && !(e.nomeEvento || '').toLowerCase().includes(nome)) return false;
    if (dataInicio && (!e.data || e.data < dataInicio)) return false;
    if (dataFim && (!e.data || e.data > dataFim)) return false;
    return true;
  }).forEach(e => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${e.nomeEvento || '-'}</td>
      <td>${e.data || '-'}</td>
      <td>${e.status || '-'}</td>
      <td>R$ ${(e.vendaPDV || 0).toFixed(2)}</td>
      <td>R$ ${(e.estimativaVenda || 0).toFixed(2)}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary" onclick="editarEvento('${e.id}')">Editar</button>
        <button class="btn btn-sm btn-outline-secondary" onclick="duplicarEvento('${e.id}')">Duplicar</button>
        <button class="btn btn-sm btn-outline-success" onclick="enviarLink('${e.id}')">Enviar Link</button>
        <button class="btn btn-sm btn-outline-danger" onclick="excluirEvento('${e.id}')">Excluir</button>
      </td>
    `;
    tabela.appendChild(row);
  });
}

function calcularKPIs() {
  const hoje = new Date();
  const semanaInicio = new Date(hoje);
  semanaInicio.setDate(hoje.getDate() - hoje.getDay());

  const mesInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  let kpiSemana = 0, kpiMes = 0, kpiEstimativa = 0, kpiVendasMes = 0;

  eventos.forEach(e => {
    const dataEvento = new Date(e.data);
    if (e.data && dataEvento >= semanaInicio) kpiSemana++;
    if (e.data && dataEvento >= mesInicio) {
      kpiMes++;
      kpiVendasMes += parseFloat(e.vendaPDV || 0);
    }
    kpiEstimativa += parseFloat(e.estimativaVenda || 0);
  });

  document.getElementById('kpiSemana').innerText = kpiSemana;
  document.getElementById('kpiMes').innerText = kpiMes;
  document.getElementById('kpiEstimativa').innerText = kpiEstimativa.toFixed(2);
  document.getElementById('kpiVendasMes').innerText = kpiVendasMes.toFixed(2);
}

function duplicarEvento(id) {
  const evento = eventos.find(e => e.id === id);
  if (!evento) return;

  const novoEvento = { ...evento };
  novoEvento.produtos = (evento.produtos || []).map(p => ({
    produtoId: p.produtoId,
    quantidade: p.quantidade,
    congelado: 0,
    assado: 0,
    perda: 0
  }));

  delete novoEvento.id;

  const novoId = db.ref('eventos').push().key;
  db.ref('eventos/' + novoId).set(novoEvento).then(() => {
    alert('Evento duplicado com sucesso!');
    carregarEventos();
  });
}

function enviarLink(id) {
  const url = `${window.location.origin}/GestaoEvento.html?id=${id}`;
  navigator.clipboard.writeText(url).then(() => {
    alert('Link copiado para a área de transferência!');
  });
}

function excluirEvento(id) {
  if (confirm('Tem certeza que deseja excluir este evento?')) {
    db.ref('eventos/' + id).remove().then(() => {
      alert('Evento excluído com sucesso!');
      carregarEventos();
    });
  }
}

function editarEvento(id) {
  window.location.href = `GestaoEvento.html?id=${id}`;
}

function limparFiltros() {
  document.getElementById('filtroStatus').value = 'Todos';
  document.getElementById('filtroNome').value = '';
  document.getElementById('filtroDataInicio').value = '';
  document.getElementById('filtroDataFim').value = '';
  aplicarFiltros();
}

document.getElementById('filtrosForm').addEventListener('submit', function(e) {
  e.preventDefault();
  aplicarFiltros();
});

document.addEventListener("DOMContentLoaded", () => {
  carregarEventos();
});
