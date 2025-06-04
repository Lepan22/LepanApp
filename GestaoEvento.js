const firebaseConfig = {
  apiKey: "AIzaSyBClDBA7f9-jfF6Nz6Ia-YlZ6G-hx3oerY",
  authDomain: "lepanapp.firebaseapp.com",
  databaseURL: "https://lepanapp-default-rtdb.firebaseio.com",
  projectId: "lepanapp"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let equipeAlocada = [];
let logisticaAlocada = [];
let listaProdutos = [];
let produtosDisponiveis = {};
let eventoId = null;

document.addEventListener('DOMContentLoaded', async () => {
  await carregarDadosIniciais();
  carregarEvento();
  document.getElementById('formGestaoEvento').addEventListener('submit', salvarEvento);
});

async function carregarDadosIniciais() {
  const [clientesSnap, equipeSnap, logisticaSnap, produtosSnap] = await Promise.all([
    db.ref('clientes').once('value'),
    db.ref('equipe').once('value'),
    db.ref('logistica').once('value'),
    db.ref('produtos').once('value')
  ]);

  const selectEvento = document.getElementById('nomeEvento');
  clientesSnap.forEach(child => {
    const cli = child.val();
    if (cli.clienteAtivo) {
      const opt = document.createElement('option');
      opt.value = child.key;
      opt.textContent = cli.nome;
      selectEvento.appendChild(opt);
    }
  });

  const selectResponsavel = document.getElementById('responsavel');
  equipeSnap.forEach(child => {
    const eq = child.val();
    const opt = document.createElement('option');
    opt.value = child.key;
    opt.textContent = eq.nome;
    selectResponsavel.appendChild(opt);
  });

  equipeAlocada = [];
  equipeSnap.forEach(child => {
    const obj = child.val();
    obj.id = child.key;
    equipeAlocada.push(obj);
  });

  logisticaAlocada = [];
  logisticaSnap.forEach(child => {
    const obj = child.val();
    obj.id = child.key;
    logisticaAlocada.push(obj);
  });

  produtosDisponiveis = produtosSnap.val();
  const datalist = document.getElementById('produtosList');
  Object.entries(produtosDisponiveis).forEach(([id, prod]) => {
    const opt = document.createElement('option');
    opt.value = prod.nome;
    datalist.appendChild(opt);
  });
}

function carregarEvento() {
  const url = new URLSearchParams(window.location.search);
  eventoId = url.get('id');
  if (!eventoId) {
    document.getElementById('btnEquipe').disabled = false;
    document.getElementById('btnLogistica').disabled = false;
    return;
  }

  db.ref(`eventos/${eventoId}`).once('value').then(snapshot => {
    const ev = snapshot.val();
    document.getElementById('nomeEvento').value = ev.nomeEvento || '';
    document.getElementById('data').value = ev.data || '';
    document.getElementById('responsavel').value = ev.responsavel || '';
    document.getElementById('status').value = ev.status || 'Aberto';
    document.getElementById('vendaPDV').value = ev.vendaPDV || '';
    document.getElementById('estimativaVenda').value = ev.estimativaVenda || '';

    equipeAlocada = ev.equipe || [];
    logisticaAlocada = ev.logistica || [];
    listaProdutos = ev.produtos || [];

    renderizarEquipe();
    renderizarLogistica();
    renderizarProdutos();
    calcularTotais();

    document.getElementById('btnEquipe').disabled = false;
    document.getElementById('btnLogistica').disabled = false;
  });
}

function renderizarEquipe() {
  const container = document.getElementById('equipeContainer');
  container.innerHTML = '';
  equipeAlocada.forEach((membro, i) => {
    const div = document.createElement('div');
    div.className = 'item-linha';
    div.innerHTML = `
      <input type="text" placeholder="Nome" value="${membro.nome || ''}" oninput="equipeAlocada[${i}].nome=this.value">
      <input type="text" placeholder="RG" value="${membro.rg || ''}" oninput="equipeAlocada[${i}].rg=this.value">
      <input type="number" placeholder="Valor" value="${membro.valor || ''}" oninput="equipeAlocada[${i}].valor=this.value; calcularTotais()">
      <button type="button" onclick="removerEquipe(${i})">🗑️</button>
    `;
    container.appendChild(div);
  });
}

function renderizarLogistica() {
  const container = document.getElementById('logisticaContainer');
  container.innerHTML = '';
  logisticaAlocada.forEach((prestador, i) => {
    const div = document.createElement('div');
    div.className = 'item-linha';
    div.innerHTML = `
      <input type="text" placeholder="Nome" value="${prestador.nome || ''}" oninput="logisticaAlocada[${i}].nome=this.value">
      <input type="text" placeholder="RG" value="${prestador.rg || ''}" oninput="logisticaAlocada[${i}].rg=this.value">
      <input type="number" placeholder="Valor" value="${prestador.valor || ''}" oninput="logisticaAlocada[${i}].valor=this.value; calcularTotais()">
      <button type="button" onclick="removerLogistica(${i})">🗑️</button>
    `;
    container.appendChild(div);
  });
}

function removerEquipe(i) {
  equipeAlocada.splice(i, 1);
  renderizarEquipe();
  calcularTotais();
}

function removerLogistica(i) {
  logisticaAlocada.splice(i, 1);
  renderizarLogistica();
  calcularTotais();
}

function adicionarEquipe() {
  equipeAlocada.push({ nome: '', rg: '', valor: 0 });
  renderizarEquipe();
}

function adicionarLogistica() {
  logisticaAlocada.push({ nome: '', rg: '', valor: 0 });
  renderizarLogistica();
}

function adicionarProduto() {
  listaProdutos.push({
    produtoId: '',
    quantidade: 0,
    congelado: 0,
    assado: 0,
    perda: 0
  });
  renderizarProdutos();
}

function renderizarProdutos() {
  const tbody = document.getElementById('tabelaProdutos');
  tbody.innerHTML = '';
  listaProdutos.forEach((prod, i) => {
    const p = produtosDisponiveis[prod.produtoId] || {};
    const vendido = prod.quantidade - prod.congelado - prod.assado - prod.perda;
    const valorVenda = vendido * (p.valorVenda || 0);
    const valorPerda = (prod.perda || 0) * (p.valorVenda || 0);
    const media = p.media || 0;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input list="produtosList" value="${p.nome || ''}" oninput="selecionarProduto(this.value, ${i})"></td>
      <td><input type="number" value="${prod.quantidade}" oninput="listaProdutos[${i}].quantidade=parseFloat(this.value)||0; calcularTotais()"></td>
      <td style="text-align: center;">${media.toFixed(1)}</td>
      <td><input type="number" value="${prod.congelado}" oninput="listaProdutos[${i}].congelado=parseFloat(this.value)||0; calcularTotais()"></td>
      <td><input type="number" value="${prod.assado}" oninput="listaProdutos[${i}].assado=parseFloat(this.value)||0; calcularTotais()"></td>
      <td><input type="number" value="${prod.perda}" oninput="listaProdutos[${i}].perda=parseFloat(this.value)||0; calcularTotais()"></td>
      <td>${vendido}</td>
      <td>R$ ${valorVenda.toFixed(2)}</td>
      <td>R$ ${valorPerda.toFixed(2)}</td>
      <td><button type="button" onclick="removerProduto(${i})">🗑️</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function selecionarProduto(nome, i) {
  const item = Object.entries(produtosDisponiveis).find(([_, p]) => p.nome === nome);
  if (item) {
    listaProdutos[i].produtoId = item[0];
    renderizarProdutos();
  }
}

function removerProduto(i) {
  listaProdutos.splice(i, 1);
  renderizarProdutos();
  calcularTotais();
}

function calcularTotais() {
  let totalVendida = 0;
  let valorSistema = 0;
  let perdaTotal = 0;
  let assadoTotal = 0;

  listaProdutos.forEach(prod => {
    const p = produtosDisponiveis[prod.produtoId] || {};
    const vendido = prod.quantidade - prod.congelado - prod.assado - prod.perda;
    const valorVenda = vendido * (p.valorVenda || 0);
    const valorPerda = (prod.perda || 0) * (p.valorVenda || 0);
    totalVendida += vendido;
    valorSistema += valorVenda;
    perdaTotal += valorPerda;
    assadoTotal += (prod.assado || 0) * (p.valorVenda || 0);
  });

  const percentualCMV = 0.3;
  const cmvReal = Number(document.getElementById('vendaPDV').value || 0) * percentualCMV;
  const diferencaVenda = Number(document.getElementById('vendaPDV').value || 0) - valorSistema;
  const custoEquipe = equipeAlocada.reduce((s, e) => s + Number(e.valor || 0), 0);
  const custoLogistica = logisticaAlocada.reduce((s, l) => s + Number(l.valor || 0), 0);
  const lucroFinal = Number(document.getElementById('vendaPDV').value || 0) - cmvReal - custoEquipe - custoLogistica;

  document.getElementById('totalVendida').textContent = totalVendida;
  document.getElementById('vendaSistema').textContent = valorSistema.toFixed(2);
  document.getElementById('diferencaVenda').textContent = diferencaVenda.toFixed(2);
  document.getElementById('cmvCalculado').textContent = cmvReal.toFixed(2);
  document.getElementById('lucroFinal').textContent = lucroFinal.toFixed(2);
  document.getElementById('custoPerda').textContent = perdaTotal.toFixed(2);
  document.getElementById('valorAssados').textContent = assadoTotal.toFixed(2);
  document.getElementById('custoEquipe').textContent = custoEquipe.toFixed(2);
  document.getElementById('custoLogistica').textContent = custoLogistica.toFixed(2);
  document.getElementById('potencialVenda').textContent = valorSistema.toFixed(2);
}

function salvarEvento(e) {
  e.preventDefault();
  const evento = {
    nomeEvento: document.getElementById('nomeEvento').value,
    data: document.getElementById('data').value,
    responsavel: document.getElementById('responsavel').value,
    status: document.getElementById('status').value,
    vendaPDV: Number(document.getElementById('vendaPDV').value || 0),
    estimativaVenda: Number(document.getElementById('estimativaVenda').value || 0),
    cmvReal: Number(document.getElementById('vendaPDV').value || 0) * 0.3,
    lucroFinal: Number(document.getElementById('lucroFinal').textContent || 0),
    custoPerda: Number(document.getElementById('custoPerda').textContent || 0),
    diferencaVenda: Number(document.getElementById('diferencaVenda').textContent || 0),
    valorAssados: Number(document.getElementById('valorAssados').textContent || 0),
    equipe: equipeAlocada,
    logistica: logisticaAlocada,
    produtos: listaProdutos
  };

  if (eventoId) {
    db.ref(`eventos/${eventoId}`).set(evento);
  } else {
    db.ref('eventos').push(evento);
  }

  alert('Evento salvo com sucesso!');
}
