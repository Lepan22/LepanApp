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

function carregarEventos() {
  db.ref('eventos').once('value').then(snapshot => {
    const tabela = document.getElementById('tabelaEventos');
    tabela.innerHTML = '';

    snapshot.forEach(child => {
      const evento = child.val();
      const id = child.key;

      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${evento.nomeEvento || '-'}</td>
        <td>${evento.data || '-'}</td>
        <td>${evento.status || '-'}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary" onclick="editarEvento('${id}')">Editar</button>
        </td>
      `;

      tabela.appendChild(row);
    });
  });
}

function editarEvento(id) {
  window.location.href = `GestaoEvento.html?id=${id}`;
}

document.addEventListener('DOMContentLoaded', carregarEventos);
