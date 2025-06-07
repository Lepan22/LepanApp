const firebaseConfig = {
  apiKey: "AIzaSyBClDBA7f9-jfF6Nz6Ia-YlZ6G-hx3oerY",
  authDomain: "lepanapp.firebaseapp.com",
  databaseURL: "https://lepanapp-default-rtdb.firebaseio.com",
  projectId: "lepanapp"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let eventos = [];

function formatDateBR(dateStr) {
  const [year, month, day] = dateStr.split('-');
  return new Date(`${year}-${month}-${day}T00:00:00`);
}

function formatCurrency(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

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
        <button class="btn btn-sm btn-outline-info" onclick="visualizarEvento('${eAtual.id}')">Visualizar</button>
        <button class="btn btn-sm btn-outline-danger" onclick="excluirEvento('${eAtual.id}')">Excluir</button>
      </td>
    `;
    tabela.appendChild(row);
  });
}

function calcularKPIs() {
  const hoje = new Date();
  const semanaInicio = new Date(hoje);
  semanaInicio.setDate(semanaInicio.getDate() - semanaInicio.getDay() + 1);
  const semanaFim = new Date(semanaInicio);
  semanaFim.setDate(semanaFim.getDate() + 7);

  let estimado = 0, realizado = 0, semana = 0;
  let estimativaMes = 0, vendaMes = 0, estimativaSemana = 0, lucroMes = 0;

  const eventosRef = db.ref('eventos');
  const projRef = db.ref(`projecao_eventos/${hoje.getFullYear()}_${String(hoje.getMonth() + 1).padStart(2, '0')}`);

  Promise.all([
    projRef.once('value'),
    eventosRef.once('value')
  ]).then(([projSnap, eventosSnap]) => {
    if (projSnap.exists()) estimado = Object.keys(projSnap.val()).length;

    const lista = eventosSnap.val();
    if (lista) {
      Object.values(lista).forEach(e => {
        if (!e.data) return;
        const dataEvento = formatDateBR(e.data);
        const status = (e.status || '').toLowerCase();

        const dentroDoMes = dataEvento.getFullYear() === hoje.getFullYear() &&
                            dataEvento.getMonth() === hoje.getMonth();

        const dentroDaSemana = dataEvento >= semanaInicio && dataEvento <= semanaFim;

        const vendaPDV = Number(e.vendaPDV || 0);
        const cmvReal = Number(e.cmvReal || 0);
        const custoEquipe = (e.equipe || []).reduce((s, i) => s + (Number(i.valor) || 0), 0);
        const custoLogistica = (e.logistica || []).reduce((s, i) => s + (Number(i.valor) || 0), 0);
        const lucroCalculado = vendaPDV - cmvReal - custoEquipe - custoLogistica;

        if (dentroDoMes && (status === 'fechado' || status === 'finalizado')) {
          realizado++;
          vendaMes += vendaPDV;
          lucroMes += lucroCalculado;
        }

        if (dentroDoMes) {
          estimativaMes += Number(e.estimativaVenda || 0);
        }

        if (dentroDaSemana) {
          estimativaSemana += Number(e.estimativaVenda || 0);
          semana++;
        }
      });
    }

    document.getElementById('kpi-estimado').innerText = estimado;
    document.getElementById('kpi-realizado').innerText = realizado;
    document.getElementById('kpi-semana').innerText = semana;
    document.getElementById('kpi-estimativa-mes').innerText = formatCurrency(estimativaMes);
    document.getElementById('kpi-venda-mes').innerText = formatCurrency(vendaMes);
    document.getElementById('kpi-estimativa-semana').innerText = formatCurrency(estimativaSemana);
    document.getElementById('kpi-lucro-mes').innerText = formatCurrency(lucroMes);
  });
}

function editarEvento(id) {
  window.location.href = `GestaoEvento.html?id=${id}`;
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

function visualizarEvento(id) {
  window.location.href = `visualizar_evento.html?id=${id}`;
}

function excluirEvento(id) {
  if (confirm('Tem certeza que deseja excluir este evento?')) {
    db.ref('eventos/' + id).remove().then(() => {
      alert('Evento excluído com sucesso!');
      carregarEventos();
    });
  }
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
