const firebaseConfig = {
  apiKey: "AIzaSyBClDBA7f9-jfF6Nz6Ia-YlZ6G-hx3oerY",
  authDomain: "lepanapp.firebaseapp.com",
  databaseURL: "https://lepanapp-default-rtdb.firebaseio.com",
  projectId: "lepanapp"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const now = new Date();
const currentMonthPath = `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}`;

const getMonday = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

const monday = getMonday(new Date());
const weekStart = new Date(monday);
const weekEnd = new Date(monday);
weekEnd.setDate(weekEnd.getDate() + 6);

function formatDateBR(dateStr) {
  const [year, month, day] = dateStr.split('-');
  return new Date(`${year}-${month}-${day}T00:00:00`);
}

function formatCurrency(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function carregarKPIs() {
  let estimado = 0, realizado = 0, semana = 0;
  let estimativaMes = 0, vendaMes = 0, estimativaSemana = 0, lucroMes = 0;

  const projEventosRef = db.ref('projecao_eventos/' + currentMonthPath);
  const previsaoRef = db.ref('previsao_receita/' + currentMonthPath + '/total');
  const eventosRef = db.ref('eventos');

  projEventosRef.once('value').then(projSnap => {
    if (projSnap.exists()) estimado = Object.keys(projSnap.val()).length;

    return previsaoRef.once('value');
  }).then(previsaoSnap => {
    estimativaMes = previsaoSnap.val() || 0;

    return eventosRef.once('value');
  }).then(eventosSnap => {
    const eventos = eventosSnap.val();

    if (eventos) {
      Object.values(eventos).forEach(evento => {
        if (!evento.data) return;
        const dataEvento = formatDateBR(evento.data);
        const status = (evento.status || '').toLowerCase();

        const dentroDoMes = dataEvento.getFullYear() === now.getFullYear() &&
                            dataEvento.getMonth() === now.getMonth();

        const dentroDaSemana = dataEvento >= weekStart && dataEvento <= weekEnd;

        const vendaPDV = Number(evento.vendaPDV || 0);
        const cmvReal = Number(evento.cmvReal || 0);
        const custoEquipe = (evento.equipe || []).reduce((s, e) => s + (Number(e.valor) || 0), 0);
        const custoLogistica = (evento.logistica || []).reduce((s, l) => s + (Number(l.valor) || 0), 0);
        const lucroCalculado = vendaPDV - cmvReal - custoLogistica - custoEquipe;

        if (dentroDoMes && (status === "fechado" || status === "finalizado")) {
          realizado++;
          vendaMes += vendaPDV;
          lucroMes += lucroCalculado;
        }

        if (dentroDaSemana) {
          estimativaSemana += Number(evento.estimativaVenda || 0);
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

function carregarEventos() {
  db.ref('eventos').once('value').then(snapshot => {
    const eventos = snapshot.val();
    if (!eventos) return;

    const tabela = document.getElementById('tabelaEventos');
    tabela.innerHTML = '';

    Object.entries(eventos).forEach(([id, evento]) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${evento.nomeEvento || ''}</td>
        <td>${evento.data || ''}</td>
        <td>${evento.status || ''}</td>
        <td>R$ ${(evento.mediaVenda || 0).toFixed(2)}</td>
        <td>R$ ${(evento.estimativaVenda || 0).toFixed(2)}</td>
        <td>
          <button onclick="editarEvento('${id}')">Editar</button>
          <button onclick="duplicarEvento('${id}')">Duplicar</button>
          <button onclick="enviarLink('${id}')">Enviar Link</button>
          <button onclick="visualizarEvento('${id}')">Visualizar</button>
          <button onclick="excluirEvento('${id}')">Excluir</button>
        </td>
      `;
      tabela.appendChild(tr);
    });
  });
}

function aplicarFiltros(e) {
  e.preventDefault();
  // Filtros permanecem inalterados
}

function limparFiltros() {
  document.getElementById('filtroStatus').value = 'Todos';
  document.getElementById('filtroNome').value = '';
  document.getElementById('filtroDataInicio').value = '';
  document.getElementById('filtroDataFim').value = '';
  carregarEventos();
}

document.getElementById('filtrosForm').addEventListener('submit', aplicarFiltros);

carregarKPIs();
carregarEventos();
