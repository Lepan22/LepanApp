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

function carregarClientes() {
  const selectEvento = document.getElementById('nomeEvento');
  db.ref('clientes').once('value').then(snapshot => {
    selectEvento.innerHTML = '<option value="">Selecione</option>';
    snapshot.forEach(child => {
      const cliente = child.val();
      if (cliente.status === 'Fechado' && cliente.clienteAtivo?.nomeEvento) {
        const opt = document.createElement('option');
        opt.value = cliente.clienteAtivo.nomeEvento;
        opt.textContent = cliente.clienteAtivo.nomeEvento;
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
      const membro = child.val();
      const opt = document.createElement('option');
      opt.value = membro.apelido;
      opt.textContent = membro.apelido;
      select.appendChild(opt);
    });
  });
}

function carregarEquipeDisponivel() {
  const btn = document.getElementById('btnEquipe');
  equipeDisponivel = [];
  db.ref('equipe').once('value').then(snapshot => {
    snapshot.forEach(child => {
      const membro = child.val();
      equipeDisponivel.push({ id: child.key, nome: membro.apelido || membro.nomeCompleto });
    });
    if (btn) btn.disabled = false;
  });
}

function carregarLogisticaDisponivel() {
  const btn = document.getElementById('btnLogistica');
  logisticaDisponivel = [];
  db.ref('logistica').once('value').then(snapshot => {
    snapshot.forEach(child => {
      const prestador = child.val();
      logisticaDisponivel.push({ id: child.key, nome: prestador.nome });
    });
    if (btn) btn.disabled = false;
  });
}

function carregarProdutosDisponiveis() {
  db.ref('produtos').once('value').then(snapshot => {
    produtosDisponiveis = [];
    const datalist = document.getElementById('produtosList');
    datalist.innerHTML = '';
    snapshot.forEach(child => {
      const produto = child.val();
      produtosDisponiveis.push({ id: child.key, nome: produto.nome, valorVenda: produto.valorVenda || 0, custo: produto.custo || 0 });
      const opt = document.createElement('option');
      opt.value = produto.nome;
      datalist.appendChild(opt);
    });
  });
}

function carregarEventoExistente() {
  const params = new URLSearchParams(window.location.search);
  eventoId = params.get('id');
  if (!eventoId) return;

  db.ref('eventos/' + eventoId).once('value').then(snapshot => {
    const evento = snapshot.val();
    if (!evento) return;

    document.getElementById('nomeEvento').value = evento.nomeEvento || '';
    document.getElementById('data').value = evento.data || '';
    document.getElementById('responsavel').value = evento.responsavel || '';
    document.getElementById('status').value = evento.status || '';
    document.getElementById('vendaPDV').value = evento.vendaPDV || '';
    document.getElementById('cmvReal').value = evento.cmvReal || '';
    document.getElementById('estimativaVenda').value = evento.estimativaVenda || '';

    equipeAlocada = evento.equipe || [];
    logisticaAlocada = evento.logistica || [];
    listaProdutos = evento.produtos || [];

    renderizarEquipe();
    renderizarLogistica();
    renderizarProdutos();
    calcularTotais();
  });
}

function adicionarEquipe() {
  equipeAlocada.push({ membroId: '', valor: 0 });
  renderizarEquipe();
}

function renderizarEquipe() {
  const container = document.getElementById('equipeContainer');
  container.innerHTML = '';
  equipeAlocada.forEach((item, i) => {
    const div = document.createElement('div');
    div.className = 'row mb-2';
    div.innerHTML = `
      <div class="col"><select class="form-select form-select-sm">${equipeDisponivel.map(m => `<option value="${m.id}" ${m.id === item.membroId ? 'selected' : ''}>${m.nome}</option>`).join('')}</select></div>
      <div class="col"><input type="number" class="form-control form-control-sm" placeholder="Valor" value="${item.valor}"></div>
    `;
    container.appendChild(div);
    div.querySelector('select').onchange = e => { item.membroId = e.target.value; calcularTotais(); };
    div.querySelector('input').oninput = e => { item.valor = parseFloat(e.target.value) || 0; calcularTotais(); };
  });
}

function adicionarLogistica() {
  logisticaAlocada.push({ prestadorId: '', valor: 0 });
  renderizarLogistica();
}

function renderizarLogistica() {
  const container = document.getElementById('logisticaContainer');
  container.innerHTML = '';
  logisticaAlocada.forEach((item, i) => {
    const div = document.createElement('div');
    div.className = 'row mb-2';
    div.innerHTML = `
      <div class="col"><select class="form-select form-select-sm">${logisticaDisponivel.map(l => `<option value="${l.id}" ${l.id === item.prestadorId ? 'selected' : ''}>${l.nome}</option>`).join('')}</select></div>
      <div class="col"><input type="number" class="form-control form-control-sm" placeholder="Valor" value="${item.valor}"></div>
    `;
    container.appendChild(div);
    div.querySelector('select').onchange = e => { item.prestadorId = e.target.value; calcularTotais(); };
    div.querySelector('input').oninput = e => { item.valor = parseFloat(e.target.value) || 0; calcularTotais(); };
  });
}

function adicionarProduto() {
  listaProdutos.push({ produtoId: '', produtoNome: '', quantidade: 0, congelado: 0, assado: 0, perda: 0 });
  renderizarProdutos();
}

async function buscarMediaProduto(nomeEvento, produtoId) {
  const snap = await db.ref(`media_evento/${nomeEvento}/${produtoId}`).once('value');
  return snap.exists() ? snap.val().toFixed(1) : '0.0';
}

async function renderizarProdutos() {
  const tabela = document.getElementById('tabelaProdutos');
  tabela.innerHTML = '';

  const nomeEvento = document.getElementById('nomeEvento').value;

  for (let index = 0; index < listaProdutos.length; index++) {
    const item = listaProdutos[index];
    const produto = produtosDisponiveis.find(p => p.id === item.produtoId) || { id: '', nome: '', valorVenda: 0, custo: 0 };

    const vendida = Math.max(0, item.quantidade - item.congelado - item.assado - item.perda);
    const valorVenda = vendida * produto.valorVenda;
    const valorPerda = item.perda * produto.custo;

    const media = item.produtoId && nomeEvento ? await buscarMediaProduto(nomeEvento, item.produtoId) : '0.0';

    const row = document.createElement('tr');
    row.innerHTML = `
      <td><input type="text" class="form-control form-control-sm" list="produtosList" value="${produto.nome}"></td>
      <td><input type="number" class="form-control form-control-sm" value="${item.quantidade}"></td>
      <td><input type="text" class="form-control form-control-sm" value="${media}" disabled></td>
      <td><input type="number" class="form-control form-control-sm" value="${item.congelado}"></td>
      <td><input type="number" class="form-control form-control-sm" value="${item.assado}"></td>
      <td><input type="number" class="form-control form-control-sm" value="${item.perda}"></td>
      <td><input type="text" class="form-control form-control-sm" value="${vendida}" disabled></td>
      <td><input type="text" class="form-control form-control-sm" value="R$ ${valorVenda.toFixed(2)}" disabled></td>
      <td><input type="text" class="form-control form-control-sm" value="R$ ${valorPerda.toFixed(2)}" disabled></td>
      <td><button class="btn btn-sm btn-outline-danger">🗑️</button></td>
    `;
    tabela.appendChild(row);

    const inputs = row.querySelectorAll('input');
    inputs[0].onchange = e => {
      const nome = e.target.value;
      const prod = produtosDisponiveis.find(p => p.nome === nome);
      if (prod) {
        item.produtoId = prod.id;
        item.produtoNome = prod.nome;
      }
      calcularTotais();
    };
    inputs[1].oninput = e => { item.quantidade = parseInt(e.target.value) || 0; calcularTotais(); };
    inputs[3].oninput = e => { item.congelado = parseInt(e.target.value) || 0; calcularTotais(); };
    inputs[4].oninput = e => { item.assado = parseInt(e.target.value) || 0; calcularTotais(); };
    inputs[5].oninput = e => { item.perda = parseInt(e.target.value) || 0; calcularTotais(); };

    row.querySelector('button').onclick = () => { listaProdutos.splice(index, 1); renderizarProdutos(); calcularTotais(); };
  }
}

function calcularTotais() {
  let totalVendida = 0, vendaSistema = 0, custoPerda = 0, valorAssados = 0, cmvCalculado = 0, potencialVenda = 0;

  listaProdutos.forEach(item => {
    const produto = produtosDisponiveis.find(p => p.id === item.produtoId) || { valorVenda: 0, custo: 0 };
    const vendida = Math.max(0, item.quantidade - item.congelado - item.assado - item.perda);

    totalVendida += vendida;
    vendaSistema += vendida * produto.valorVenda;
    custoPerda += item.perda * produto.custo;
    valorAssados += item.assado * produto.custo;
    cmvCalculado += vendida * produto.custo;
    potencialVenda += item.quantidade * produto.valorVenda;
  });

  const vendaPDV = parseFloat(document.getElementById('vendaPDV').value) || 0;
  const cmvReal = parseFloat(document.getElementById('cmvReal').value) || 0;

  const custoEquipe = equipeAlocada.reduce((s, e) => s + (e.valor || 0), 0);
  const custoLogistica = logisticaAlocada.reduce((s, l) => s + (l.valor || 0), 0);

  const diferencaVenda = vendaPDV - vendaSistema;
  const lucroFinal = vendaPDV - cmvReal - custoLogistica - custoEquipe - custoPerda;

  document.getElementById('totalVendida').innerText = totalVendida;
  document.getElementById('vendaSistema').innerText = vendaSistema.toFixed(2);
  document.getElementById('diferencaVenda').innerText = diferencaVenda.toFixed(2);
  document.getElementById('cmvCalculado').innerText = cmvCalculado.toFixed(2);
  document.getElementById('lucroFinal').innerText = lucroFinal.toFixed(2);
  document.getElementById('custoPerda').innerText = custoPerda.toFixed(2);
  document.getElementById('valorAssados').innerText = valorAssados.toFixed(2);
  document.getElementById('custoLogistica').innerText = custoLogistica.toFixed(2);
  document.getElementById('custoEquipe').innerText = custoEquipe.toFixed(2);
  document.getElementById('potencialVenda').innerText = potencialVenda.toFixed(2);
}

document.getElementById('formGestaoEvento').addEventListener('submit', function(e) {
  e.preventDefault();

  const evento = {
    nomeEvento: document.getElementById('nomeEvento').value,
    data: document.getElementById('data').value,
    responsavel: document.getElementById('responsavel').value,
    status: document.getElementById('status').value,
    vendaPDV: parseFloat(document.getElementById('vendaPDV').value) || 0,
    cmvReal: parseFloat(document.getElementById('cmvReal').value) || 0,
    estimativaVenda: parseFloat(document.getElementById('estimativaVenda').value) || 0,
    produtos: listaProdutos,
    equipe: equipeAlocada,
    logistica: logisticaAlocada
  };

  const id = eventoId || db.ref('eventos').push().key;
  db.ref('eventos/' + id).set(evento).then(() => {
    alert('Evento salvo com sucesso!');
    window.location.href = "eventos.html";
  });
});

document.addEventListener("DOMContentLoaded", () => {
  carregarClientes();
  carregarResponsaveis();
  carregarEquipeDisponivel();
  carregarLogisticaDisponivel();
  carregarProdutosDisponiveis();
  carregarEventoExistente();
});
