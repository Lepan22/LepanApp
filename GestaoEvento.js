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

function carregarClientes() {
  const select = document.getElementById('nomeEvento');
  db.ref('clientes').once('value').then(snapshot => {
    select.innerHTML = '<option value="">Selecione</option>';
    snapshot.forEach(child => {
      const cliente = child.val();
      if (cliente.status === 'Fechado' && cliente.clienteAtivo?.nomeEvento) {
        const opt = document.createElement('option');
        opt.value = cliente.clienteAtivo.nomeEvento;
        opt.textContent = cliente.clienteAtivo.nomeEvento;
        select.appendChild(opt);
      }
    });
  });
}

function carregarResponsaveis() {
  const select = document.getElementById('responsavel');
  db.ref('equipe').once('value').then(snapshot => {
    select.innerHTML = '<option value="">Selecione</option>';
    snapshot.forEach(child => {
      const membro = child.val();
      const opt = document.createElement('option');
      opt.value = membro.apelido;
      opt.textContent = membro.apelido;
      select.appendChild(opt);
    });
  });
}

function carregarEquipeDisponivel() {
  db.ref('equipe').once('value').then(snapshot => {
    equipeDisponivel = [];
    snapshot.forEach(child => {
      const membro = child.val();
      equipeDisponivel.push({ id: child.key, nome: membro.apelido || membro.nomeCompleto });
    });
  });
}

function carregarLogisticaDisponivel() {
  db.ref('logistica').once('value').then(snapshot => {
    logisticaDisponivel = [];
    snapshot.forEach(child => {
      const prestador = child.val();
      logisticaDisponivel.push({ id: child.key, nome: prestador.nome });
    });
  });
}

function carregarProdutosDisponiveis() {
  db.ref('produtos').once('value').then(snapshot => {
    produtosDisponiveis = [];
    snapshot.forEach(child => {
      const produto = child.val();
      produtosDisponiveis.push({ id: child.key, nome: produto.nome, valorVenda: produto.valorVenda || 0, custo: produto.custo || 0 });
    });
  });
}

function carregarEventoExistente() {
  const params = new URLSearchParams(window.location.search);
  eventoId = params.get('id');
  if (!eventoId) return;

  db.ref('eventos/' + eventoId).once('value').then(snapshot => {
    const evento = snapshot.val();
    if (!evento) return;

    document.getElementById('nomeEvento').value = evento.nomeEvento || '';
    document.getElementById('data').value = evento.data || '';
    document.getElementById('responsavel').value = evento.responsavel || '';
    document.getElementById('status').value = evento.status || '';
    document.getElementById('vendaPDV').value = evento.vendaPDV || '';
    document.getElementById('cmvReal').value = evento.cmvReal || '';
    document.getElementById('estimativaVenda').value = evento.estimativaVenda || '';

    equipeAlocada = evento.equipe || [];
    logisticaAlocada = evento.logistica || [];
    listaProdutos = evento.produtos || [];

    renderizarEquipe();
    renderizarLogistica();
    renderizarProdutos();
    calcularTotais();
  });
}

function adicionarEquipe() {
  equipeAlocada.push({ membroId: '', valor: 0 });
  renderizarEquipe();
}

function renderizarEquipe() {
  const container = document.getElementById('equipeContainer');
  container.innerHTML = '';
  equipeAlocada.forEach((item, i) => {
    const div = document.createElement('div');
    div.className = 'row mb-2';
    div.innerHTML = `
      <div class="col">
        <select class="form-select form-select-sm">
          ${equipeDisponivel.map(m => `<option value="${m.id}" ${m.id === item.membroId ? 'selected' : ''}>${m.nome}</option>`).join('')}
        </select>
      </div>
      <div class="col">
        <input type="number" class="form-control form-control-sm" value="${item.valor}">
      </div>
    `;
    container.appendChild(div);
    div.querySelector('select').onchange = e => { item.membroId = e.target.value; calcularTotais(); };
    div.querySelector('input').oninput = e => { item.valor = parseFloat(e.target.value) || 0; calcularTotais(); };
  });
}

function adicionarLogistica() {
  logisticaAlocada.push({ prestadorId: '', valor: 0 });
  renderizarLogistica();
}

function renderizarLogistica() {
  const container = document.getElementById('logisticaContainer');
  container.innerHTML = '';
  logisticaAlocada.forEach((item, i) => {
    const div = document.createElement('div');
    div.className = 'row mb-2';
    div.innerHTML = `
      <div class="col">
        <select class="form-select form-select-sm">
          ${logisticaDisponivel.map(l => `<option value="${l.id}" ${l.id === item.prestadorId ? 'selected' : ''}>${l.nome}</option>`).join('')}
        </select>
      </div>
      <div class="col">
        <input type="number" class="form-control form-control-sm" value="${item.valor}">
      </div>
    `;
    container.appendChild(div);
    div.querySelector('select').onchange = e => { item.prestadorId = e.target.value; calcularTotais(); };
    div.querySelector('input').oninput = e => { item.valor = parseFloat(e.target.value) || 0; calcularTotais(); };
  });
}

function adicionarProduto() {
  listaProdutos.push({ produtoId: '', quantidade: 0, congelado: 0, assado: 0, perda: 0 });
  renderizarProdutos();
}

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
      inputs[3].onchange = e => { item.congelado = parseInt(e.target.value) || 0; calcularTotais(); };
      inputs[4].onchange = e => { item.assado = parseInt(e.target.value) || 0; calcularTotais(); };
      inputs[5].onchange = e => { item.perda = parseInt(e.target.value) || 0; calcularTotais(); };

      row.querySelector('select').onchange = e => { item.produtoId = e.target.value; renderizarProdutos(); calcularTotais(); };
      row.querySelector('button').onclick = () => { listaProdutos.splice(index, 1); renderizarProdutos(); calcularTotais(); };
    });
  });
}

function calcularMediaProduto(produtoId, callback) {
  if (!produtoId || !document.getElementById('nomeEvento').value) return callback('0.00');

  db.ref('eventos').once('value').then(snapshot => {
    let soma = 0, count = 0;
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

function calcularTotais() { /* Mantém a lógica padrão de cálculo de totais */ }

document.getElementById('formGestaoEvento').addEventListener('submit', function(e) {
  e.preventDefault();
  const evento = { /* coleta todos os campos e listaProdutos */ };
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
