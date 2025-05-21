
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

async function carregarClientes() {
  const select = document.getElementById('nomeEvento');
  const snapshot = await db.ref('clientes').once('value');
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
}

window.onload = async function() {
  await carregarClientes();
};
