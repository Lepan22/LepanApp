// Firebase Config
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

let produtosCadastrados = [];
let listaProdutos = [];

const selectEvento = document.getElementById('nomeEvento');
const selectResponsavel = document.getElementById('responsavel');
const containerProdutos = document.getElementById('produtosContainer');
const tabelaProdutos = document.getElementById('tabelaProdutos');

function carregarProdutos() {
  db.ref('produtos').once('value').then(snapshot => {
    produtosCadastrados = [];
    snapshot.forEach(child => {
      const p = child.val();
      produtosCadastrados.push({
        id: child.key,
        nome: p.nome,
        valorVenda: parseFloat(p.valorVenda || 0),
        custo: parseFloat(p.custo || 0)
      });
    });
  });
}

function carregarResponsaveis() {
  db.ref('equipe').once('value').then(snapshot => {
    selectResponsavel.innerHTML = '<option value="">Selecione</option>';
    snapshot.forEach(child => {
      const membro = child.val();
      const opt = document.createElement('option');
      opt.value = membro.apelido;
      opt.textContent = membro.apelido;
      selectResponsavel.appendChild(opt);
    });
  });
}

function carregarClientes() {
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

function adicionarProduto(prod = {}) {
  listaProdutos.push({
    produtoId: prod.produtoId || '',
    quantidade: prod.quantidade || 0,
    estimativa: prod.estimativa || 0,
    congelado: prod.congelado || 0,
    assado: prod.assado || 0,
    perda: prod.perda || 0,
    observacao: prod.observacao || ''
  });
  renderizarProdutos();
}

function renderizarProdutos() {
  tabelaProdutos.innerHTML = '';
  listaProdutos.forEach((item, index) => {
    const produto = produtosCadastrados.find(p => p.id === item.produtoId) || {};
    const valorVenda = produto.valorVenda || 0;
    const custo = produto.custo || 0;
    const potencial = (item.quantidade || 0) * valorVenda;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>
        <select class="form-select form-select-sm produto-nome">${produtosCadastrados.map(p => `<option value="${p.id}" ${p.id === item.produtoId ? 'selected' : ''}>${p.nome}</option>`).join('')}</select>
      </td>
      <td><input type="number" class="form-control form-control-sm produto-qtd" value="${item.quantidade}"></td>
      <td>R$ ${valorVenda.toFixed(2)}</td>
      <td>R$ ${custo.toFixed(2)}</td>
      <td>R$ ${potencial.toFixed(2)}</td>
      <td><input type="number" class="form-control form-control-sm produto-estimativa" value="${item.estimativa}"></td>
      <td class="d-flex gap-1">
        <button class="btn btn-sm btn-outline-secondary" onclick="moverProduto(${index}, -1)">🔼</button>
        <button class="btn btn-sm btn-outline-secondary" onclick="moverProduto(${index}, 1)">🔽</button>
      </td>
    `;
    const linha2 = document.createElement('tr');
    linha2.innerHTML = `
      <td colspan="7">
        <div class="row g-1">
          <div class="col"><input type="number" class="form-control form-control-sm produto-congelado" placeholder="Congelado" value="${item.congelado}"></div>
          <div class="col"><input type="number" class="form-control form-control-sm produto-assado" placeholder="Assado" value="${item.assado}"></div>
          <div class="col"><input type="number" class="form-control form-control-sm produto-perda" placeholder="Perda" value="${item.perda}"></div>
          <div class="col"><input type="text" class="form-control form-control-sm produto-obs" placeholder="Observação" value="${item.observacao}"></div>
        </div>
      </td>
    `;

    tabelaProdutos.appendChild(row);
    tabelaProdutos.appendChild(linha2);

    // eventos
    row.querySelector('.produto-nome').onchange = e => {
      item.produtoId = e.target.value;
      renderizarProdutos();
    };
    row.querySelector('.produto-qtd').oninput = e => item.quantidade = parseInt(e.target.value) || 0;
    row.querySelector('.produto-estimativa').oninput = e => item.estimativa = parseFloat(e.target.value) || 0;
    linha2.querySelector('.produto-congelado').oninput = e => item.congelado = parseInt(e.target.value) || 0;
    linha2.querySelector('.produto-assado').oninput = e => item.assado = parseInt(e.target.value) || 0;
    linha2.querySelector('.produto-perda').oninput = e => item.perda = parseInt(e.target.value) || 0;
    linha2.querySelector('.produto-obs').oninput = e => item.observacao = e.target.value;
  });
}

function moverProduto(index, direcao) {
  const novoIndex = index + direcao;
  if (novoIndex >= 0 && novoIndex < listaProdutos.length) {
    [listaProdutos[index], listaProdutos[novoIndex]] = [listaProdutos[novoIndex], listaProdutos[index]];
    renderizarProdutos();
  }
}

document.getElementById('formEvento').addEventListener('submit', function(e) {
  e.preventDefault();

  const evento = {
    nomeEvento: document.getElementById('nomeEvento').value,
    data: document.getElementById('data').value,
    responsavel: document.getElementById('responsavel').value,
    vendaPDV: parseFloat(document.getElementById('vendaPDV').value) || 0,
    cmvReal: parseFloat(document.getElementById('cmvReal').value) || 0,
    status: document.getElementById('status').value,
    observacoes: document.getElementById('observacoes').value,
    produtos: listaProdutos
  };

  const id = document.getElementById('eventoId').value || db.ref('eventos').push().key;
  db.ref('eventos/' + id).set(evento).then(() => {
    alert("Evento salvo com sucesso!");
  });
});

function duplicarEvento() {
  alert("Função de duplicar evento será implementada.");
}

carregarProdutos();
carregarResponsaveis();
carregarClientes();

let equipeAlocada = [];
let logisticaAlocada = [];

function carregarEquipeDisponivel() {
  db.ref('equipe').once('value').then(snapshot => {
    equipeAlocada = [];
    const equipeSelect = document.createElement('select');
    snapshot.forEach(child => {
      const membro = child.val();
      const opt = document.createElement('option');
      opt.value = child.key;
      opt.textContent = membro.apelido || membro.nomeCompleto;
      equipeSelect.appendChild(opt);
    });
    window.equipeSelectOptions = equipeSelect.innerHTML;
  });
}

function carregarLogisticaDisponivel() {
  db.ref('logistica').once('value').then(snapshot => {
    logisticaAlocada = [];
    const logisticaSelect = document.createElement('select');
    snapshot.forEach(child => {
      const p = child.val();
      const opt = document.createElement('option');
      opt.value = child.key;
      opt.textContent = p.nome;
      logisticaSelect.appendChild(opt);
    });
    window.logisticaSelectOptions = logisticaSelect.innerHTML;
  });
}

function adicionarEquipe(id = '', valor = 0) {
  equipeAlocada.push({ membroId: id, valor });
  renderizarEquipe();
}

function adicionarLogistica(id = '', valor = 0) {
  logisticaAlocada.push({ prestadorId: id, valor });
  renderizarLogistica();
}

function renderizarEquipe() {
  const container = document.getElementById('equipeContainer');
  container.innerHTML = '';
  equipeAlocada.forEach((item, i) => {
    const div = document.createElement('div');
    div.className = 'row mb-2';
    div.innerHTML = `
      <div class="col-md-6">
        <select class="form-select form-select-sm membro-select">${window.equipeSelectOptions}</select>
      </div>
      <div class="col-md-4">
        <input type="number" class="form-control form-control-sm membro-valor" placeholder="Valor acordado" value="${item.valor}">
      </div>
      <div class="col-md-2 d-grid">
        <button class="btn btn-sm btn-danger" onclick="removerEquipe(${i})">Remover</button>
      </div>
    `;
    container.appendChild(div);
    div.querySelector('.membro-select').value = item.membroId;
    div.querySelector('.membro-select').onchange = e => item.membroId = e.target.value;
    div.querySelector('.membro-valor').oninput = e => item.valor = parseFloat(e.target.value) || 0;
  });
}

function removerEquipe(i) {
  equipeAlocada.splice(i, 1);
  renderizarEquipe();
}

function renderizarLogistica() {
  const container = document.getElementById('logisticaContainer');
  container.innerHTML = '';
  logisticaAlocada.forEach((item, i) => {
    const div = document.createElement('div');
    div.className = 'row mb-2';
    div.innerHTML = `
      <div class="col-md-6">
        <select class="form-select form-select-sm prestador-select">${window.logisticaSelectOptions}</select>
      </div>
      <div class="col-md-4">
        <input type="number" class="form-control form-control-sm prestador-valor" placeholder="Valor acordado" value="${item.valor}">
      </div>
      <div class="col-md-2 d-grid">
        <button class="btn btn-sm btn-danger" onclick="removerLogistica(${i})">Remover</button>
      </div>
    `;
    container.appendChild(div);
    div.querySelector('.prestador-select').value = item.prestadorId;
    div.querySelector('.prestador-select').onchange = e => item.prestadorId = e.target.value;
    div.querySelector('.prestador-valor').oninput = e => item.valor = parseFloat(e.target.value) || 0;
  });
}

function removerLogistica(i) {
  logisticaAlocada.splice(i, 1);
  renderizarLogistica();
}

// Adicionando dados ao evento para salvar
document.getElementById('formEvento').addEventListener('submit', function(e) {
  e.preventDefault();

  const evento = {
    nomeEvento: document.getElementById('nomeEvento').value,
    data: document.getElementById('data').value,
    responsavel: document.getElementById('responsavel').value,
    vendaPDV: parseFloat(document.getElementById('vendaPDV').value) || 0,
    cmvReal: parseFloat(document.getElementById('cmvReal').value) || 0,
    status: document.getElementById('status').value,
    observacoes: document.getElementById('observacoes').value,
    produtos: listaProdutos,
    equipe: equipeAlocada,
    logistica: logisticaAlocada
  };

  const id = document.getElementById('eventoId').value || db.ref('eventos').push().key;
  db.ref('eventos/' + id).set(evento).then(() => {
    alert("Evento salvo com sucesso!");
  });
});

// Carregamento inicial
carregarProdutos();
carregarResponsaveis();
carregarClientes();
carregarEquipeDisponivel();
carregarLogisticaDisponivel();
