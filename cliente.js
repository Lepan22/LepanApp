// Firebase
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
const db = firebase.database().ref("clientes");

let clienteEditando = null;

// Adiciona um contato dinâmico (sem classes visuais)
function adicionarContato(data = {}) {
  const container = document.getElementById("contatosContainer");
  const div = document.createElement("div");
  div.classList.add("form-group");

  const nome = document.createElement("input");
  nome.type = "text";
  nome.placeholder = "Nome";
  nome.value = data.nome || "";

  const tel = document.createElement("input");
  tel.type = "text";
  tel.placeholder = "Telefone";
  tel.value = data.telefone || "";

  const email = document.createElement("input");
  email.type = "email";
  email.placeholder = "Email";
  email.value = data.email || "";

  const cargo = document.createElement("input");
  cargo.type = "text";
  cargo.placeholder = "Cargo/Função";
  cargo.value = data.cargo || "";

  const btnExcluir = document.createElement("button");
  btnExcluir.type = "button";
  btnExcluir.textContent = "Remover";
  btnExcluir.style.marginLeft = "10px";
  btnExcluir.onclick = () => div.remove();

  div.appendChild(nome);
  div.appendChild(tel);
  div.appendChild(email);
  div.appendChild(cargo);
  div.appendChild(btnExcluir);

  container.appendChild(div);
}

// Mostrar/ocultar bloco de Clientes Ativos
function toggleClienteAtivo() {
  const status = document.getElementById("status").value;
  document.getElementById("clientesAtivos").style.display = (status === "Fechado") ? "block" : "none";
}

// Salvar cliente (novo ou edição)
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

  // Cliente Ativo
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

  if (clienteEditando) {
    db.child(clienteEditando).set(cliente);
    clienteEditando = null;
  } else {
    db.push(cliente);
  }

  this.reset();
  document.getElementById("contatosContainer").innerHTML = "";
  document.getElementById("clientesAtivos").style.display = "none";
});

// Listar clientes
db.on("value", snapshot => {
  const tabela = document.querySelector("#clientesTable tbody");
  tabela.innerHTML = "";
  snapshot.forEach(child => {
    const c = child.val();
    const tr = document.createElement("tr");

    const tdNome = document.createElement("td");
    tdNome.textContent = c.nome;

    const tdStatus = document.createElement("td");
    tdStatus.textContent = c.status;

    const tdTipo = document.createElement("td");
    tdTipo.textContent = c.tipoCliente;

    const tdAcoes = document.createElement("td");
    const btnEditar = document.createElement("button");
    btnEditar.textContent = "Editar";
    btnEditar.onclick = () => editarCliente(child.key);

    const btnExcluir = document.createElement("button");
    btnExcluir.textContent = "Excluir";
    btnExcluir.onclick = () => excluirCliente(child.key);

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

// Editar cliente
function editarCliente(id) {
  db.child(id).once("value", snapshot => {
    const c = snapshot.val();
    clienteEditando = id;

    document.getElementById("nome").value = c.nome || "";
    document.getElementById("dataCadastro").value = c.dataCadastro || "";
    document.getElementById("tipoCliente").value = c.tipoCliente || "";
    document.getElementById("indicadoPor").value = c.indicadoPor || "";
    document.getElementById("perfilEconomico").value = c.perfilEconomico || "";
    document.getElementById("tamanho").value = c.tamanho || "";
    document.getElementById("endereco").value = c.endereco || "";
    document.getElementById("regiao").value = c.regiao || "";
    document.getElementById("ultimoContato").value = c.ultimoContato || "";
    document.getElementById("observacoes").value = c.observacoes || "";
    document.getElementById("status").value = c.status || "";
    toggleClienteAtivo();

    document.getElementById("contatosContainer").innerHTML = "";
    (c.contatos || []).forEach(contato => adicionarContato(contato));

    if (c.status === "Fechado" && c.clienteAtivo) {
      document.getElementById("nomeEvento").value = c.clienteAtivo.nomeEvento || "";
      const dias = c.clienteAtivo.diasSemana || [];
      ["seg", "ter", "qua", "qui", "sex", "sab", "dom"].forEach(dia => {
        const checkbox = document.getElementById(dia);
        if (checkbox) checkbox.checked = dias.includes(dia);
      });
      document.getElementById("frequencia").value = c.clienteAtivo.frequencia || "";
      document.getElementById("dataPrimeiroEvento").value = c.clienteAtivo.dataPrimeiroEvento || "";
      document.getElementById("statusEvento").value = c.clienteAtivo.statusEvento || "";
      document.getElementById("obsEvento").value = c.clienteAtivo.obsEvento || "";
    }
  });
}
