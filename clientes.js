// Firebase
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
const db = firebase.database().ref("clientes");

// Campos dinâmicos
function adicionarContato() {
  const container = document.getElementById("contatosContainer");
  const div = document.createElement("div");
  div.className = "mb-2 row gx-2";
  div.innerHTML = `
    <div class="col-md-3"><input type="text" class="form-control" placeholder="Nome"></div>
    <div class="col-md-3"><input type="text" class="form-control" placeholder="Telefone"></div>
    <div class="col-md-3"><input type="email" class="form-control" placeholder="Email"></div>
    <div class="col-md-2"><input type="text" class="form-control" placeholder="Cargo/Função"></div>
    <div class="col-md-1 d-grid"><button type="button" class="btn btn-danger" onclick="this.parentElement.parentElement.remove()">🗑️</button></div>
  `;
  container.appendChild(div);
}

// Seção condicional
function toggleClienteAtivo() {
  const status = document.getElementById("status").value;
  document.getElementById("clientesAtivos").style.display = (status === "Fechado") ? "block" : "none";
}

// Salvar Cliente
document.getElementById("clienteForm").addEventListener("submit", function (e) {
  e.preventDefault();
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
    contatos: [],
    clienteAtivo: {}
  };

  // Contatos
  const contatos = document.querySelectorAll("#contatosContainer > div");
  contatos.forEach(div => {
    const inputs = div.querySelectorAll("input");
    cliente.contatos.push({
      nome: inputs[0].value,
      telefone: inputs[1].value,
      email: inputs[2].value,
      cargo: inputs[3].value
    });
  });

  // Clientes Ativos (se Fechado)
  if (cliente.status === "Fechado") {
    cliente.clienteAtivo = {
      nomeEvento: document.getElementById("nomeEvento").value,
      diasSemana: ["seg", "ter", "qua", "qui", "sex", "sab", "dom"]
        .filter(dia => document.getElementById(dia)?.checked),
      frequencia: document.getElementById("frequencia").value,
      dataPrimeiroEvento: document.getElementById("dataPrimeiroEvento").value,
      statusEvento: document.getElementById("statusEvento").value,
      obsEvento: document.getElementById("obsEvento").value
    };
  }

  const novoCliente = db.push();
  novoCliente.set(cliente);
  this.reset();
  document.getElementById("contatosContainer").innerHTML = "";
  document.getElementById("clientesAtivos").style.display = "none";
});

// Listar Clientes
db.on("value", snapshot => {
  const tabela = document.querySelector("#clientesTable tbody");
  tabela.innerHTML = "";
  snapshot.forEach(child => {
    const c = child.val();
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${c.nome}</td>
      <td>${c.status}</td>
      <td>${c.tipoCliente}</td>
      <td>
        <button class="btn btn-sm btn-warning" onclick="editarCliente('${child.key}')">Editar</button>
        <button class="btn btn-sm btn-danger" onclick="excluirCliente('${child.key}')">Excluir</button>
      </td>
    `;
    tabela.appendChild(tr);
  });
});

// Excluir
function excluirCliente(id) {
  if (confirm("Deseja excluir este cliente?")) {
    db.child(id).remove();
  }
}
