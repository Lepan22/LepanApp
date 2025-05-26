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

    listaProdutos = evento.produtos || [];

    const status = evento.status || 'Aberto';
    if (status !== 'Aberto') {
      desabilitarFormulario();
    }

    renderizarProdutos();
  });
}

function renderizarProdutos() {
  const container = document.getElementById('produtosContainer');
  container.innerHTML = '';

  listaProdutos.forEach((item, index) => {
    const produto = produtosDisponiveis.find(p => p.id === item.produtoId);
    const nomeProduto = produto ? produto.nome : 'Produto não encontrado';

    const div = document.createElement('div');
    div.className = 'card p-2 mb-2';
    div.innerHTML = `
      <strong>${nomeProduto}</strong>
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

  // 1. Atualiza os dados preenchidos
  salvarRetorno();

  // 2. Atualiza status
  db.ref('eventos/' + eventoId + '/status').set('Finalizado')
    .then(() => {
      // 3. Faz o backup completo
      db.ref('eventos/' + eventoId).once('value')
        .then(snapshot => {
          const eventoCompleto = snapshot.val();
          return db.ref('historico_eventos_finalizados/' + eventoId).set(eventoCompleto);
        })
        .then(() => {
          alert('Evento finalizado e backup salvo com sucesso!');
          desabilitarFormulario();
        })
        .catch(err => {
          console.error('Erro ao salvar backup:', err);
          alert('Evento finalizado, mas falha ao salvar backup!');
        });
    })
    .catch(err => {
      console.error('Erro ao finalizar evento:', err);
      alert('Erro ao finalizar evento!');
    });
}

function desabilitarFormulario() {
  document.querySelectorAll('input').forEach(input => input.disabled = true);
  document.querySelectorAll('button').forEach(button => button.disabled = true);
}

document.addEventListener('DOMContentLoaded', () => {
  carregarProdutosDisponiveis().then(() => {
    carregarEvento();
  });
});
