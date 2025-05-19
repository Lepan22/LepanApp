import { db } from "./firebase-config.js";
import {
  ref,
  push,
  set,
  remove,
  onValue
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

const form = document.getElementById('formProduto');
const tabela = document.querySelector('#tabelaProdutos tbody');
const btnImportar = document.getElementById('btnImportar');
const btnAddEmbalagem = document.getElementById('btnAddEmbalagem');
const embalagemContainer = document.getElementById('embalagemContainer');

// Cria input oculto para upload de planilha
const inputFile = document.createElement('input');
inputFile.type = 'file';
inputFile.accept = '.xlsx, .xls';
inputFile.style.display = 'none';
document.body.appendChild(inputFile);

btnAddEmbalagem.addEventListener('click', () => {
  const group = document.createElement('div');
  group.className = 'row g-2 align-items-end mb-2 embalagem-item';

  group.innerHTML = `
    <div class="col">
      <label class="form-label">Tipo</label>
      <input type="text" class="form-control embalagem-tipo" placeholder="Ex: Saco">
    </div>
    <div class="col">
      <label class="form-label">Quantidade</label>
      <input type="number" class="form-control embalagem-qtd" placeholder="Ex: 35">
    </div>
    <div class="col-auto">
      <button type="button" class="btn btn-danger btn-remove-embalagem">×</button>
    </div>
  `;

  group.querySelector('.btn-remove-embalagem').addEventListener('click', () => group.remove());
  embalagemContainer.appendChild(group);
});

form.addEventListener('submit', (e) => {
  e.preventDefault();

  const id = document.getElementById('produtoId').value || push(ref(db, 'produtos')).key;

  const embalagens = Array.from(document.querySelectorAll('.embalagem-item')).map(item => ({
    tipo: item.querySelector('.embalagem-tipo').value,
    quantidade: parseInt(item.querySelector('.embalagem-qtd').value)
  }));

  const produto = {
    nome: document.getElementById('nome').value,
    categoria: document.getElementById('categoria').value,
    valorVenda: parseFloat(document.getElementById('valorVenda').value),
    custo: parseFloat(document.getElementById('custo').value),
    quantidadePorCaixa: parseInt(document.getElementById('quantidadePorCaixa').value),
    quantidade: parseInt(document.getElementById('quantidade').value),
    embalagens
  };

  set(ref(db, 'produtos/' + id), produto)
    .then(() => {
      form.reset();
      embalagemContainer.innerHTML = '';
    })
    .catch((error) => {
      alert('Erro ao salvar produto: ' + error.message);
    });
});

function carregarProdutos() {
  const produtosRef = ref(db, 'produtos');
  onValue(produtosRef, (snapshot) => {
    tabela.innerHTML = '';
    snapshot.forEach((child) => {
      const id = child.key;
      const p = child.val();

      const embalagensStr = (p.embalagens || []).map(e => `${e.tipo} (${e.quantidade})`).join(', ');

      const row = `<tr>
        <td>${p.nome}</td>
        <td>R$ ${p.valorVenda?.toFixed(2)}</td>
        <td>R$ ${p.custo?.toFixed(2)}</td>
        <td>${embalagensStr}</td>
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
    document.getElementById('quantidade').value = p.quantidade;

    embalagemContainer.innerHTML = '';
    (p.embalagens || []).forEach(e => {
      const group = document.createElement('div');
      group.className = 'row g-2 align-items-end mb-2 embalagem-item';
      group.innerHTML = `
        <div class="col">
          <label class="form-label">Tipo</label>
          <input type="text" class="form-control embalagem-tipo" value="${e.tipo}">
        </div>
        <div class="col">
          <label class="form-label">Quantidade</label>
          <input type="number" class="form-control embalagem-qtd" value="${e.quantidade}">
        </div>
        <div class="col-auto">
          <button type="button" class="btn btn-danger btn-remove-embalagem">×</button>
        </div>
      `;
      group.querySelector('.btn-remove-embalagem').addEventListener('click', () => group.remove());
      embalagemContainer.appendChild(group);
    });
  }, { onlyOnce: true });
};

window.excluirProduto = (id) => {
  if (confirm('Deseja realmente excluir este produto?')) {
    remove(ref(db, 'produtos/' + id));
  }
};

carregarProdutos();

btnImportar.addEventListener('click', () => {
  inputFile.click();
});

inputFile.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    rows.forEach((row) => {
      const id = push(ref(db, 'produtos')).key;
      const produto = {
        nome: row.Nome || '',
        categoria: row.Categoria || '',
        valorVenda: parseFloat(row.ValorVenda || 0),
        custo: parseFloat(row.Custo || 0),
        quantidadePorCaixa: parseInt(row.QtdCaixa || 0),
        quantidade: parseInt(row.Quantidade || 0),
        embalagens: [] // adaptar no futuro se quiser importar embalagens também
      };
      set(ref(db, 'produtos/' + id), produto);
    });
  };
  reader.readAsArrayBuffer(file);
});
