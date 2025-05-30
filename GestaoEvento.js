// Firebase config (mantido conforme fornecido)
const firebaseConfig = {
  apiKey: "AIzaSyBClDBA7f9-jfF6Nz6Ia-YlZ6G-hx3oerY",
  authDomain: "lepanapp.firebaseapp.com",
  databaseURL: "https://lepanapp-default-rtdb.firebaseio.com",
  projectId: "lepanapp"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ...mesmas variáveis globais e funções carregamento...

function renderizarEquipe() {
  const container = document.getElementById('equipeContainer');
  container.innerHTML = '';
  equipeAlocada.forEach((item, i) => {
    const div = document.createElement('div');
    div.className = 'grupo-inline';
    div.innerHTML = \`
      <select class="form-select form-select-sm">${equipeDisponivel.map(m => `<option value="${m.id}" ${m.id === item.membroId ? 'selected' : ''}>${m.nome}</option>`).join('')}</select>
      <input type="number" class="form-control form-control-sm" placeholder="Valor" value="${item.valor}">
    \`;
    container.appendChild(div);
    div.querySelector('select').onchange = e => { item.membroId = e.target.value; calcularTotais(); };
    div.querySelector('input').oninput = e => { item.valor = parseFloat(e.target.value) || 0; calcularTotais(); };
  });
}

function renderizarLogistica() {
  const container = document.getElementById('logisticaContainer');
  container.innerHTML = '';
  logisticaAlocada.forEach((item, i) => {
    const div = document.createElement('div');
    div.className = 'grupo-inline';
    div.innerHTML = \`
      <select class="form-select form-select-sm">${logisticaDisponivel.map(l => `<option value="${l.id}" ${l.id === item.prestadorId ? 'selected' : ''}>${l.nome}</option>`).join('')}</select>
      <input type="number" class="form-control form-control-sm" placeholder="Valor" value="${item.valor}">
    \`;
    container.appendChild(div);
    div.querySelector('select').onchange = e => { item.prestadorId = e.target.value; calcularTotais(); };
    div.querySelector('input').oninput = e => { item.valor = parseFloat(e.target.value) || 0; calcularTotais(); };
  });
}

// ...demais funções mantidas conforme original...

// Função final
document.addEventListener("DOMContentLoaded", () => {
  carregarPercentualCMV().then(() => {
    carregarClientes();
    carregarResponsaveis();
    carregarEquipeDisponivel();
    carregarLogisticaDisponivel();
    carregarProdutosDisponiveis();
    carregarEventoExistente();
  });
});
