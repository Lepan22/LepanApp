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
  if (!dateStr) return new Date('1970-01-01T00:00:00');
  const [year, month, day] = (dateStr || '').split('-');
  return new Date(`${year}-${month}-${day}T00:00:00`);
}

function formatCurrency(v) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Formata número com 2 casas, sem "R$"
function formatNumberBR(v){
  return Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Converte texto "1.234,56" ou "R$ 1.234,56" em Number
function parseMoney(str){
  if (str == null) return 0;
  const s = String(str)
    .replace(/[^\d,.\-]/g, '')  // remove tudo menos dígitos, vírgula, ponto e sinal
    .replace(/\./g, '')         // remove separadores de milhar
    .replace(',', '.');         // vírgula vira decimal
  const n = parseFloat(s);
  return isNaN(n) ? 0 : Math.round(n * 100) / 100;
}

// === Percentual CMV cache (usado só para outras partes da tela, não para KPI) ===
let __cachePercentualCMV = null;

async function obterPercentualCMVAtual() {
  if (__cachePercentualCMV !== null) return __cachePercentualCMV;
  try {
    const snap = await db.ref('configuracao/percentualCMV').once('value');
    const v = Number(snap.val());
    __cachePercentualCMV = (!isNaN(v) && v > 0) ? v : 44; // fallback seguro
  } catch (e) {
    __cachePercentualCMV = 44;
  }
  return __cachePercentualCMV;
}

function carregarEventos() {
  db.ref('eventos').once('value').then(snapshot => {
    eventos = [];
    snapshot.forEach(child => {
      const evento = child.val() || {};
      evento.id = child.key;
      eventos.push(evento);
    });

    eventos.sort((a, b) => {
      if (!a.data) return 1;
      if (!b.data) return -1;
      return b.data.localeCompare(a.data);
    });

    aplicarFiltros();
  });
}

function aplicarFiltros() {
  const nome = (document.getElementById('filtroNome')?.value || '').trim().toLowerCase();
  const dataInicio = document.getElementById('filtroDataInicio')?.value;
  const dataFim = document.getElementById('filtroDataFim')?.value;
  const status = (document.getElementById('filtroStatus')?.value || 'Todos').toLowerCase();

  const eventosFiltrados = eventos.filter(e => {
    if (!e || !e.data) return false;

    const atendeNome = nome ? (String(e.nomeEvento || '').toLowerCase().includes(nome)) : true;

    const atendeData = (() => {
      if (!dataInicio && !dataFim) return true;
      const d = formatDateBR(e.data);
      if (dataInicio && d < formatDateBR(dataInicio)) return false;
      if (dataFim && d > formatDateBR(dataFim)) return false;
      return true;
    })();

    const atendeStatus = status === 'todos' ? true : ((e.status || '').toLowerCase() === status);

    return atendeNome && atendeData && atendeStatus;
  });

  // O id "tabelaEventos" está no <tbody>
  const tbody = document.getElementById('tabelaEventos');
  if (tbody) tbody.innerHTML = '';

  eventosFiltrados.forEach(eAtual => {
    // Média de venda (3 últimos eventos anteriores do mesmo nome)
    const eventosAnteriores = eventos
      .filter(e =>
        e.nomeEvento === eAtual.nomeEvento &&
        e.data && eAtual.data &&
        e.data < eAtual.data &&
        e.vendaPDV
      )
      .sort((a, b) => b.data.localeCompare(a.data))
      .slice(0, 3);

    const somaVenda = eventosAnteriores.reduce((s, ev) => s + (parseFloat(ev.vendaPDV) || 0), 0);
    const quantidade = eventosAnteriores.length;
    const mediaVenda = quantidade > 0 ? somaVenda / quantidade : 0;

    const vendaPDVNum = Number(eAtual.vendaPDV || 0);
    const estimativaNum = Number(eAtual.estimativaVenda || 0);

    const corOk = vendaPDVNum > estimativaNum;
    const corStyle = corOk ? 'color:#1b7f1b;font-weight:700' : 'color:#c62828;font-weight:700';

    // Select de status EDITÁVEL (salva imediatamente no Firebase)
    const statusAtual = eAtual.status || 'Aberto';
    const selectStatus = `
      <select class="status-select" data-id="${eAtual.id}">
        <option value="Aberto"${statusAtual === 'Aberto' ? ' selected' : ''}>Aberto</option>
        <option value="Finalizado"${statusAtual === 'Finalizado' ? ' selected' : ''}>Finalizado</option>
        <option value="Fechado"${statusAtual === 'Fechado' ? ' selected' : ''}>Fechado</option>
      </select>
    `;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${eAtual.nomeEvento || '-'}</td>
      <td>${eAtual.data || '-'}</td>
      <td>${selectStatus}</td>
      <td>${formatCurrency(mediaVenda)}</td>
      <td>
        <input type="text"
               class="money-input inp-estimativa"
               data-id="${eAtual.id}"
               data-field="estimativaVenda"
               value="${formatNumberBR(estimativaNum)}" />
      </td>
      <td>
        <input type="text"
               class="money-input inp-pdv"
               data-id="${eAtual.id}"
               data-field="vendaPDV"
               style="${corStyle}"
               value="${formatNumberBR(vendaPDVNum)}" />
      </td>
      <td class="acoes">
        <button class="btn btn-sm btn-outline" data-acao="ver" data-id="${eAtual.id}">Ver</button>
        <button class="btn btn-sm btn-outline" data-acao="excluir" data-id="${eAtual.id}">Excluir</button>
      </td>
    `;
    if (tbody) tbody.appendChild(row);
  });

  // Status editável
  document.querySelectorAll('.status-select').forEach(sel=>{
    sel.addEventListener('change', async (ev)=>{
      const id = ev.target.getAttribute('data-id');
      const novoStatus = ev.target.value;
      ev.target.disabled = true;
      try{
        await db.ref('eventos/' + id + '/status').set(novoStatus);
        const idx = eventos.findIndex(e => e.id === id);
        if (idx >= 0) eventos[idx].status = novoStatus;
        aplicarFiltros();
        calcularKPIs();
      } catch (err) {
        alert('Não foi possível salvar o Status. Tente novamente.');
        const evento = eventos.find(e => e.id === id);
        ev.target.value = (evento?.status || 'Aberto');
      } finally {
        ev.target.disabled = false;
      }
    });
  });

  // EDIÇÃO INLINE
  const tabela = document.getElementById('tabelaEventos'); // é o TBODY
  if (tabela) anexarEdicaoInline(tabela);
}

function anexarEdicaoInline(tabela){
  const inputs = tabela.querySelectorAll('.money-input');

  inputs.forEach(inp=>{
    const original = inp.value;

    inp.addEventListener('focus', () => {
      setTimeout(()=>inp.select(), 0);
    });

    inp.addEventListener('keydown', (e)=>{
      if (e.key === 'Enter'){
        e.preventDefault();
        inp.blur(); // salva
      } else if (e.key === 'Escape'){
        e.preventDefault();
        inp.value = original;
        inp.blur();
      }
    });

    inp.addEventListener('blur', async ()=>{
      const id = inp.getAttribute('data-id');
      const field = inp.getAttribute('data-field');
      const novoValor = parseMoney(inp.value);

      if (formatNumberBR(novoValor) === original) return;

      inp.disabled = true;

      try{
        await db.ref('eventos/'+id+'/'+field).set(novoValor);
        carregarEventos(); // recarrega tabela + KPIs
      }catch(err){
        alert('Não foi possível salvar. Tente novamente.');
        inp.disabled = false;
        inp.focus();
      }
    });
  });
}

/**
 * KPI “Lucro no Mês” — Regra pedida:
 * - Considerar SOMENTE eventos com status 'Fechado' ou 'Finalizado' do mês corrente.
 * - O valor é a SOMA de `lucroFinal` de cada evento.
 * - Se `lucroFinal` estiver ausente ou zero, contabiliza zero (NÃO calcular fórmula).
 */
async function calcularKPIs() {
  const hoje = new Date();
  const semanaInicio = new Date(hoje);
  semanaInicio.setDate(semanaInicio.getDate() - semanaInicio.getDay() + 1);
  const semanaFim = new Date(semanaInicio);
  semanaFim.setDate(semanaFim.getDate() + 7);

  let estimado = 0, realizado = 0, semana = 0;
  let estimativaMes = 0, vendaMes = 0, lucroMes = 0, estimativaSemana = 0;

  db.ref('eventos').once('value').then(snapshot => {
    const lista = snapshot.val();

    if (lista) {
      Object.values(lista).forEach(e => {
        if (!e || !e.data) return;

        const dataEvento = formatDateBR(e.data);
        const status = (e.status || '').toLowerCase();

        const dentroDoMes = dataEvento.getFullYear() === hoje.getFullYear() &&
                            dataEvento.getMonth() === hoje.getMonth();
        const dentroDaSemana = dataEvento >= semanaInicio && dataEvento <= semanaFim;

        const vendaPDV = Number(e.vendaPDV || 0);
        const lucroFinal = Number(e.lucroFinal || 0); // usar somente o snapshot salvo

        if (dentroDoMes) {
          estimado++;
          estimativaMes += Number(e.estimativaVenda || 0);
        }

        if (dentroDoMes && (status === 'fechado' || status === 'finalizado')) {
          realizado++;
          vendaMes += vendaPDV;
          // SOMENTE o lucroFinal salvo; se 0 ou ausente, soma 0 (sem fórmula)
          if (!isNaN(lucroFinal)) {
            lucroMes += lucroFinal;
          }
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

function limparFiltros(){
  const fs = document.getElementById('filtroStatus');
  const fn = document.getElementById('filtroNome');
  const fdi = document.getElementById('filtroDataInicio');
  const fdf = document.getElementById('filtroDataFim');
  if (fs) fs.value = 'Todos';
  if (fn) fn.value = '';
  if (fdi) fdi.value = '';
  if (fdf) fdf.value = '';
  aplicarFiltros();
}

document.getElementById('filtrosForm')?.addEventListener('submit', function(e) {
  e.preventDefault();
  aplicarFiltros();
});

document.addEventListener("DOMContentLoaded", () => {
  carregarEventos();
  calcularKPIs();
});
