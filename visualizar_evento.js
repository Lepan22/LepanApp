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

let eventoId = null;
let listaProdutos = [];
let produtosDisponiveis = [];

function carregarProdutosDisponiveis() {
  return db.ref('produtos').once('value').then(snapshot => {
    produtosDisponiveis = [];
    snapshot.forEach(child => {
      const produto = child.val();
      produtosDisponiveis.push({ id: child.key, nome: produto.nome });
    });
  });
}

function carregarEvento() {
  const params = new URLSearchParams(window.location.search);
  eventoId = params.get('id');
  if (!eventoId) {
    alert('ID do evento não encontrado.');
    return;
  }

  db.ref('eventos/' + eventoId).once('value').then(snapshot => {
    const evento = snapshot.val();
    if (!evento) {
      alert('Evento não encontrado.');
      return;
    }

    document.getElementById('nomeEvento').value = evento.nomeEvento || '';
    document.getElementById('data').value = evento.data || '';
    document.getElementById('responsavel').value = evento.responsavel || '';
    document.getElementById('status').value = evento.status || '';

    listaProdutos = evento.produtos || [];
    renderizarProdutos();
  });
}

function renderizarProdutos() {
  const container = document.getElementById('produtosContainer');
  container.innerHTML = '';

  listaProdutos.forEach(item => {
    const produto = produtosDisponiveis.find(p => p.id === item.produtoId);
    const nomeProduto = produto ? produto.nome : 'Produto não encontrado';

    const div = document.createElement('div');
    div.className = 'card p-2 mb-2';
    div.innerHTML = `
      <strong>${nomeProduto}</strong>
      <div>Quantidade Enviada: <input type="number" class="form-control" value="${item.quantidade}" disabled></div>
      <div>Congelado: <input type="number" class="form-control" value="${item.congelado || 0}" disabled></div>
      <div>Assado: <input type="number" class="form-control" value="${item.assado || 0}" disabled></div>
      <div>Perdido: <input type="number" class="form-control" value="${item.perda || 0}" disabled></div>
    `;
    container.appendChild(div);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  carregarProdutosDisponiveis().then(() => {
    carregarEvento();
  });
});
