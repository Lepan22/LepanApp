const firebaseConfig = {
  apiKey: "AIzaSyBClDBA7f9-jfF6Nz6Ia-YlZ6G-hx3oerY",
  authDomain: "lepanapp.firebaseapp.com",
  databaseURL: "https://lepanapp-default-rtdb.firebaseio.com",
  projectId: "lepanapp"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const eventoSelect = document.getElementById("eventoSelect");
const tabelaProdutos = document.getElementById("tabelaProdutos").getElementsByTagName("tbody")[0];
const totalCalculadoEl = document.getElementById("totalCalculado");
const totalRealEl = document.getElementById("totalReal");
const totalDiferencaEl = document.getElementById("totalDiferenca");

let produtosDB = {};
let eventoSelecionado = null;

function formatar(valor) {
  return `R$ ${valor.toFixed(2).replace('.', ',')}`;
}

function carregarProdutos() {
  return db.ref('produtos').once('value').then(snapshot => {
    produtosDB = {};
    snapshot.forEach(child => {
      produtosDB[child.key] = child.val();
    });
  });
}

function carregarEventos() {
  db.ref('eventos').once('value').then(snapshot => {
    eventoSelect.innerHTML = '<option value="">Selecione</option>';
    snapshot.forEach(child => {
      const evento = child.val();
      const nome = `${evento.nomeEvento} - ${evento.data || 'sem data'}`;
      const option = document.createElement("option");
      option.value = child.key;
      option.textContent = nome;
      eventoSelect.appendChild(option);
    });
  });
}

eventoSelect.addEventListener('change', () => {
  const id = eventoSelect.value;
  if (!id) return;
  carregarProdutos().then(() => exibirProdutosDoEvento(id));
});

function exibirProdutosDoEvento(idEvento) {
  db.ref(`eventos/${idEvento}`).once('value').then(snapshot => {
    const evento = snapshot.val();
    eventoSelecionado = evento;
    tabelaProdutos.innerHTML = '';
    let totalCalculado = 0;
    let totalReal = 0;

    if (!evento.produtos || Object.keys(evento.produtos).length === 0) {
      tabelaProdutos.innerHTML = `<tr><td colspan="7">Nenhum produto encontrado para este evento.</td></tr>`;
      return;
    }

    Object.entries(evento.produtos).forEach(([produtoId, info]) => {
      const produto = produtosDB[produtoId];
      if (!produto) return;

      const valorUnitario = parseFloat(produto.valorVenda || 0);
      const enviado = parseFloat(info.quantidade || 0);
      const congelado = parseFloat(info.congelado || 0);
      const assado = parseFloat(info.assado || 0);
      const perda = parseFloat(info.perda || 0);

      const quantidadeVendida = enviado - congelado - assado - perda;
      const valorCalculado = quantidadeVendida * valorUnitario;

      const tr = document.createElement("tr");

      const tdNome = document.createElement("td");
      tdNome.textContent = produto.nome;
      tr.appendChild(tdNome);

      const tdQtdVendida = document.createElement("td");
      tdQtdVendida.textContent = quantidadeVendida;
      tr.appendChild(tdQtdVendida);

      const tdUnitario = document.createElement("td");
      tdUnitario.textContent = formatar(valorUnitario);
      tr.appendChild(tdUnitario);

      const tdQtdReal = document.createElement("td");
      const inputReal = document.createElement("input");
      inputReal.type = "number";
      inputReal.min = 0;
      inputReal.step = 1;
      inputReal.value = quantidadeVendida;
      tdQtdReal.appendChild(inputReal);
      tr.appendChild(tdQtdReal);

      const tdValorCalculado = document.createElement("td");
      tdValorCalculado.textContent = formatar(valorCalculado);
      tr.appendChild(tdValorCalculado);

      const tdValorReal = document.createElement("td");
      const tdDiferenca = document.createElement("td");
      tr.appendChild(tdValorReal);
      tr.appendChild(tdDiferenca);

      function atualizarValores() {
        const qtdReal = parseFloat(inputReal.value) || 0;
        const valorReal = qtdReal * valorUnitario;
        const diferenca = valorReal - valorCalculado;
        tdValorReal.textContent = formatar(valorReal);
        tdDiferenca.textContent = formatar(diferenca);
        recalcularTotais();
      }

      inputReal.addEventListener('input', atualizarValores);

      tr.dataset.valorUnitario = valorUnitario;
      tr.dataset.valorCalculado = valorCalculado;
      tr.dataset.inputId = produtoId;

      tabelaProdutos.appendChild(tr);
      atualizarValores(); // Inicializa valores
    });
  });
}

function recalcularTotais() {
  let totalCalc = 0, totalReal = 0;
  Array.from(tabelaProdutos.children).forEach(tr => {
    const valorUnitario = parseFloat(tr.dataset.valorUnitario || 0);
    const valorCalculado = parseFloat(tr.dataset.valorCalculado || 0);
    const input = tr.querySelector("input");
    const qtdReal = parseFloat(input.value) || 0;
    const valorReal = qtdReal * valorUnitario;

    totalCalc += valorCalculado;
    totalReal += valorReal;
  });

  totalCalculadoEl.textContent = formatar(totalCalc);
  totalRealEl.textContent = formatar(totalReal);
  totalDiferencaEl.textContent = formatar(totalReal - totalCalc);
}

carregarEventos();
