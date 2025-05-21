let produtosDisponiveis = [];
let listaProdutos = [];

function carregarProdutosDisponiveis() {
  db.ref('produtos').once('value').then(snapshot => {
    produtosDisponiveis = [];
    snapshot.forEach(child => {
      const produto = child.val();
      produtosDisponiveis.push({ id: child.key, nome: produto.nome });
    });
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
