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
let equipeAlocada = [];
let logisticaAlocada = [];

// Carregar dados iniciais
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
  const selectResponsavel = document.getElementById('responsavel');
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

// Produto
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
  renderizarProdutos(); calcularTotais();
}

function renderizarProdutos() {
  const tabela = document.getElementById('tabelaProdutos');
  tabela.innerHTML = '';
  listaProdutos.forEach((item, index) => {
    const produto = produtosCadastrados.find(p => p.id === item.produtoId) || {};
    const valorVenda = produto.valorVenda || 0;
    const custo = produto.custo || 0;
    const potencial = (item.quantidade || 0) * valorVenda;

    const row = document.createElement('tr');
    
    const row = document.createElement('tr');
    const vendida = Math.max(0, item.quantidade - item.congelado - item.assado - item.perda);
    const valorVenda = produto.valorVenda || 0;
    const custo = produto.custo || 0;
    const valorPerda = item.perda * custo;
    const totalVenda = vendida * valorVenda;

    row.innerHTML = `
      <td>
        <select class="form-select form-select-sm produto-nome">${produtosCadastrados.map(p => `<option value="${p.id}" ${p.id === item.produtoId ? 'selected' : ''}>${p.nome}</option>`).join('')}</select>
      </td>
      <td><input type="number" class="form-control form-control-sm produto-qtd" value="${item.quantidade}"></td>
      <td><input type="number" class="form-control form-control-sm produto-congelado" value="${item.congelado}"></td>
      <td><input type="number" class="form-control form-control-sm produto-assado" value="${item.assado}"></td>
      <td><input type="number" class="form-control form-control-sm produto-perda" value="${item.perda}"></td>
      <td><input type="text" class="form-control form-control-sm" disabled value="${vendida}"></td>
      <td><input type="text" class="form-control form-control-sm" disabled value="R$ ${valorPerda.toFixed(2)}"></td>
      <td><input type="text" class="form-control form-control-sm" disabled value="R$ ${totalVenda.toFixed(2)}"></td>
      <td class="d-flex gap-1">
        <button class="btn btn-sm btn-outline-secondary" onclick="moverProduto(${index}, -1)">🔼</button>
        <button class="btn btn-sm btn-outline-secondary" onclick="moverProduto(${index}, 1)">🔽</button>
      </td>
    `;

    const linha2 = document.createElement('tr');
    
        linha2.innerHTML = `
          <td colspan="7">
            <div class="row g-1">
              <div class="col"><label class="form-label form-label-sm">Congelado</label><input type="number" class="form-control form-control-sm produto-congelado" value="${item.congelado}"></div>
              <div class="col"><label class="form-label form-label-sm">Assado</label><input type="number" class="form-control form-control-sm produto-assado" value="${item.assado}"></div>
              <div class="col"><label class="form-label form-label-sm">Perda</label><input type="number" class="form-control form-control-sm produto-perda" value="${item.perda}"></div>
              <div class="col"><label class="form-label form-label-sm">Observação</label><input type="text" class="form-control form-control-sm produto-obs" value="${item.observacao}"></div>
              <div class="col"><label class="form-label form-label-sm">Vendidos</label><input type="text" class="form-control form-control-sm" disabled value="${Math.max(0, item.quantidade - item.congelado - item.assado - item.perda)}"></div>
            </div>
          </td>
        `;
        

    tabela.appendChild(row);
    tabela.appendChild(linha2);

    row.querySelector('.produto-nome').onchange = e => { item.produtoId = e.target.value; renderizarProdutos(); calcularTotais(); };
    row.querySelector('.produto-qtd').oninput = e => { item.quantidade = parseInt(e.target.value) || 0; calcularTotais(); };
        linha2.querySelector('.produto-congelado').oninput = e => { item.congelado = parseInt(e.target.value) || 0; calcularTotais(); };
    linha2.querySelector('.produto-assado').oninput = e => { item.assado = parseInt(e.target.value) || 0; calcularTotais(); };
    linha2.querySelector('.produto-perda').oninput = e => { item.perda = parseInt(e.target.value) || 0; calcularTotais(); };
    linha2.querySelector('.produto-obs').oninput = e => item.observacao = e.target.value;
  });
}

function moverProduto(index, direcao) {
  const novoIndex = index + direcao;
  if (novoIndex >= 0 && novoIndex < listaProdutos.length) {
    [listaProdutos[index], listaProdutos[novoIndex]] = [listaProdutos[novoIndex], listaProdutos[index]];
    renderizarProdutos(); calcularTotais();
  }
}

