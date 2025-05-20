
// Configuração do Firebase
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
let equipeAlocada = [];
let logisticaAlocada = [];

async function carregarProdutos() {
  const snapshot = await db.ref('produtos').once('value');
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
}

async function carregarClientes() {
  const select = document.getElementById('nomeEvento');
  const snapshot = await db.ref('clientes').once('value');
  select.innerHTML = '<option value="">Selecione</option>';
  snapshot.forEach(child => {
    const cliente = child.val();
    if (cliente.status === 'Fechado' && cliente.clienteAtivo?.nomeEvento) {
      const opt = document.createElement('option');
      opt.value = cliente.clienteAtivo.nomeEvento;
      opt.textContent = cliente.clienteAtivo.nomeEvento;
      select.appendChild(opt);
    }
  });
}

async function carregarResponsaveis() {
  const select = document.getElementById('responsavel');
  const snapshot = await db.ref('equipe').once('value');
  select.innerHTML = '<option value="">Selecione</option>';
  snapshot.forEach(child => {
    const membro = child.val();
    const opt = document.createElement('option');
    opt.value = membro.apelido;
    opt.textContent = membro.apelido;
    select.appendChild(opt);
  });
}

function adicionarProduto() {
  listaProdutos.push({ produtoId: '', quantidade: 0, congelado: 0, assado: 0, perda: 0 });
  renderizarProdutos();
}

function removerProduto(index) {
  listaProdutos.splice(index, 1);
  renderizarProdutos();
  calcularTotais();
}

function renderizarProdutos() {
  const tabela = document.getElementById('tabelaProdutos');
  tabela.innerHTML = '';
  listaProdutos.forEach((item, index) => {
    const produto = produtosCadastrados.find(p => p.id === item.produtoId) || {};
    const vendida = Math.max(0, item.quantidade - item.congelado - item.assado - item.perda);
    const valorPerda = item.perda * (produto.custo || 0);
    const totalVenda = vendida * (produto.valorVenda || 0);

    const row = document.createElement('tr');
    row.innerHTML = \`
      <td>
        <select class="form-select form-select-sm produto-nome">
          \${produtosCadastrados.map(p => \`<option value="\${p.id}" \${p.id === item.produtoId ? 'selected' : ''}>\${p.nome}</option>\`).join('')}
        </select>
      </td>
      <td><input type="number" class="form-control form-control-sm produto-qtd" value="\${item.quantidade}"></td>
      <td><input type="number" class="form-control form-control-sm produto-congelado" value="\${item.congelado}"></td>
      <td><input type="number" class="form-control form-control-sm produto-assado" value="\${item.assado}"></td>
      <td><input type="number" class="form-control form-control-sm produto-perda" value="\${item.perda}"></td>
      <td><input type="text" class="form-control form-control-sm" disabled value="\${vendida}"></td>
      <td><input type="text" class="form-control form-control-sm" disabled value="R$ \${valorPerda.toFixed(2)}"></td>
      <td><input type="text" class="form-control form-control-sm" disabled value="R$ \${totalVenda.toFixed(2)}"></td>
      <td>
        <button class="btn btn-sm btn-outline-danger" onclick="removerProduto(\${index})">🗑️</button>
      </td>
    \`;
    tabela.appendChild(row);

    row.querySelector('.produto-nome').onchange = e => { item.produtoId = e.target.value; renderizarProdutos(); };
    row.querySelector('.produto-qtd').oninput = e => { item.quantidade = parseInt(e.target.value) || 0; calcularTotais(); };
    row.querySelector('.produto-congelado').oninput = e => { item.congelado = parseInt(e.target.value) || 0; calcularTotais(); };
    row.querySelector('.produto-assado').oninput = e => { item.assado = parseInt(e.target.value) || 0; calcularTotais(); };
    row.querySelector('.produto-perda').oninput = e => { item.perda = parseInt(e.target.value) || 0; calcularTotais(); };
  });
  calcularTotais();
}

function calcularTotais() {
  let totalVendida = 0, vendaSistema = 0, custoPerda = 0, valorAssados = 0, cmv = 0;

  listaProdutos.forEach(item => {
    const produto = produtosCadastrados.find(p => p.id === item.produtoId) || {};
    const vendida = Math.max(0, item.quantidade - item.congelado - item.assado - item.perda);
    totalVendida += vendida;
    vendaSistema += vendida * (produto.valorVenda || 0);
    custoPerda += item.perda * (produto.custo || 0);
    valorAssados += item.assado * (produto.custo || 0);
    cmv += vendida * (produto.custo || 0);
  });

  document.getElementById('totalVendida').innerText = totalVendida;
  document.getElementById('vendaSistema').innerText = vendaSistema.toFixed(2);
  document.getElementById('custoPerda').innerText = custoPerda.toFixed(2);
  document.getElementById('valorAssados').innerText = valorAssados.toFixed(2);
  document.getElementById('cmvCalculado').innerText = cmv.toFixed(2);

  const custoEquipe = equipeAlocada.reduce((s, e) => s + (e.valor || 0), 0);
  const custoLogistica = logisticaAlocada.reduce((s, l) => s + (l.valor || 0), 0);
  const vendaPDV = parseFloat(document.getElementById("vendaPDV").value) || 0;
  const estimativa = parseFloat(document.getElementById("estimativaVenda").value) || 0;
  const cmvReal = parseFloat(document.getElementById("cmvReal").value) || cmv;
  const lucro = vendaPDV - cmvReal - custoLogistica - custoEquipe - custoPerda;
  const diferenca = vendaPDV - vendaSistema;

  document.getElementById('custoEquipe').innerText = custoEquipe.toFixed(2);
  document.getElementById('custoLogistica').innerText = custoLogistica.toFixed(2);
  document.getElementById('lucroFinal').innerText = lucro.toFixed(2);
  document.getElementById('diferencaVenda').innerText = diferenca.toFixed(2);
}

document.getElementById('formEvento').addEventListener('submit', function(e) {
  e.preventDefault();
  const evento = {
    nomeEvento: document.getElementById('nomeEvento').value,
    data: document.getElementById('data').value,
    responsavel: document.getElementById('responsavel').value,
    estimativaVenda: parseFloat(document.getElementById('estimativaVenda').value) || 0,
    vendaPDV: parseFloat(document.getElementById('vendaPDV').value) || 0,
    cmvReal: parseFloat(document.getElementById('cmvReal').value) || 0,
    status: document.getElementById('status').value,
    produtos: listaProdutos,
    equipe: equipeAlocada,
    logistica: logisticaAlocada
  };
  const id = db.ref('eventos').push().key;
  db.ref('eventos/' + id).set(evento).then(() => alert('Evento salvo com sucesso!'));
});

window.onload = async function() {
  await carregarProdutos();
  await carregarClientes();
  await carregarResponsaveis();
};
