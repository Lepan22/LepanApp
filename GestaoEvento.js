const firebaseConfig = {
  apiKey: "AIzaSyBClDBA7f9-jfF6Nz6Ia-YlZ6G-hx3oerY",
  authDomain: "lepanapp.firebaseapp.com",
  databaseURL: "https://lepanapp-default-rtdb.firebaseio.com",
  projectId: "lepanapp"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let produtosDisponiveis = [];
let listaProdutos = [];
let mediasProdutos = {};

async function calcularMediasProdutos() {
  mediasProdutos = {};
  const snapshot = await db.ref('eventos').once('value');

  snapshot.forEach(eventoSnap => {
    const evento = eventoSnap.val();
    if (evento.status !== "Fechado") return;

    evento.produtos?.forEach(produto => {
      if (!mediasProdutos[produto.produtoId]) {
        mediasProdutos[produto.produtoId] = { total: 0, count: 0 };
      }
      const consumido = produto.quantidade - (produto.congelado || 0) - (produto.assado || 0) - (produto.perda || 0);
      mediasProdutos[produto.produtoId].total += consumido;
      mediasProdutos[produto.produtoId].count += 1;
    });
  });

  Object.keys(mediasProdutos).forEach(prodId => {
    const data = mediasProdutos[prodId];
    mediasProdutos[prodId] = (data.total / data.count).toFixed(1);
  });
}

function adicionarProduto() {
  listaProdutos.push({ produtoId: '', quantidade: 0, congelado: 0, assado: 0, perda: 0 });
  renderizarProdutos();
}

async function renderizarProdutos() {
  const tabela = document.getElementById('tabelaProdutos');
  tabela.innerHTML = '';

  for (let index = 0; index < listaProdutos.length; index++) {
    const item = listaProdutos[index];
    const produto = produtosDisponiveis.find(p => p.id === item.produtoId) || { nome: item.produtoId, valorVenda: 0, custo: 0 };
    const vendida = Math.max(0, item.quantidade - item.congelado - item.assado - item.perda);
    const valorVenda = vendida * produto.valorVenda;
    const valorPerda = item.perda * produto.custo;
    const media = mediasProdutos[item.produtoId] || '0.0';

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>
        <select class="form-select form-select-sm">
          ${produtosDisponiveis.map(p => `<option value="${p.id}" ${p.id === item.produtoId ? 'selected' : ''}>${p.nome}</option>`).join('')}
        </select>
      </td>
      <td><input type="number" class="form-control form-control-sm" value="${item.quantidade}"></td>
      <td><small>${media}</small></td>
      <td><input type="number" class="form-control form-control-sm" value="${item.congelado}"></td>
      <td><input type="number" class="form-control form-control-sm" value="${item.assado}"></td>
      <td><input type="number" class="form-control form-control-sm" value="${item.perda}"></td>
      <td><input type="text" class="form-control form-control-sm" value="${vendida}" disabled></td>
      <td><input type="text" class="form-control form-control-sm" value="R$ ${valorVenda.toFixed(2)}" disabled></td>
      <td><input type="text" class="form-control form-control-sm" value="R$ ${valorPerda.toFixed(2)}" disabled></td>
      <td><button class="btn btn-sm btn-outline-danger">🗑️</button></td>
    `;

    tabela.appendChild(row);

    const selects = row.querySelectorAll('select');
    selects[0].onchange = async e => {
      item.produtoId = e.target.value;
      await renderizarProdutos();
    };

    const inputs = row.querySelectorAll('input');
    inputs[0].onchange = e => { item.quantidade = parseInt(e.target.value) || 0; renderizarProdutos(); };
    inputs[1].onchange = e => { item.congelado = parseInt(e.target.value) || 0; renderizarProdutos(); };
    inputs[2].onchange = e => { item.assado = parseInt(e.target.value) || 0; renderizarProdutos(); };
    inputs[3].onchange = e => { item.perda = parseInt(e.target.value) || 0; renderizarProdutos(); };

    row.querySelector('button').onclick = () => { listaProdutos.splice(index, 1); renderizarProdutos(); };
  }
}

async function carregarProdutosDisponiveis() {
  const snapshot = await db.ref('produtos').once('value');
  produtosDisponiveis = [];
  snapshot.forEach(child => {
    const produto = child.val();
    produtosDisponiveis.push({ id: child.key, nome: produto.nome, valorVenda: produto.valorVenda || 0, custo: produto.custo || 0 });
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  await calcularMediasProdutos();
  await carregarProdutosDisponiveis();
  renderizarProdutos();
});
