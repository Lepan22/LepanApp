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

let eventos = [];

function carregarEventos() {
  db.ref('eventos').once('value').then(snapshot => {
    eventos = [];
    snapshot.forEach(child => {
      const evento = child.val();
      evento.id = child.key;
      eventos.push(evento);
    });

    eventos.sort((a, b) => {
      if (!a.data) return 1;
      if (!b.data) return -1;
      return b.data.localeCompare(a.data);
    });

    aplicarFiltros();
    calcularKPIs();
  });
}

function aplicarFiltros() {
  const status = document.getElementById('filtroStatus').value;
  const nomeFiltro = document.getElementById('filtroNome').value.toLowerCase();
  const dataInicio = document.getElementById('filtroDataInicio').value;
  const dataFim = document.getElementById('filtroDataFim').value;

  const tabela = document.getElementById('tabelaEventos');
  tabela.innerHTML = '';

  const eventosFiltrados = eventos.filter(e => {
    if (status !== 'Todos' && e.status !== status) return false;
    if (nomeFiltro && !(e.nomeEvento || '').toLowerCase().includes(nomeFiltro)) return false;
    if (dataInicio && (!e.data || e.data < dataInicio)) return false;
    if (dataFim && (!e.data || e.data > dataFim)) return false;
    return true;
  });

  eventosFiltrados.forEach(eAtual => {
    const eventosAnteriores = eventos.filter(e => 
      e.nomeEvento === eAtual.nomeEvento && 
      e.data && eAtual.data && e.data < eAtual.data
    );

    const somaVenda = eventosAnteriores.reduce((s, ev) => s + (parseFloat(ev.vendaPDV) || 0), 0);
    const quantidade = eventosAnteriores.length;
    const mediaVenda = quantidade > 0 ? somaVenda / quantidade : 0;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${eAtual.nomeEvento || '-'}</td>
      <td>${eAtual.data || '-'}</td>
      <td>${eAtual.status || '-'}</td>
      <td>R$ ${mediaVenda.toFixed(2)}</td>
      <td>R$ ${(eAtual.estimativaVenda || 0).toFixed(2)}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary" onclick="editarEvento('${eAtual.id}')">Editar</button>
        <button class="btn btn-sm btn-outline-secondary" onclick="duplicarEvento('${eAtual.id}')">Duplicar</button>
        <button class="btn btn-sm btn-outline-success" onclick="enviarLink('${eAtual.id}')">Enviar Link</button>
        <button class="btn btn-sm btn-outline-danger" onclick="excluirEvento('${eAtual.id}')">Excluir</button>
      </td>
    `;
    tabela.appendChild(row);
  });

  calcularKPIEstimativaFiltrada(eventosFiltrados);
}

function calcularKPIs() {
  const hoje = new Date();
  const semanaInicio = new Date(hoje);
  semanaInicio.setDate(hoje.getDate() - hoje.getDay());

  const mesInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  let kpiSemana = 0, kpiMes = 0, kpiVendasMes = 0;

  eventos.forEach(e => {
    const dataEvento = new Date(e.data);
    if (e.data && dataEvento >= semanaInicio) kpiSemana++;
    if (e.data && dataEvento >= mesInicio) {
      kpiMes++;
      kpiVendasMes += parseFloat(e.vendaPDV || 0);
    }
  });

  document.getElementById('kpiSemana').innerText = kpiSemana;
  document.getElementById('kpiMes').innerText = kpiMes;
  document.getElementById('kpiVendasMes').innerText = kpiVendasMes.toFixed(2);
}

function calcularKPIEstimativaFiltrada(eventosFiltrados) {
  const totalEstimativa = eventosFiltrados.reduce((s, e) => s + (parseFloat(e.estimativaVenda) || 0), 0);
  document.getElementById('kpiEstimativa').innerText = totalEstimativa.toFixed(2);
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
  delete novoEvento.vendaPDV;
  novoEvento.status = "Aberto";
  delete novoEvento.data;

  const novoId = db.ref('eventos').push().key;
  db.ref('eventos/' + novoId).set(novoEvento).then(() => {
    alert('Evento duplicado com sucesso!');
    carregarEventos();
  });
}

function enviarLink(id) {
  const url = `${window.location.origin}/LepanApp/form.html?id=${id}`;
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
  document.getElementById('filtroStatus').value = 'Todos';
  carregarEventos();
});
