const firebaseConfig = {
  apiKey: "AIzaSyBClDBA7f9-jfF6Nz6Ia-YlZ6G-hx3oerY",
  authDomain: "lepanapp.firebaseapp.com",
  databaseURL: "https://lepanapp-default-rtdb.firebaseio.com",
  projectId: "lepanapp",
  storageBucket: "lepanapp.appspot.com",
  messagingSenderId: "542989944344",
  appId: "1:542989944344:web:576e28199960fd5440a56d"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let equipeDisponivel = [], logisticaDisponivel = [], produtosDisponiveis = [];
let equipeAlocada = [], logisticaAlocada = [], listaProdutos = [];
let eventoId = null;

function carregarClientes() { /* ... */ }
function carregarResponsaveis() { /* ... */ }
function carregarEquipeDisponivel() { /* ... */ }
function carregarLogisticaDisponivel() { /* ... */ }
function carregarProdutosDisponiveis() { /* ... */ }
function carregarEventoExistente() { /* ... */ }
function adicionarEquipe() { /* ... */ }
function renderizarEquipe() { /* ... */ }
function adicionarLogistica() { /* ... */ }
function renderizarLogistica() { /* ... */ }
function adicionarProduto() { listaProdutos.push({ produtoId: '', quantidade: 0, congelado: 0, assado: 0, perda: 0 }); renderizarProdutos(); }

function renderizarProdutos() {
  const tabela = document.getElementById('tabelaProdutos');
  tabela.innerHTML = '';

  listaProdutos.forEach((item, index) => {
    const produto = produtosDisponiveis.find(p => p.id === item.produtoId) || { valorVenda: 0, custo: 0 };
    const vendida = Math.max(0, item.quantidade - item.congelado - item.assado - item.perda);
    const valorVenda = vendida * produto.valorVenda;
    const valorPerda = item.perda * produto.custo;

    calcularMediaProduto(item.produtoId, media => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><select class="form-select form-select-sm">${produtosDisponiveis.map(p => `<option value="${p.id}" ${p.id === item.produtoId ? 'selected' : ''}>${p.nome}</option>`).join('')}</select></td>
        <td><input type="number" class="form-control form-control-sm" value="${item.quantidade}"></td>
        <td><input type="text" class="form-control form-control-sm" value="${media}" disabled></td>
        <td><input type="number" class="form-control form-control-sm" value="${item.congelado}"></td>
        <td><input type="number" class="form-control form-control-sm" value="${item.assado}"></td>
        <td><input type="number" class="form-control form-control-sm" value="${item.perda}"></td>
        <td><input type="text" class="form-control form-control-sm" value="${vendida}" disabled></td>
        <td><input type="text" class="form-control form-control-sm" value="R$ ${valorVenda.toFixed(2)}" disabled></td>
        <td><input type="text" class="form-control form-control-sm" value="R$ ${valorPerda.toFixed(2)}" disabled></td>
        <td><button class="btn btn-sm btn-outline-danger">🗑️</button></td>
      `;
      tabela.appendChild(row);

      const inputs = row.querySelectorAll('input');

      inputs[0].onchange = e => { item.quantidade = parseInt(e.target.value) || 0; calcularTotais(); };
      inputs[2].onchange = e => { item.congelado = parseInt(e.target.value) || 0; calcularTotais(); };
      inputs[3].onchange = e => { item.assado = parseInt(e.target.value) || 0; calcularTotais(); };
      inputs[4].onchange = e => { item.perda = parseInt(e.target.value) || 0; calcularTotais(); };

      row.querySelector('select').onchange = e => { item.produtoId = e.target.value; renderizarProdutos(); calcularTotais(); };

      row.querySelector('button').onclick = () => { listaProdutos.splice(index, 1); renderizarProdutos(); calcularTotais(); };
    });
  });
}

function calcularMediaProduto(produtoId, callback) {
  if (!produtoId || !document.getElementById('nomeEvento').value) {
    return callback('0.00');
  }

  db.ref('eventos').once('value').then(snapshot => {
    let soma = 0;
    let count = 0;
    snapshot.forEach(child => {
      const evento = child.val();
      if (eventoId && child.key === eventoId) return;
      if (evento.nomeEvento !== document.getElementById('nomeEvento').value) return;
      if (evento.produtos) {
        const prod = evento.produtos.find(p => p.produtoId === produtoId);
        if (prod) {
          const vendida = Math.max(0, prod.quantidade - prod.congelado - prod.assado - prod.perda);
          soma += vendida;
          count++;
        }
      }
    });
    const media = count > 0 ? (soma / count).toFixed(2) : '0.00';
    callback(media);
  });
}

function calcularTotais() { /* ... mesma lógica que já ajustamos ... */ }

document.getElementById('formGestaoEvento').addEventListener('submit', function(e) {
  e.preventDefault();
  const evento = { /* ... coleta dos dados ... */ };
  const id = eventoId || db.ref('eventos').push().key;
  db.ref('eventos/' + id).set(evento).then(() => {
    alert('Evento salvo com sucesso!');
    window.location.href = "eventos.html";
  });
});

document.addEventListener("DOMContentLoaded", () => {
  carregarClientes();
  carregarResponsaveis();
  carregarEquipeDisponivel();
  carregarLogisticaDisponivel();
  carregarProdutosDisponiveis();
  carregarEventoExistente();
});
