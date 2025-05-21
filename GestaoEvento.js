const firebaseConfig = {
  apiKey: "AIzaSyBClDBA7f9-jfF6Nz6Ia-YlZ6G-hx3oerY",
  authDomain: "lepanapp.firebaseapp.com",
  databaseURL: "https://lepanapp-default-rtdb.firebaseio.com",
  projectId: "lepanapp",
  storageBucket: "lepanapp.firebasestorage.app",
  messagingSenderId: "542989944344",
  appId: "1:542989944344:web:576e28199960fd5440a56d"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

function carregarClientes() {
  const selectEvento = document.getElementById('nomeEvento');
  db.ref('clientes').once('value').then(snapshot => {
    selectEvento.innerHTML = '<option value="">Selecione</option>';
    snapshot.forEach(child => {
      const cliente = child.val();
      if (cliente.status === 'Fechado' && cliente.clienteAtivo?.nomeEvento) {
        const opt = document.createElement('option');
        opt.value = cliente.clienteAtivo.nomeEvento;
        opt.textContent = cliente.clienteAtivo.nomeEvento;
        selectEvento.appendChild(opt);
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

let equipeDisponivel = [];
let logisticaDisponivel = [];
let equipeAlocada = [];
let logisticaAlocada = [];

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
        <input type="number" class="form-control form-control-sm" placeholder="Valor" value="${item.valor}">
      </div>
    `;
    container.appendChild(div);

    div.querySelector('select').onchange = e => { item.membroId = e.target.value; };
    div.querySelector('input').oninput = e => { item.valor = parseFloat(e.target.value) || 0; };
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
        <input type="number" class="form-control form-control-sm" placeholder="Valor" value="${item.valor}">
      </div>
    `;
    container.appendChild(div);

    div.querySelector('select').onchange = e => { item.prestadorId = e.target.value; };
    div.querySelector('input').oninput = e => { item.valor = parseFloat(e.target.value) || 0; };
  });
}

document.addEventListener("DOMContentLoaded", () => {
  carregarClientes();
  carregarResponsaveis();
  carregarEquipeDisponivel();
  carregarLogisticaDisponivel();
});
