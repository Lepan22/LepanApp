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

let equipeDisponivel = [];
let logisticaDisponivel = [];
let produtosDisponiveis = [];

let equipeAlocada = [];
let logisticaAlocada = [];
let listaProdutos = [];

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

async function carregarEquipeDisponivel() {
  const btn = document.getElementById('btnEquipe');
  btn.disabled = true;
  equipeDisponivel = [];
  const snapshot = await db.ref('equipe').once('value');
  snapshot.forEach(child => {
    const membro = child.val();
    equipeDisponivel.push({ id: child.key, nome: membro.apelido || membro.nomeCompleto });
  });
  btn.disabled = false;
}

async function carregarLogisticaDisponivel() {
  const btn = document.getElementById('btnLogistica');
  btn.disabled = true;
  logisticaDisponivel = [];
  const snapshot = await db.ref('logistica').once('value');
  snapshot.forEach(child => {
    const prestador = child.val();
    logisticaDisponivel.push({ id: child.key, nome: prestador.nome });
  });
  btn.disabled = false;
}

function carregarProdutosDisponiveis() {
  db.ref('produtos').once('value').then(snapshot => {
    produtosDisponiveis = [];
    snapshot.forEach(child => {
      const produto = child.val();
      produtosDisponiveis.push({ id: child.key, nome: produto.nome });
    });
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
      <div class="col">
        <select class="form-select form-select-sm">
          ${equipeDisponivel.map(m => `<option value="${m.id}" ${m.id === item.membroId ? 'selected' : ''}>${m.nome}</option>`).join('')}
        </select>
      </div>
      <div class="col">
        <input type="number" class="form-control form-control-sm" placeholder="Valor" value="${item.valor}">
      </div>
    `;
    container.appendChild(div);

    div.querySelector('select').onchange = e => { item.membroId = e.target.value; };
    div.querySelector('input').oninput = e => { item.valor = parseFloat(e.target.value) || 0; };
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
      <div class="col">
        <select class="form-select form-select-sm">
          ${logisticaDisponivel.map(l => `<option value="${l.id}" ${l.id === item.prestadorId ? 'selected' : ''}>${l.nome}</option>`).join('')}
        </select>
      </div>
      <div class="col">
        <input type="number" class="form-control form-control-sm" placeholder="Valor" value="${item.valor}">
      </div>
    `;
    container.appendChild(div);

    div.querySelector('select').onchange = e => { item.prestadorId = e.target.value; };
    div.querySelector('input').oninput = e => { item.valor = parseFloat(e.target.value) || 0; };
  });
}

function adicionarProduto() {
  listaProdutos.push({ produtoId: '', quantidade: 0 });
  renderizarProdutos();
}

function renderizarProdutos() {
  const tabela = document.getElementById('tabelaProdutos');
  tabela.innerHTML = '';
  listaProdutos.forEach((item, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>
        <select class="form-select form-select-sm">
          ${produtosDisponiveis.map(p => `<option value="${p.id}" ${p.id === item.produtoId ? 'selected' : ''}>${p.nome}</option>`).join('')}
        </select>
      </td>
      <td>
        <input type="number" class="form-control form-control-sm" value="${item.quantidade}">
      </td>
      <td>
        <button class="btn btn-sm btn-outline-danger">🗑️</button>
      </td>
    `;
    tabela.appendChild(row);

    row.querySelector('select').onchange = e => { item.produtoId = e.target.value; };
    row.querySelector('input').oninput = e => { item.quantidade = parseInt(e.target.value) || 0; };
    row.querySelector('button').onclick = () => { listaProdutos.splice(index, 1); renderizarProdutos(); };
  });
}

document.addEventListener("DOMContentLoaded", () => {
  carregarClientes();
  carregarResponsaveis();
  carregarEquipeDisponivel();
  carregarLogisticaDisponivel();
  carregarProdutosDisponiveis();
});
