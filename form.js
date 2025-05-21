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

    listaProdutos = evento.produtos || [];
    renderizarProdutos();
  });
}

function renderizarProdutos() {
  const container = document.getElementById('produtosContainer');
  container.innerHTML = '';

  listaProdutos.forEach((item, index) => {
    const div = document.createElement('div');
    div.className = 'card p-2 mb-2';
    div.innerHTML = `
      <strong>${item.produtoId}</strong>
      <div>Quantidade Enviada: <input type="number" class="form-control" value="${item.quantidade}" disabled></div>
      <div>Congelado: <input type="number" class="form-control congelado" value="${item.congelado || 0}" data-index="${index}"></div>
      <div>Assado: <input type="number" class="form-control assado" value="${item.assado || 0}" data-index="${index}"></div>
      <div>Perdido: <input type="number" class="form-control perdido" value="${item.perda || 0}" data-index="${index}"></div>
    `;
    container.appendChild(div);
  });
}

function salvarRetorno() {
  document.querySelectorAll('.congelado').forEach(input => {
    const index = input.getAttribute('data-index');
    listaProdutos[index].congelado = parseInt(input.value) || 0;
  });
  document.querySelectorAll('.assado').forEach(input => {
    const index = input.getAttribute('data-index');
    listaProdutos[index].assado = parseInt(input.value) || 0;
  });
  document.querySelectorAll('.perdido').forEach(input => {
    const index = input.getAttribute('data-index');
    listaProdutos[index].perda = parseInt(input.value) || 0;
  });

  db.ref('eventos/' + eventoId + '/produtos').set(listaProdutos).then(() => {
    alert('Retorno salvo com sucesso!');
  });
}

function finalizarEvento() {
  if (!confirm('Após a Finalização não será permitido alteração. Deseja continuar?')) {
    return;
  }

  db.ref('eventos/' + eventoId + '/status').set('Finalizado').then(() => {
    alert('Evento finalizado com sucesso!');
  });
}

document.addEventListener('DOMContentLoaded', carregarEvento);