// Equipe e Logística
function carregarEquipeDisponivel() {
  db.ref('equipe').once('value').then(snapshot => {
    const s = document.createElement('select');
    snapshot.forEach(child => {
      const p = child.val();
      const opt = document.createElement('option');
      opt.value = child.key;
      opt.textContent = p.apelido || p.nomeCompleto;
      s.appendChild(opt);
    });
    window.equipeOptions = s.innerHTML;
  });
}
function carregarLogisticaDisponivel() {
  db.ref('logistica').once('value').then(snapshot => {
    const s = document.createElement('select');
    snapshot.forEach(child => {
      const p = child.val();
      const opt = document.createElement('option');
      opt.value = child.key;
      opt.textContent = p.nome;
      s.appendChild(opt);
    });
    window.logisticaOptions = s.innerHTML;
  });
}
function adicionarEquipe() {
  equipeAlocada.push({ membroId: '', valor: 0 });
  renderizarEquipe();
}
function adicionarLogistica() {
  logisticaAlocada.push({ prestadorId: '', valor: 0 });
  renderizarLogistica();
}
function renderizarEquipe() {
  const container = document.getElementById('equipeContainer');
  container.innerHTML = '';
  equipeAlocada.forEach((item, i) => {
    const div = document.createElement('div');
    div.className = 'row mb-2';
    div.innerHTML = `
      <div class="col-md-6"><select class="form-select form-select-sm">${window.equipeOptions}</select></div>
      <div class="col-md-4"><input type="number" class="form-control form-control-sm" value="${item.valor}"></div>
      <div class="col-md-2 d-grid"><button class="btn btn-sm btn-danger" onclick="removerEquipe(${i})">Remover</button></div>
    `;
    div.querySelector('select').value = item.membroId;
    div.querySelector('select').onchange = e => item.membroId = e.target.value;
    div.querySelector('input').oninput = e => item.valor = parseFloat(e.target.value) || 0;
    container.appendChild(div);
  });
}
function renderizarLogistica() {
  const container = document.getElementById('logisticaContainer');
  container.innerHTML = '';
  logisticaAlocada.forEach((item, i) => {
    const div = document.createElement('div');
    div.className = 'row mb-2';
    div.innerHTML = `
      <div class="col-md-6"><select class="form-select form-select-sm">${window.logisticaOptions}</select></div>
      <div class="col-md-4"><input type="number" class="form-control form-control-sm" value="${item.valor}"></div>
      <div class="col-md-2 d-grid"><button class="btn btn-sm btn-danger" onclick="removerLogistica(${i})">Remover</button></div>
    `;
    div.querySelector('select').value = item.prestadorId;
    div.querySelector('select').onchange = e => item.prestadorId = e.target.value;
    div.querySelector('input').oninput = e => item.valor = parseFloat(e.target.value) || 0;
    container.appendChild(div);
  });
}
function removerEquipe(i) { equipeAlocada.splice(i, 1); renderizarEquipe(); }
function removerLogistica(i) { logisticaAlocada.splice(i, 1); renderizarLogistica(); }

// Salvar evento
let salvando = false;
document.getElementById('formEvento').addEventListener('submit', function(e) {
  e.preventDefault();
  if (salvando) return;
  salvando = true;

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
    salvando = false;
  }).catch(err => {
    console.error("Erro ao salvar:", err);
    salvando = false;
  });
});

// Inicializar tudo
carregarProdutos();
carregarResponsaveis();
carregarClientes();
carregarEquipeDisponivel();
carregarLogisticaDisponivel();



function calcularTotais() {
  let totalVendida = 0;
  let vendaSistema = 0;
  let custoPerda = 0;
  let valorAssados = 0;
  let cmv = 0;

  listaProdutos.forEach(item => {
    const produto = produtosCadastrados.find(p => p.id === item.produtoId) || {};
    const qtd = item.quantidade || 0;
    const congelado = item.congelado || 0;
    const assado = item.assado || 0;
    const perda = item.perda || 0;
    const valorVenda = produto.valorVenda || 0;
    const custo = produto.custo || 0;

    const vendida = Math.max(0, qtd - congelado - assado - perda);
    totalVendida += vendida;
    vendaSistema += vendida * valorVenda;
    custoPerda += perda * custo;
    valorAssados += assado * custo;
    cmv += vendida * custo;
  });

  const custoEquipe = equipeAlocada.reduce((s, e) => s + (e.valor || 0), 0);
  const custoLogistica = logisticaAlocada.reduce((s, l) => s + (l.valor || 0), 0);
  const vendaPDV = parseFloat(document.getElementById("vendaPDV").value) || 0;
  const estimativa = parseFloat(document.getElementById("estimativaVenda").value) || 0;
  const cmvReal = parseFloat(document.getElementById("cmvReal").value) || cmv;
  const lucro = vendaPDV - cmvReal - custoLogistica - custoEquipe - custoPerda;
  const diferenca = vendaPDV - vendaSistema;

  document.getElementById("totalVendida").innerText = totalVendida;
  document.getElementById("vendaSistema").innerText = vendaSistema.toFixed(2);
  document.getElementById("custoPerda").innerText = custoPerda.toFixed(2);
  document.getElementById("valorAssados").innerText = valorAssados.toFixed(2);
  document.getElementById("cmvCalculado").innerText = cmv.toFixed(2);
  document.getElementById("custoEquipe").innerText = custoEquipe.toFixed(2);
  document.getElementById("custoLogistica").innerText = custoLogistica.toFixed(2);
  document.getElementById("lucroFinal").innerText = lucro.toFixed(2);
  document.getElementById("diferencaVenda").innerText = diferenca.toFixed(2);
}



['vendaPDV', 'cmvReal', 'estimativaVenda'].forEach(id => {
  document.getElementById(id).addEventListener('input', calcularTotais);
});



window.adicionarProduto = adicionarProduto;
window.adicionarEquipe = adicionarEquipe;
window.adicionarLogistica = adicionarLogistica;
window.removerEquipe = removerEquipe;
window.removerLogistica = removerLogistica;

document.addEventListener("DOMContentLoaded", () => {
  carregarProdutos();
  carregarResponsaveis();
  carregarClientes();
  carregarEquipeDisponivel();
  carregarLogisticaDisponivel();
});
