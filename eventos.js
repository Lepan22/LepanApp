const firebaseConfig = {
  apiKey: "AIzaSyBClDBA7f9-jfF6Nz6Ia-YlZ6G-hx3oerY",
  authDomain: "lepanapp.firebaseapp.com",
  databaseURL: "https://lepanapp-default-rtdb.firebaseio.com",
  projectId: "lepanapp"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let eventos = [];

/* Utilidades */
function formatDateBR(dateStr) {
  if (!dateStr) return new Date('1970-01-01T00:00:00');
  const [y,m,d] = String(dateStr).split('-');
  return new Date(`${y}-${m}-${d}T00:00:00`);
}
function formatCurrency(v) {
  return Number(v || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
}
function formatNumberBR(v){
  return Number(v || 0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
}
function parseMoney(str){
  if (str == null) return 0;
  const s = String(str).replace(/[^\d,.\-]/g,'').replace(/\./g,'').replace(',','.');
  const n = parseFloat(s);
  return isNaN(n) ? 0 : Math.round(n*100)/100;
}

/* Carregamento */
function carregarEventos() {
  db.ref('eventos').once('value').then(snap => {
    eventos = [];
    snap.forEach(child => {
      const ev = child.val() || {};
      ev.id = child.key;
      eventos.push(ev);
    });
    eventos.sort((a,b)=>{
      if(!a.data) return 1;
      if(!b.data) return -1;
      return b.data.localeCompare(a.data);
    });

    aplicarFiltros();
    calcularKPIs(); // KPIs dependem de eventos + configuração
  });
}

/* Listagem + edição inline */
function aplicarFiltros() {
  const status = document.getElementById('filtroStatus')?.value || 'Todos';
  const nomeFiltro = (document.getElementById('filtroNome')?.value || '').toLowerCase();
  const dataInicio = document.getElementById('filtroDataInicio')?.value || '';
  const dataFim = document.getElementById('filtroDataFim')?.value || '';
  const tabela = document.getElementById('tabelaEventos');
  if (!tabela) return;
  tabela.innerHTML = '';

  const eventosFiltrados = eventos.filter(e=>{
    if (status !== 'Todos' && (e.status || 'Aberto') !== status) return false;
    if (nomeFiltro && !(e.nomeEvento || '').toLowerCase().includes(nomeFiltro)) return false;
    if (dataInicio && (!e.data || e.data < dataInicio)) return false;
    if (dataFim && (!e.data || e.data > dataFim)) return false;
    return true;
  });

  eventosFiltrados.forEach(eAtual=>{
    const eventosAnteriores = eventos
      .filter(e=> e.nomeEvento === eAtual.nomeEvento && e.data && eAtual.data && e.data < eAtual.data && e.vendaPDV)
      .sort((a,b)=> b.data.localeCompare(a.data))
      .slice(0,3);

    const somaVenda = eventosAnteriores.reduce((s,ev)=> s + (parseFloat(ev.vendaPDV) || 0), 0);
    const mediaVenda = eventosAnteriores.length ? somaVenda / eventosAnteriores.length : 0;

    const vendaPDVNum = Number(eAtual.vendaPDV || 0);
    const estimativaNum = Number(eAtual.estimativaVenda || 0);
    const corOk = vendaPDVNum > estimativaNum;
    const corStyle = corOk ? 'color:#1b7f1b;font-weight:700' : 'color:#c62828;font-weight:700';

    const statusAtual = eAtual.status || 'Aberto';
    const selectStatus = `
      <select class="status-select" data-id="${eAtual.id}">
        <option value="Aberto"${statusAtual==='Aberto'?' selected':''}>Aberto</option>
        <option value="Finalizado"${statusAtual==='Finalizado'?' selected':''}>Finalizado</option>
        <option value="Fechado"${statusAtual==='Fechado'?' selected':''}>Fechado</option>
      </select>
    `;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${eAtual.nomeEvento || '-'}</td>
      <td>${eAtual.data || '-'}</td>
      <td>${selectStatus}</td>
      <td>${formatCurrency(mediaVenda)}</td>
      <td>
        <input type="text" class="money-input inp-estimativa" data-id="${eAtual.id}" data-field="estimativaVenda"
               value="${formatNumberBR(estimativaNum)}" />
      </td>
      <td>
        <input type="text" class="money-input inp-pdv" data-id="${eAtual.id}" data-field="vendaPDV"
               style="${corStyle}" value="${formatNumberBR(vendaPDVNum)}" />
      </td>
      <td class="acoes">
        <button class="btn btn-sm btn-outline-primary" onclick="editarEvento('${eAtual.id}')">Editar</button>
        <button class="btn btn-sm btn-outline-secondary" onclick="duplicarEvento('${eAtual.id}')">Duplicar</button>
        <button class="btn btn-sm btn-outline-success" onclick="enviarLink('${eAtual.id}')">Enviar Link</button>
        <button class="btn btn-sm btn-outline-info" onclick="visualizarEvento('${eAtual.id}')">Visualizar</button>
        <button class="btn btn-sm btn-outline-danger" onclick="excluirEvento('${eAtual.id}')">Excluir</button>
      </td>
    `;
    tabela.appendChild(row);
  });

  // salvar status imediato
  tabela.querySelectorAll('select.status-select').forEach(sel=>{
    sel.addEventListener('change', async ev=>{
      const id = ev.target.dataset.id;
      const novoStatus = ev.target.value;
      ev.target.disabled = true;
      try {
        await db.ref('eventos/'+id+'/status').set(novoStatus);
        const idx = eventos.findIndex(e=>e.id===id);
        if (idx>=0) eventos[idx].status = novoStatus;
        aplicarFiltros();
        calcularKPIs();
      } finally {
        ev.target.disabled = false;
      }
    });
  });

  anexarEdicaoInline(tabela);
}

function anexarEdicaoInline(tabela){
  const inputs = tabela.querySelectorAll('.money-input');
  inputs.forEach(inp=>{
    const original = inp.value;
    inp.addEventListener('focus',()=> setTimeout(()=>inp.select(),0));
    inp.addEventListener('keydown',e=>{
      if(e.key==='Enter'){ e.preventDefault(); inp.blur(); }
      else if(e.key==='Escape'){ e.preventDefault(); inp.value = original; inp.blur(); }
    });
    inp.addEventListener('blur', async ()=>{
      const id = inp.dataset.id;
      const field = inp.dataset.field;
      const novoValor = parseMoney(inp.value);
      if (formatNumberBR(novoValor) === original) return;
      inp.disabled = true;
      try {
        await db.ref('eventos/'+id+'/'+field).set(novoValor);
        carregarEventos();
      } catch {
        alert('Não foi possível salvar. Tente novamente.');
        inp.disabled = false; inp.focus();
      }
    });
  });
}

/* KPIs */
async function calcularKPIs() {
  // Lê configuração (para % Lucro)
  const cfgSnap = await db.ref('configuracao').once('value');
  const cfg = cfgSnap.val() || {};
  const percentualLucro = Number(cfg.percentualLucro ?? 40); // fallback 40% (edite na Configuração)

  const hoje = new Date();
  const semanaInicio = new Date(hoje);
  semanaInicio.setDate(semanaInicio.getDate() - semanaInicio.getDay() + 1); // 2ª
  const semanaFim = new Date(semanaInicio);
  semanaFim.setDate(semanaFim.getDate() + 7);

  let estimado = 0, realizado = 0, semana = 0;
  let estimativaMes = 0, vendaMes = 0, estimativaSemana = 0, lucroMes = 0;

  const lista = eventos || [];
  lista.forEach(e=>{
    if (!e.data) return;

    const dataEvento = formatDateBR(e.data);
    const status = (e.status || '').toLowerCase();

    const dentroDoMes = dataEvento.getFullYear() === hoje.getFullYear() &&
                        dataEvento.getMonth() === hoje.getMonth();
    const dentroDaSemana = dataEvento >= semanaInicio && dataEvento <= semanaFim;

    const vendaPDV = Number(e.vendaPDV || 0);

    if (dentroDoMes) {
      estimado++;
      estimativaMes += Number(e.estimativaVenda || 0);
    }

    // Lucro no mês: soma do lucroFinal (Fechado/Finalizado)
    if (dentroDoMes && (status==='fechado' || status==='finalizado')) {
      realizado++;
      vendaMes += vendaPDV;
      lucroMes += Number(e.lucroFinal || 0);
    }

    if (dentroDaSemana) {
      estimativaSemana += Number(e.estimativaVenda || 0);
      semana++;
    }
  });

  const lucroEstimadoMes = estimativaMes * (percentualLucro/100);

  // Preenche os cartões
  const $ = id => document.getElementById(id);
  $('kpi-estimado')?.innerText = estimado;
  $('kpi-realizado')?.innerText = realizado;
  $('kpi-semana')?.innerText = semana;

  $('kpi-estimativa-semana')?.innerText = formatCurrency(estimativaSemana);

  $('kpi-estimativa-mes')?.innerText = formatCurrency(estimativaMes);
  $('kpi-venda-mes')?.innerText = formatCurrency(vendaMes);
  $('kpi-lucro-mes')?.innerText = formatCurrency(lucroMes);

  $('kpi-lucro-estimado-mes')?.innerText = formatCurrency(lucroEstimadoMes);
}

/* Ações */
function editarEvento(id){ window.location.href = `GestaoEvento.html?id=${id}`; }
function visualizarEvento(id){ window.location.href = `visualizar_evento.html?id=${id}`; }
function enviarLink(id){
  const url = `${window.location.origin}/LepanApp/form.html?id=${id}`;
  navigator.clipboard.writeText(url).then(()=> alert('Link copiado para a área de transferência!'));
}
function duplicarEvento(id){
  const ev = eventos.find(e=>e.id===id);
  if (!ev) return;
  const novo = {...ev};
  novo.produtos = (ev.produtos || []).map(p=>({
    produtoId: p.produtoId, quantidade: p.quantidade, congelado:0, assado:0, perda:0
  }));
  delete novo.id; delete novo.vendaPDV; delete novo.data;
  novo.status = 'Aberto';
  const novoId = db.ref('eventos').push().key;
  db.ref('eventos/'+novoId).set(novo).then(()=>{
    alert('Evento duplicado com sucesso!'); carregarEventos();
  });
}
function excluirEvento(id){
  if (confirm('Tem certeza que deseja excluir este evento?')) {
    db.ref('eventos/'+id).remove().then(()=>{
      alert('Evento excluído com sucesso!'); carregarEventos();
    });
  }
}
function limparFiltros(){
  const ids = ['filtroStatus','filtroNome','filtroDataInicio','filtroDataFim'];
  ids.forEach(i=>{ const el = document.getElementById(i); if (el) el.value = i==='filtroStatus'?'Todos':''; });
  aplicarFiltros();
}

document.getElementById('filtrosForm')?.addEventListener('submit',e=>{
  e.preventDefault(); aplicarFiltros();
});
document.addEventListener('DOMContentLoaded',()=> carregarEventos());
