// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBClDBA7f9-jfF6Nz6Ia-YlZ6G-hx3oerY",
  authDomain: "lepanapp.firebaseapp.com",
  databaseURL: "https://lepanapp-default-rtdb.firebaseio.com",
  projectId: "lepanapp"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database().ref("clientes");

// Listar clientes
db.on("value", snapshot => {
  const tabela = document.querySelector("#clientesTable tbody");
  tabela.innerHTML = "";

  if (!snapshot.exists()) {
    tabela.innerHTML = `<tr><td colspan="4">Nenhum cliente encontrado.</td></tr>`;
    return;
  }

  snapshot.forEach(child => {
    const c = child.val();
    const id = child.key;

    const tr = document.createElement("tr");

    const tdNome = document.createElement("td");
    tdNome.textContent = c.nome || "-";

    const tdStatus = document.createElement("td");
    tdStatus.textContent = c.status || "-";

    const tdTipo = document.createElement("td");
    tdTipo.textContent = c.tipoCliente || "-";

    const tdAcoes = document.createElement("td");

    const btnEditar = document.createElement("button");
    btnEditar.textContent = "Editar";
    btnEditar.onclick = () => {
      window.location.href = `clientes.html?id=${id}`;
    };

    const btnExcluir = document.createElement("button");
    btnExcluir.textContent = "Excluir";
    btnExcluir.onclick = () => excluirCliente(id);

    tdAcoes.appendChild(btnEditar);
    tdAcoes.appendChild(btnExcluir);

    tr.appendChild(tdNome);
    tr.appendChild(tdStatus);
    tr.appendChild(tdTipo);
    tr.appendChild(tdAcoes);
    tabela.appendChild(tr);
  });
});

// Excluir cliente
function excluirCliente(id) {
  if (confirm("Deseja excluir este cliente?")) {
    db.child(id).remove();
  }
}
