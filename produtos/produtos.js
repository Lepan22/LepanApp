const db = firebase.database();
const produtosRef = db.ref('produtos');

let editandoId = null;

// Salvar produto
function salvarProduto() {
  const nome = document.getElementById('nome').value;
  const categoria = document.getElementById('categoria').value;
  const valorVenda = parseFloat(document.getElementById('valorVenda').value);
  const custo = parseFloat(document.getElementById('custo').value);

  // Embalagens
  const embalagens = [];
  const linhas = document.querySelectorAll('.linha-embalagem');
  linhas.forEach(linha => {
    const tipo = linha.querySelector('.tipoEmbalagem').value;
    const quantidade = parseInt(linha.querySelector('.quantidadeEmbalagem').value);
    if (tipo && quantidade) {
      embalagens.push({ tipo, quantidade });
    }
  });

  const produto = { nome, categoria, valorVenda, custo, embalagens };

  if (editandoId) {
    produtosRef.child(editandoId).set(produto);
    editandoId = null;
  } else {
    produtosRef.push(produto);
  }

  document.getElementById('formProduto').reset();
  document.getElementById('embalagensContainer').innerHTML = '';
}

// Adicionar campo de embalagem
function adicionarEmbalagem() {
  const container = document.getElementById('embalagensContainer');
  const div = document.createElement('div');
  div.classList.add('linha-embalagem');
  div.innerHTML = `
    <input type="text" class="tipoEmbalagem" placeholder="Tipo de embalagem" />
    <input type="number" class="quantidadeEmbalagem" placeholder="Qtd por embalagem" />
    <button type="button" onclick="this.parentNode.remove()">🗑️</button>
  `;
  container.appendChild(div);
}

// Listar produtos
function listarProdutos() {
  produtosRef.on('value', snapshot => {
    const lista = document.getElementById('listaProdutos');
    lista.innerHTML = '';

    snapshot.forEach(child => {
      const produto = child.val();
      const id = child.key;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${produto.nome}</td>
        <td>${produto.categoria}</td>
        <td>R$ ${produto.valorVenda.toFixed(2)}</td>
        <td>R$ ${produto.custo.toFixed(2)}</td>
        <td>
          <button onclick="editarProduto('${id}')">✏️</button>
          <button onclick="excluirProduto('${id}')">🗑️</button>
        </td>
      `;
      lista.appendChild(tr);
    });
  });
}

// Editar produto
function editarProduto(id) {
  produtosRef.child(id).once('value', snapshot => {
    const produto = snapshot.val();
    document.getElementById('nome').value = produto.nome;
    document.getElementById('categoria').value = produto.categoria;
    document.getElementById('valorVenda').value = produto.valorVenda;
    document.getElementById('custo').value = produto.custo;

    // Limpa embalagens anteriores
    document.getElementById('embalagensContainer').innerHTML = '';

    if (produto.embalagens) {
      produto.embalagens.forEach(e => {
        const container = document.getElementById('embalagensContainer');
        const div = document.createElement('div');
        div.classList.add('linha-embalagem');
        div.innerHTML = `
          <input type="text" class="tipoEmbalagem" placeholder="Tipo de embalagem" value="${e.tipo}" />
          <input type="number" class="quantidadeEmbalagem" placeholder="Qtd por embalagem" value="${e.quantidade}" />
          <button type="button" onclick="this.parentNode.remove()">🗑️</button>
        `;
        container.appendChild(div);
      });
    }

    editandoId = id;
  });
}

// Excluir produto
function excluirProduto(id) {
  if (confirm('Tem certeza que deseja excluir este produto?')) {
    produtosRef.child(id).remove();
  }
}

// Inicialização
window.onload = function () {
  listarProdutos();
  document.getElementById('btnSalvar').addEventListener('click', salvarProduto);
  document.getElementById('btnAddEmbalagem').addEventListener('click', adicionarEmbalagem);
};
