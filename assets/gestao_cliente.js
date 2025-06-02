const firebaseConfig = {
  apiKey: "AIzaSyBClDBA7f9-jfF6Nz6Ia-YlZ6G-hx3oerY",
  authDomain: "lepanapp.firebaseapp.com",
  databaseURL: "https://lepanapp-default-rtdb.firebaseio.com",
  projectId: "lepanapp"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database().ref("clientes");

function aplicarFiltros(lista) {
  const nomeFiltro = document.getElementById("filtroNome").value.toLowerCase();
  const statusFiltro = document.getElementById("filtroStatus").value;
  const statusEventoFiltro = document.getElementById("filtroStatusEvento").value;

  return lista.filter(c => {
    const nomeOk = !nomeFiltro || (c.nome || "").toLowerCase().includes(nomeFiltro);
    const statusOk = statusFiltro === "TODOS" || (c.status === statusFiltro);
    const evento = c.clienteAtivo?.statusEvento || "";
    const statusEventoOk = statusEventoFiltro === "TODOS" || evento === statusEventoFiltro;
    return nomeOk && statusOk && statusEventoOk;
  });
}

function renderizarTabela(clientes) {
  const tabela = document.querySelector("#clientesTable tbody");
  tabela.innerHTML = "";

  if (!clientes.length) {
    tabela.innerHTML = `<tr><td colspan="4">Nenhum cliente encontrado.</td></tr>`;
    return;
  }

  clientes.forEach(cliente => {
    const tr = document.createElement("tr");

    const tdNome = document.createElement("td");
    tdNome.textContent = cliente.nome || "-";

    const tdStatus = document.createElement("td");
    tdStatus.textContent = cliente.status || "-";

    const tdEvento = document.createElement("td");
    tdEvento.textContent = cliente.clienteAtivo?.statusEvento || "-";

    const tdAcoes = document.createElement("td");
    const btnEditar = document.createElement("button");
    btnEditar.textContent = "Editar";
    btnEditar.onclick = () => {
      window.location.href = `clientes.html?id=${cliente.id}`;
    };
    tdAcoes.appendChild(btnEditar);

    const btnExcluir = document.createElement("button");
    btnExcluir.textContent = "Excluir";
    btnExcluir.onclick = () => excluirCliente(cliente.id);
    tdAcoes.appendChild(btnExcluir);

    tr.appendChild(tdNome);
    tr.appendChild(tdStatus);
    tr.appendChild(tdEvento);
    tr.appendChild(tdAcoes);
    tabela.appendChild(tr);
  });
}

function carregarClientes() {
  db.once("value").then(snapshot => {
    const lista = [];
    snapshot.forEach(child => {
      const val = child.val();
      val.id = child.key;
      lista.push(val);
    });

    const filtrados = aplicarFiltros(lista);
    renderizarTabela(filtrados);
  });
}

function excluirCliente(id) {
  if (confirm("Deseja excluir este cliente?")) {
    db.child(id).remove().then(carregarClientes);
  }
}

document.getElementById("filtroNome").addEventListener("input", carregarClientes);
document.getElementById("filtroStatus").addEventListener("change", carregarClientes);
document.getElementById("filtroStatusEvento").addEventListener("change", carregarClientes);

document.addEventListener("DOMContentLoaded", carregarClientes);
