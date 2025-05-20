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

const form = document.getElementById("formCliente");
const tabela = document.getElementById("tabelaClientes");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const id = document.getElementById("clienteId").value || db.ref().child("clientes").push().key;
  const cliente = {
    nome: document.getElementById("nome").value,
    detalhe: document.getElementById("detalhe").value,
    observacoes: document.getElementById("observacoes").value
  };
  db.ref("clientes/" + id).set(cliente).then(() => {
    form.reset();
    carregarClientes();
  });
});

function carregarClientes() {
  db.ref("clientes").on("value", (snapshot) => {
    tabela.innerHTML = "";
    snapshot.forEach((child) => {
      const c = child.val();
      const id = child.key;
      const row = `<tr>
        <td>${c.nome}</td>
        <td>${c.detalhe}</td>
        <td>
          <button class="btn btn-warning btn-sm" onclick="editarCliente('${id}')">Editar</button>
          <button class="btn btn-danger btn-sm" onclick="excluirCliente('${id}')">Excluir</button>
        </td>
      </tr>`;
      tabela.innerHTML += row;
    });
  });
}

window.editarCliente = (id) => {
  db.ref("clientes/" + id).once("value").then(snapshot => {
    const c = snapshot.val();
    document.getElementById("clienteId").value = id;
    document.getElementById("nome").value = c.nome;
    document.getElementById("detalhe").value = c.detalhe;
    document.getElementById("observacoes").value = c.observacoes;
  });
};

window.excluirCliente = (id) => {
  if (confirm("Deseja excluir este cliente?")) {
    db.ref("clientes/" + id).remove();
  }
};

carregarClientes();
