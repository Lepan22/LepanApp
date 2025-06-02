const db = firebase.database();
const tabela = document.querySelector("#clientesTable tbody");
const filtroInput = document.getElementById("filtroNome");
let listaClientes = [];

function carregarClientes() {
  db.ref('clientes').once('value').then(snapshot => {
    listaClientes = [];
    snapshot.forEach(child => {
      const cliente = child.val();
      cliente.id = child.key;
      listaClientes.push(cliente);
    });

    // Ordenar por nome
    listaClientes.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));

    exibirClientes(listaClientes);
  });
}

function exibirClientes(lista) {
  tabela.innerHTML = "";
  lista.forEach(cliente => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${cliente.nome || ""}</td>
      <td>${cliente.status || ""}</td>
      <td>${cliente.tipoCliente || ""}</td>
      <td>
        <button onclick="editarCliente('${cliente.id}')">Editar</button>
        <button onclick="excluirCliente('${cliente.id}')">Excluir</button>
      </td>
    `;
    tabela.appendChild(tr);
  });
}

filtroInput?.addEventListener("input", () => {
  const termo = filtroInput.value.toLowerCase();
  const filtrados = listaClientes.filter(c => (c.nome || "").toLowerCase().includes(termo));
  exibirClientes(filtrados);
});

window.onload = carregarClientes;
