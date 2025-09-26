const firebaseConfig = {
  apiKey: "AIzaSyBClDBA7f9-jfF6Nz6Ia-YlZ6G-hx3oerY",
  authDomain: "lepanapp.firebaseapp.com",
  databaseURL: "https://lepanapp-default-rtdb.firebaseio.com",
  projectId: "lepanapp"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let equipeDisponivel = [], logisticaDisponivel = [], produtosDisponiveis = [];
let equipeAlocada = [], logisticaAlocada = [], listaProdutos = [];
let eventoId = null;
let percentualCMV = 0;

/* ===== Configurações ===== */
function carregarPercentualCMV() {
  return db.ref('/configuracao/percentualCMV').once('value').then(s => {
    percentualCMV = s.val() || 0;
  });
}

/* ===== Dados base ===== */
function carregarClientes() {
  const selectEvento = document.getElementById('nomeEvento');
  db.ref('clientes').once('value').then(snapshot => {
    selectEvento.innerHTML = '<option value="">Selecione</option>';
    snapshot.forEach(child => {
      const c = child.val();
      if (c.status === 'Fechado' && c.clienteAtivo?.nomeEvento) {
        const opt = document.createElement('option');
        opt.value = c.clienteAtivo.nomeEvento;
        opt.textContent = c.clienteAtivo.nomeEvento;
        selectEvento.appendChild(opt);
      }
    });
  });
}
function carregarResponsaveis() {
  const select = document.getElementById('responsavel');
  db.ref('equipe').once('value').then(snapshot => {
    select.innerHTML = '<option value="">Selecione</option>';
    snapshot.forEach(child => {
      const m = child.val();
      const opt = document.createElement('option');
      opt.value = m.apelido;
      opt.textContent = m.apelido;
      select.appendChild(opt);
    });
  });
}
function carregarEquipeDisponivel() {
  const btn = document.getElementById('btnEquipe');
  equipeDisponivel = [];
  db.ref('equipe').once('value').then(snapshot => {
    snapshot.forEach(ch => {
      const m = ch.val();
      equipeDisponivel.push({ id: ch.key, nome: m.apelido || m.nomeCompleto });
    });
    if (btn) btn.disabled = false;
  });
}
function carregarLogisticaDisponivel() {
  const btn = document.getElementById('btnLogistica');
  logisticaDisponivel = [];
  db.ref('logistica').once('value').then(snapshot => {
    snapshot.forEach(ch => {
      const l = ch.val();
      logisticaDisponivel.push({ id: ch.key, nome: l.nome });
    });
    if (btn) btn.disabled = false;
  });
}
function carregarProdutosDisponiveis() {
  db.ref('produtos').once('value').then(snapshot => {
    produtosDisponiveis = [];
    const dl = document.getElementById('produtosList');
    dl.innerHTML = '';
    snapshot.forEach(ch => {
      const p = ch.val();
      produtosDisponiveis.push({ id: ch.key, nome: p.nome, valorVenda: p.valorVenda || 0, custo: p.custo || 0 });
      const opt = document.createElement('option');
      opt.value = p.nome; dl.appendChild(opt);
    });
  });
}

/* ===== Evento existente ===== */
function carregarEventoExistente() {
  const params = new URLSearchParams(window.location.search);
  eventoId = params.get('id');
  if (!eventoId) return;

  db.ref('eventos/' + eventoId).once('value').then(s => {
    const e = s.val(); if (!e) return;

    document.getElementById('nomeEvento').value = e.nomeEvento || '';
    document.getElementById('data').value = e.data || '';
    document.getElementById('responsavel').value = e.responsavel || '';
    document.getElementById('status').value = e.status || '';
    document.getElementById('vendaPDV').value = e.vendaPDV || '';
    document.getElementById('cmvReal').value = (e.cmvReal ?? '') === '' ? '' : Number(e.cmvReal).toFixed(2);
    document.getElementById('estimativaVenda').value = e.estimativaVenda || '';

    equipeAlocada = e.equipe || [];
    logisticaAlocada = e.logistica || [];
    listaProdutos = e.produtos || [];

    renderizarEquipe();
    renderizarLogistica();
    renderizarProdutos();
    calcularTotais();
  });
}

/* ===== UI de Equipe/Logística ===== */
function adicionarEquipe(){ equipeAlocada.push({ membroId:'', valor:0 }); renderizarEquipe(); }
function renderizarEquipe(){
  const el = document.getElementById('equipeContainer'); el.innerHTML='';
  equipeAlocada.forEach((item,i)=>{
    const div = document.createElement('div');
    div.className='row mb-2';
    div.innerHTML = `
      <div style="flex:1;"><select class="form-select">${equipeDisponivel.map(m=>`<option value="${m.id}" ${m.id===item.membroId?'selected':''}>${m.nome}</option>`).join('')}</select></div>
      <div style="width:140px;"><input type="number" class="form-control" placeholder="Valor" value="${item.valor}"></div>
      <div><button type="button" class="btn btn-danger">🗑️</button></div>`;
    el.appendChild(div);
    div.querySelector('select').onchange = e => { item.membroId = e.target.value; calcularTotais(); };
    div.querySelector('input').oninput = e => { item.valor = parseFloat(e.target.value)||0; calcularTotais(); };
    div.querySelector('button').onclick = ()=>{ equipeAlocada.splice(i,1); renderizarEquipe(); calcularTotais(); };
  });
}
function adicionarLogistica(){ logisticaAlocada.push({ prestadorId:'', valor:0 }); renderizarLogistica(); }
function renderizarLogistica(){
  const el = document.getElementById('logisticaContainer'); el.innerHTML='';
  logisticaAlocada.forEach((item,i)=>{
    const div = document.createElement('div');
    div.className='row mb-2';
    div.innerHTML = `
      <div style="flex:1;"><select class="form-select">${logisticaDisponivel.map(l=>`<option value="${l.id}" ${l.id===item.prestadorId?'selected':''}>${l.nome}</option>`).join('')}</select></div>
      <div style="width:140px;"><input type="number" class="form-control" placeholder="Valor" value="${item.valor}"></div>
      <div><button type="button" class="btn btn-danger">🗑️</button></div>`;
    el.appendChild(div);
    div.querySelector('select').onchange = e => { item.prestadorId = e.target.value; calcularTotais(); };
    div.querySelector('input').oninput = e => { item.valor = parseFloat(e.target.value)||0; calcularTotais(); };
    div.querySelector('button').onclick = ()=>{ logisticaAlocada.splice(i,1); renderizarLogistica(); calcularTotais(); };
  });
}

/* ===== Produtos ===== */
function adicionarProduto(){ listaProdutos.push({ produtoId:'', produtoNome:'', quantidade:0, congelado:0, assado:0, perda:0 }); renderizarProdutos(); }

async function buscarMediaProduto(nomeEvento, produtoId){
  const snap = await db.ref(`media_evento/${nomeEvento}/${produtoId}`).once('value');
  return snap.exists() ? Number(snap.val()).toFixed(1) : '0.0';
}

async function renderizarProdutos(){
  const tbody = document.getElementById('tabelaProdutos'); tbody.innerHTML='';
  const nomeEvento = document.getElementById('nomeEvento').value;

  for (let i=0;i<listaProdutos.length;i++){
    const it = listaProdutos[i];
    const p = produtosDisponiveis.find(x=>x.id===it.produtoId) || { id:'', nome:'', valorVenda:0, custo:0 };

    const vendida = Math.max(0, it.quantidade - it.congelado - it.assado - it.perda);
    const valorVenda = vendida * p.valorVenda;
    const valorPerda = it.perda * p.custo;
    const media = it.produtoId && nomeEvento ? await buscarMediaProduto(nomeEvento, it.produtoId) : '0.0';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input class="form-control" list="produtosList" value="${p.nome}"></td>
      <td><input class="form-control" type="number" value="${it.quantidade}"></td>
      <td><input class="form-control" value="${media}" disabled></td>
      <td><input class="form-control" type="number" value="${it.congelado}"></td>
      <td><input class="form-control" type="number" value="${it.assado}"></td>
      <td><input class="form-control" type="number" value="${it.perda}"></td>
      <td><input class="form-control" value="${vendida}" disabled></td>
      <td><input class="form-control" value="R$ ${valorVenda.toFixed(2)}" disabled></td>
      <td><input class="form-control" value="R$ ${valorPerda.toFixed(2)}" disabled></td>
      <td><button type="button" class="btn btn-danger">🗑️</button></td>`;
    tbody.appendChild(tr);

    const ins = tr.querySelectorAll('input');
    ins[0].onchange = e => { const prod = produtosDisponiveis.find(pp=>pp.nome===e.target.value); if (prod){ it.produtoId=prod.id; it.produtoNome=prod.nome; } calcularTotais(); };
    ins[1].oninput = e => { it.quantidade = parseInt(e.target.value)||0; calcularTotais(); };
    ins[3].oninput = e => { it.congelado  = parseInt(e.target.value)||0; calcularTotais(); };
    ins[4].oninput = e => { it.assado     = parseInt(e.target.value)||0; calcularTotais(); };
    ins[5].oninput = e => { it.perda      = parseInt(e.target.value)||0; calcularTotais(); };

    tr.querySelector('button').onclick = () => { listaProdutos.splice(i,1); renderizarProdutos(); calcularTotais(); };
  }
}

/* ===== Totais ===== */
function setText(id,val){ const el=document.getElementById(id); if(el) el.innerText=val; }

function calcularTotais(){
  let vendaSistema=0, custoPerda=0, valorAssados=0, potencialVenda=0;

  listaProdutos.forEach(it=>{
    const p = produtosDisponiveis.find(x=>x.id===it.produtoId) || { valorVenda:0, custo:0 };
    const vendida = Math.max(0, it.quantidade - it.congelado - it.assado - it.perda);
    vendaSistema += vendida * p.valorVenda;
    custoPerda   += it.perda   * p.custo;
    valorAssados += it.assado  * p.custo;
    potencialVenda += it.quantidade * p.valorVenda;
  });

  const vendaPDV = parseFloat(document.getElementById('vendaPDV').value)||0;
  const cmvReal = vendaPDV * (percentualCMV/100);
  const cmvInput = document.getElementById('cmvReal'); if (cmvInput) cmvInput.value = cmvReal.toFixed(2);

  const custoEquipe =  equipeAlocada.reduce((s,e)=>s+(e.valor||0),0);
  const custoLog    =  logisticaAlocada.reduce((s,l)=>s+(l.valor||0),0);
  const diferenca   =  vendaPDV - vendaSistema;
  const lucroFinal  =  vendaPDV - cmvReal - custoLog - custoEquipe - custoPerda;

  setText('vendaSistema',   vendaSistema.toFixed(2));
  setText('diferencaVenda', diferenca.toFixed(2));
  setText('lucroFinal',     lucroFinal.toFixed(2));
  setText('custoPerda',     custoPerda.toFixed(2));
  setText('valorAssados',   valorAssados.toFixed(2));
  setText('custoLogistica', custoLog.toFixed(2));
  setText('custoEquipe',    custoEquipe.toFixed(2));
  setText('potencialVenda', potencialVenda.toFixed(2));
}

/* ===== Salvar ===== */
document.getElementById('formGestaoEvento').addEventListener('submit', e=>{
  e.preventDefault();

  const vendaPDV = parseFloat(document.getElementById('vendaPDV').value)||0;
  const cmvReal = vendaPDV * (percentualCMV/100);

  const custoEquipe =  equipeAlocada.reduce((s,e)=>s+(e.valor||0),0);
  const custoLog    =  logisticaAlocada.reduce((s,l)=>s+(l.valor||0),0);
  const custoPerda  =  listaProdutos.reduce((s,p)=>{const pr=produtosDisponiveis.find(x=>x.id===p.produtoId)||{custo:0}; return s+(p.perda*pr.custo);},0);
  const valorAssados=  listaProdutos.reduce((s,p)=>{const pr=produtosDisponiveis.find(x=>x.id===p.produtoId)||{custo:0}; return s+(p.assado*pr.custo);},0);
  const vendaSistema=  listaProdutos.reduce((s,p)=>{const pr=produtosDisponiveis.find(x=>x.id===p.produtoId)||{valorVenda:0}; const vendida=Math.max(0,p.quantidade-p.congelado-p.assado-p.perda); return s+(vendida*pr.valorVenda);},0);
  const diferenca   =  vendaPDV - vendaSistema;
  const lucroFinal  =  vendaPDV - cmvReal - custoLog - custoEquipe - custoPerda;

  const evento = {
    nomeEvento: document.getElementById('nomeEvento').value,
    data: document.getElementById('data').value,
    responsavel: document.getElementById('responsavel').value,
    status: document.getElementById('status').value,
    vendaPDV,
    cmvReal,
    lucroFinal,
    custoPerda,
    valorAssados,
    diferencaVenda: diferenca,
    estimativaVenda: parseFloat(document.getElementById('estimativaVenda').value)||0,
    produtos: listaProdutos,
    equipe: equipeAlocada,
    logistica: logisticaAlocada
  };

  const id = (new URLSearchParams(window.location.search)).get('id') || db.ref('eventos').push().key;
  db.ref('eventos/'+id).set(evento).then(()=>{
    alert('Evento salvo com sucesso!');
    window.location.href = 'eventos.html';
  });
});

/* ===== Boot ===== */
document.addEventListener('DOMContentLoaded', ()=>{
  Promise.all([
    carregarPercentualCMV(),
    carregarClientes(),
    carregarResponsaveis(),
    carregarEquipeDisponivel(),
    carregarLogisticaDisponivel(),
    carregarProdutosDisponiveis()
  ]).then(()=>carregarEventoExistente());
});
