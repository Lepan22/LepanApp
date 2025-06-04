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

function carregarPercentualCMV() {
  return db.ref('/configuracao/percentualCMV').once('value').then(snapshot => {
    percentualCMV = snapshot.val() || 0;
  });
}

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
    document.getElementById('cmvReal').value = (evento.cmvReal !== undefined && evento.cmvReal !== null) ? evento.cmvReal.toFixed(2) : '';
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
      <div class="col-auto"><button class="btn btn-sm btn-danger">🗑️</button></div>
    `;
    container.appendChild(div);
    div.querySelector('select').onchange = e => { item.membroId = e.target.value; calcularTotais(); };
    div.querySelector('input').oninput = e => { item.valor = parseFloat(e.target.value) || 0; calcularTotais(); };
    div.querySelector('button').onclick = () => {
      equipeAlocada.splice(i, 1);
      renderizarEquipe();
      calcularTotais();
    };
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
      <div class="col-auto"><button class="btn btn-sm btn-danger">🗑️</button></div>
    `;
    container.appendChild(div);
    div.querySelector('select').onchange = e => { item.prestadorId = e.target.value; calcularTotais(); };
    div.querySelector('input').oninput = e => { item.valor = parseFloat(e.target.value) || 0; calcularTotais(); };
    div.querySelector('button').onclick = () => {
      logisticaAlocada.splice(i, 1);
      renderizarLogistica();
      calcularTotais();
    };
  });
}

function adicionarProduto() {
  listaProdutos.push({ nome: '', quantidade: 0, congelado: 0, assado: 0, perda: 0 });
  renderizarProdutos();
}

function renderizarProdutos() {
  const tbody = document.getElementById('tabelaProdutos');
  tbody.innerHTML = '';
  listaProdutos.forEach((prod, i) => {
    const tr = document.createElement('tr');
    const vendido = prod.quantidade - prod.congelado - prod.assado - prod.perda;
    const produtoInfo = produtosDisponiveis.find(p => p.nome === prod.nome) || { valorVenda: 0, custo: 0 };
    const valorVenda = vendido * produtoInfo.valorVenda;
    const valorPerda = prod.perda * produtoInfo.valorVenda;

    tr.innerHTML = `
      <td><input list="produtosList" value="${prod.nome}" oninput="listaProdutos[${i}].nome = this.value; calcularTotais()"></td>
      <td><input type="number" value="${prod.quantidade}" oninput="listaProdutos[${i}].quantidade = parseFloat(this.value) || 0; calcularTotais()"></td>
      <td><input type="number" value="${prod.congelado}" oninput="listaProdutos[${i}].congelado = parseFloat(this.value) || 0; calcularTotais()"></td>
      <td><input type="number" value="${prod.assado}" oninput="listaProdutos[${i}].assado = parseFloat(this.value) || 0; calcularTotais()"></td>
      <td><input type="number" value="${prod.perda}" oninput="listaProdutos[${i}].perda = parseFloat(this.value) || 0; calcularTotais()"></td>
      <td>${vendido}</td>
      <td>R$ ${valorVenda.toFixed(2)}</td>
      <td>R$ ${valorPerda.toFixed(2)}</td>
      <td><button class="btn btn-sm btn-danger" onclick="removerProduto(${i})">🗑️</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function removerProduto(i) {
  listaProdutos.splice(i, 1);
  renderizarProdutos();
  calcularTotais();
}

function calcularTotais() {
  let totalVendida = 0, valorSistema = 0, perdaTotal = 0, assadoTotal = 0;

  listaProdutos.forEach(prod => {
    const info = produtosDisponiveis.find(p => p.nome === prod.nome) || { valorVenda: 0 };
    const vendido = prod.quantidade - prod.congelado - prod.assado - prod.perda;
    totalVendida += vendido;
    valorSistema += vendido * info.valorVenda;
    perdaTotal += prod.perda * info.valorVenda;
    assadoTotal += prod.assado * info.valorVenda;
  });

  const vendaPDV = parseFloat(document.getElementById('vendaPDV').value) || 0;
  const cmv = vendaPDV * percentualCMV;
  const custoEquipe = equipeAlocada.reduce((s, e) => s + (parseFloat(e.valor) || 0), 0);
  const custoLog = logisticaAlocada.reduce((s, l) => s + (parseFloat(l.valor) || 0), 0);
  const lucro = vendaPDV - cmv - custoEquipe - custoLog;
  const diferenca = vendaPDV - valorSistema;

  document.getElementById('totalVendida').textContent = totalVendida;
  document.getElementById('vendaSistema').textContent = valorSistema.toFixed(2);
  document.getElementById('diferencaVenda').textContent = diferenca.toFixed(2);
  document.getElementById('cmvCalculado').textContent = cmv.toFixed(2);
  document.getElementById('lucroFinal').textContent = lucro.toFixed(2);
  document.getElementById('custoPerda').textContent = perdaTotal.toFixed(2);
  document.getElementById('valorAssados').textContent = assadoTotal.toFixed(2);
  document.getElementById('custoEquipe').textContent = custoEquipe.toFixed(2);
  document.getElementById('custoLogistica').textContent = custoLog.toFixed(2);
  document.getElementById('potencialVenda').textContent = valorSistema.toFixed(2);
  document.getElementById('cmvReal').value = cmv.toFixed(2);
}

function salvarEvento(e) {
  e.preventDefault();

  const dados = {
    nomeEvento: document.getElementById('nomeEvento').value,
    data: document.getElementById('data').value,
    responsavel: document.getElementById('responsavel').value,
    status: document.getElementById('status').value,
    vendaPDV: parseFloat(document.getElementById('vendaPDV').value) || 0,
    estimativaVenda: parseFloat(document.getElementById('estimativaVenda').value) || 0,
    cmvReal: parseFloat(document.getElementById('cmvReal').value) || 0,
    equipe: equipeAlocada,
    logistica: logisticaAlocada,
    produtos: listaProdutos,
    lucroFinal: parseFloat(document.getElementById('lucroFinal').textContent) || 0,
    custoPerda: parseFloat(document.getElementById('custoPerda').textContent) || 0,
    diferencaVenda: parseFloat(document.getElementById('diferencaVenda').textContent) || 0,
    valorAssados: parseFloat(document.getElementById('valorAssados').textContent) || 0
  };

  const ref = eventoId ? db.ref('eventos/' + eventoId) : db.ref('eventos').push();
  ref.set(dados).then(() => alert('Evento salvo com sucesso!'));
}

window.onload = async () => {
  await carregarPercentualCMV();
  carregarClientes();
  carregarResponsaveis();
  carregarEquipeDisponivel();
  carregarLogisticaDisponivel();
  carregarProdutosDisponiveis();
  carregarEventoExistente();
  document.getElementById('formGestaoEvento').addEventListener('submit', salvarEvento);
};
