// assets/produto.js

import { db } from "./firebase-config.js";
import {
  ref,
  push,
  set,
  update,
  remove,
  onValue
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

const form = document.getElementById('formProduto');
const tabela = document.querySelector('#tabelaProdutos tbody');
const btnImportar = document.getElementById('btnImportar');

form.addEventListener('submit', (e) => {
  e.preventDefault();

  const id = document.getElementById('produtoId').value || push(ref(db, 'produtos')).key;
  const produto = {
    nome: document.getElementById('nome').value,
    categoria: document.getElementById('categoria').value,
    valorVenda: parseFloat(document.getElementById('valorVenda').value),
    custo: parseFloat(document.getElementById('custo').value),
    quantidadePorCaixa: parseInt(document.getElementById('quantidadePorCaixa').value),
    tipoEmbalagem1: document.getElementById('tipoEmbalagem1').value,
    tipoEmbalagem2: document.getElementById('tipoEmbalagem2').value,
    tipo: document.getElementById('tipo').value,
    quantidade: parseInt(document.getElementById('quantidade').value)
  };

  set(ref(db, 'produtos/' + id), produto).then(() => form.reset());
});

function carregarProdutos() {
  const produtosRef = ref(db, 'produtos');
  onValue(produtosRef, (snapshot) => {
    tabela.innerHTML = '';
    snapshot.forEach((child) => {
      const id = child.key;
      const p = child.val();
      const row = `<tr>
        <td>${p.nome}</td>
        <td>${p.categoria}</td>
        <td>R$ ${p.valorVenda?.toFixed(2)}</td>
        <td>R$ ${p.custo?.toFixed(2)}</td>
        <td>${p.quantidadePorCaixa}</td>
        <td>${p.tipoEmbalagem1 || ''}</td>
        <td>${p.tipoEmbalagem2 || ''}</td>
        <td>${p.tipo}</td>
        <td>${p.quantidade}</td>
        <td>
          <button class="btn btn-sm btn-warning" onclick="editarProduto('${id}')">Editar</button>
          <button class="btn btn-sm btn-danger" onclick="excluirProduto('${id}')">Excluir</button>
        </td>
      </tr>`;
      tabela.insertAdjacentHTML('beforeend', row);
    });
  });
}

window.editarProduto = (id) => {
  const produtoRef = ref(db, 'produtos/' + id);
  onValue(produtoRef, (snapshot) => {
    const p = snapshot.val();
    document.getElementById('produtoId').value = id;
    document.getElementById('nome').value = p.nome;
    document.getElementById('categoria').value = p.categoria;
    document.getElementById('valorVenda').value = p.valorVenda;
    document.getElementById('custo').value = p.custo;
    document.getElementById('quantidadePorCaixa').value = p.quantidadePorCaixa;
    document.getElementById('tipoEmbalagem1').value = p.tipoEmbalagem1;
    document.getElementById('tipoEmbalagem2').value = p.tipoEmbalagem2;
    document.getElementById('tipo').value = p.tipo;
    document.getElementById('quantidade').value = p.quantidade;
  }, { onlyOnce: true });
};

window.excluirProduto = (id) => {
  if (confirm('Deseja realmente excluir este produto?')) {
    remove(ref(db, 'produtos/' + id));
  }
};

carregarProdutos();

btnImportar.addEventListener('click', () => {
  alert('Importação de dados ainda não implementada. Planeje usar planilhas .xlsx no futuro.');
});
