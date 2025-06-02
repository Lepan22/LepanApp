const firebaseConfig = {
  apiKey: "AIzaSyBClDBA7f9-jfF6Nz6Ia-YlZ6G-hx3oerY",
  authDomain: "lepanapp.firebaseapp.com",
  databaseURL: "https://lepanapp-default-rtdb.firebaseio.com",
  projectId: "lepanapp"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const tabela = document.querySelector("#clientesTable tbody");
const filtroInput = document.getElementById("filtroNome");
let clientes = [];

function carregarClientes() {
  db.ref("clientes").once("value").then(snapshot => {
    clientes = [];
    snapshot.forEach(child => {
      const cliente = child.val();
      cliente.id = child.key;
      clientes.push(cliente);
    });

    // Ordenar por nome
    clientes.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));

    exibirClientes(clientes);
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

function editarCliente(id) {
  db.ref("clientes/" + id).once("value").then(snapshot => {
    const cliente = snapshot.val();
    document.getElementById("nome").value = cliente.nome || "";
    document.getElementById("dataCadastro").value = cliente.dataCadastro || "";
    document.getElementById("tipoCliente").value = cliente.tipoCliente || "";
    document.getElementById("indicadoPor").value = cliente.indicadoPor || "";
    document.getElementById("perfilEconomico").value = cliente.perfilEconomico || "";
    document.getElementById("tamanho").value = cliente.tamanho || "";
    document.getElementById("endereco").value = cliente.endereco || "";
    document.getElementById("regiao").value = cliente.regiao || "";
    document.getElementById("ultimoContato").value = cliente.ultimoContato || "";
    document.getElementById("observacoes").value = cliente.observacoes || "";
    document.getElementById("status").value = cliente.status || "Aberto";

    if (cliente.status === "Fechado") {
      toggleClienteAtivo(true);
      document.getElementById("nomeEvento").value = cliente.nomeEvento || "";
      document.getElementById("frequencia").value = cliente.frequencia || "";
      document.getElementById("dataPrimeiroEvento").value = cliente.dataPrimeiroEvento || "";
      document.getElementById("statusEvento").value = cliente.statusEvento || "";
      document.getElementById("obsEvento").value = cliente.obsEvento || "";

      const dias = cliente.diasSemana || [];
      document.getElementById("seg").checked = dias.includes("Seg");
      document.getElementById("ter").checked = dias.includes("Ter");
      document.getElementById("qua").checked = dias.includes("Qua");
      document.getElementById("qui").checked = dias.includes("Qui");
      document.getElementById("sex").checked = dias.includes("Sex");
      document.getElementById("sab").checked = dias.includes("Sab");
      document.getElementById("dom").checked = dias.includes("Dom");
    } else {
      toggleClienteAtivo(false);
    }

    document.getElementById("clienteForm").dataset.id = id;
  });
}

function excluirCliente(id) {
  if (confirm("Deseja excluir este cliente?")) {
    db.ref("clientes/" + id).remove().then(() => {
      carregarClientes();
    });
  }
}

function toggleClienteAtivo(forceShow = null) {
  const status = document.getElementById("status").value;
  const divAtivos = document.getElementById("clientesAtivos");
  if (forceShow !== null) {
    divAtivos.style.display = forceShow ? "block" : "none";
    return;
  }
  divAtivos.style.display = status === "Fechado" ? "block" : "none";
}

function adicionarContato() {
  const container = document.getElementById("contatosContainer");
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Nome, Telefone, Email, Cargo";
  container.appendChild(input);
  container.appendChild(document.createElement("br"));
}

document.getElementById("clienteForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const id = this.dataset.id || db.ref("clientes").push().key;
  const diasSemana = [];
  if (document.getElementById("seg").checked) diasSemana.push("Seg");
  if (document.getElementById("ter").checked) diasSemana.push("Ter");
  if (document.getElementById("qua").checked) diasSemana.push("Qua");
  if (document.getElementById("qui").checked) diasSemana.push("Qui");
  if (document.getElementById("sex").checked) diasSemana.push("Sex");
  if (document.getElementById("sab").checked) diasSemana.push("Sab");
  if (document.getElementById("dom").checked) diasSemana.push("Dom");

  const cliente = {
    nome: document.getElementById("nome").value,
    dataCadastro: document.getElementById("dataCadastro").value,
    tipoCliente: document.getElementById("tipoCliente").value,
    indicadoPor: document.getElementById("indicadoPor").value,
    perfilEconomico: document.getElementById("perfilEconomico").value,
    tamanho: document.getElementById("tamanho").value,
    endereco: document.getElementById("endereco").value,
    regiao: document.getElementById("regiao").value,
    ultimoContato: document.getElementById("ultimoContato").value,
    observacoes: document.getElementById("observacoes").value,
    status: document.getElementById("status").value,
  };

  if (cliente.status === "Fechado") {
    cliente.nomeEvento = document.getElementById("nomeEvento").value;
    cliente.frequencia = document.getElementById("frequencia").value;
    cliente.dataPrimeiroEvento = document.getElementById("dataPrimeiroEvento").value;
    cliente.statusEvento = document.getElementById("statusEvento").value;
    cliente.obsEvento = document.getElementById("obsEvento").value;
    cliente.diasSemana = diasSemana;
  }

  db.ref("clientes/" + id).set(cliente).then(() => {
    this.reset();
    toggleClienteAtivo(false);
    delete this.dataset.id;
    carregarClientes();
  });
});

// Filtro por nome
if (filtroInput) {
  filtroInput.addEventListener("input", () => {
    const termo = filtroInput.value.toLowerCase();
    const linhas = document.querySelectorAll("#clientesTable tbody tr");
    linhas.forEach(linha => {
      const nome = linha.cells[0].textContent.toLowerCase();
      linha.style.display = nome.includes(termo) ? "" : "none";
    });
  });
}

window.onload = carregarClientes;
