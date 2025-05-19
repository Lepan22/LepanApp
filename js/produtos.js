import { database, ref, push } from "./firebase-init.js";

document.getElementById('produtoForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const nome = document.getElementById('nome').value;
  const categoria = document.getElementById('categoria').value;
  const tipo = document.getElementById('tipo').value;

  const embalagensElements = document.querySelectorAll('.embalagem');
  const embalagens = Array.from(embalagensElements).map(e => ({
    tipoEmbalagem: e.querySelector('.tipoEmbalagem').value,
    quantidadePorEmbalagem: parseInt(e.querySelector('.quantidadePorEmbalagem').value),
    valorVenda: parseFloat(e.querySelector('.valorVenda').value),
    custo: parseFloat(e.querySelector('.custo').value)
  }));

  const novoProduto = {
    nome,
    categoria,
    tipo,
    embalagens
  };

  try {
    await push(ref(database, 'produtos'), novoProduto);
    alert("Produto salvo com sucesso!");
    document.getElementById('produtoForm').reset();
  } catch (error) {
    alert("Erro ao salvar produto: " + error.message);
  }
});

window.addEmbalagem = function () {
  const container = document.getElementById('embalagensContainer');
  const nova = document.createElement('div');
  nova.classList.add('embalagem');
  nova.innerHTML = `
    <input type="text" placeholder="Tipo de Embalagem" class="tipoEmbalagem">
    <input type="number" placeholder="Quantidade" class="quantidadePorEmbalagem">
    <input type="number" placeholder="Valor Venda" class="valorVenda">
    <input type="number" placeholder="Custo" class="custo">
  `;
  container.appendChild(nova);
};
