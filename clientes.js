const firebaseConfig = {
  apiKey: "AIzaSyBClDBA7f9-jfF6Nz6Ia-YlZ6G-hx3oerY",
  authDomain: "lepanapp.firebaseapp.com",
  databaseURL: "https://lepanapp-default-rtdb.firebaseio.com",
  projectId: "lepanapp"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database().ref("clientes");

const urlParams = new URLSearchParams(window.location.search);
const clienteId = urlParams.get("id");

// 👉 Se não for edição (não tem id), preencher com os dados da URL
if (!clienteId) {
  document.getElementById("nome").value = urlParams.get("nome") || "";
  document.getElementById("nomeEvento").value = urlParams.get("nomeEvento") || "";
  document.getElementById("dataCadastro").value = urlParams.get("dataCadastro") || "";
  document.getElementById("indicadoPor").value = urlParams.get("indicadoPor") || "";
  document.getElementById("tipoCliente").value = urlParams.get("tipoCliente") || "";
  document.getElementById("perfilEconomico").value = urlParams.get("perfilEconomico") || "";
  document.getElementById("tamanho").value = urlParams.get("tamanho") || "";
  document.getElementById("endereco").value = urlParams.get("endereco") || "";
  document.getElementById("regiao").value = urlParams.get("regiao") || "";
  document.getElementById("status").value = urlParams.get("status") || "Aberto";
  toggleClienteAtivo();
}

// 👉 Se for edição, carregar do Firebase
if (clienteId) {
  db.child(clienteId).once("value").then(snapshot => {
    const c = snapshot.val();
    if (!c) return;

    document.getElementById("nome").value = c.nome || "";
    document.getElementById("dataCadastro").value = c.dataCadastro || "";
    document.getElementById("tipoCliente").value = c.tipoCliente || "";
    document.getElementById("indicadoPor").value = c.indicadoPor || "";
    document.getElementById("perfilEconomico").value = c.perfilEconomico || "";
    document.getElementById("tamanho").value = c.tamanho || "";
    document.getElementById("endereco").value = c.endereco || "";
    document.getElementById("regiao").value = c.regiao || "";
    document.getElementById("observacoes").value = c.observacoes || "";
    document.getElementById("status").value = c.status || "Aberto";

    if (Array.isArray(c.contatos)) {
      c.contatos.forEach(contato => adicionarContato(contato));
    }

    if (c.clienteAtivo) {
      document.getElementById("clientesAtivos").style.display = "block";
      document.getElementById("nomeEvento").value = c.clienteAtivo.nomeEvento || "";
      document.getElementById("frequencia").value = c.clienteAtivo.frequencia || "";
      document.getElementById("dataPrimeiroEvento").value = c.clienteAtivo.dataPrimeiroEvento || "";
      document.getElementById("statusEvento").value = c.clienteAtivo.statusEvento || "";

      const dias = Array.isArray(c.clienteAtivo.diasSemana) ? c.clienteAtivo.diasSemana : [];
      ["seg", "ter", "qua", "qui", "sex", "sab", "dom"].forEach(dia => {
        document.getElementById(dia).checked = dias.includes(dia);
      });

      document.getElementById("obsEvento").value = c.clienteAtivo.observacoes || "";
    }

    toggleClienteAtivo();
  });
}

// 👉 Salvar cliente (novo ou edição)
document.getElementById("clienteForm").addEventListener("submit", e => {
  e.preventDefault();

  const novoCliente = {
    nome: document.getElementById("nome").value.trim(),
    dataCadastro: document.getElementById("dataCadastro").value,
    tipoCliente: document.getElementById("tipoCliente").value.trim(),
    indicadoPor: document.getElementById("indicadoPor").value.trim(),
    perfilEconomico: document.getElementById("perfilEconomico").value.trim(),
    tamanho: document.getElementById("tamanho").value.trim(),
    endereco: document.getElementById("endereco").value.trim(),
    regiao: document.getElementById("regiao").value.trim(),
    observacoes: document.getElementById("observacoes").value.trim(),
    status: document.getElementById("status").value,
    contatos: capturarContatos(),
  };

  if (document.getElementById("clientesAtivos").style.display !== "none") {
    novoCliente.clienteAtivo = {
      nomeEvento: document.getElementById("nomeEvento").value.trim(),
      frequencia: document.getElementById("frequencia").value,
      dataPrimeiroEvento: document.getElementById("dataPrimeiroEvento").value,
      statusEvento: document.getElementById("statusEvento").value,
      diasSemana: ["seg", "ter", "qua", "qui", "sex", "sab", "dom"].filter(dia => document.getElementById(dia).checked),
      observacoes: document.getElementById("obsEvento").value.trim()
    };
  }

  const destino = clienteId ? db.child(clienteId) : db.push();
  destino.set(novoCliente).then(() => {
    alert("Cliente salvo com sucesso!");
    if (!clienteId) location.href = "clientes.html";
  });
});

// 👉 Lógica de exibição do campo clienteAtivo
function toggleClienteAtivo() {
  const status = document.getElementById("status").value;
  document.getElementById("clientesAtivos").style.display = (status === "Fechado") ? "block" : "none";
}

// 👉 Contatos dinâmicos
function adicionarContato(contato = {}) {
  const div = document.createElement("div");

  const nome = document.createElement("input");
  nome.placeholder = "Nome";
  nome.value = contato.nome || "";

  const tel = document.createElement("input");
  tel.placeholder = "Telefone";
  tel.value = contato.telefone || "";

  const email = document.createElement("input");
  email.placeholder = "Email";
  email.value = contato.email || "";

  const cargo = document.createElement("input");
  cargo.placeholder = "Cargo/Função";
  cargo.value = contato.cargo || "";

  div.appendChild(nome);
  div.appendChild(tel);
  div.appendChild(email);
  div.appendChild(cargo);

  document.getElementById("contatosContainer").appendChild(div);
}

function capturarContatos() {
  const contatos = [];
  const container = document.getElementById("contatosContainer");
  const linhas = container.querySelectorAll("div");
  linhas.forEach(div => {
    const inputs = div.querySelectorAll("input");
    contatos.push({
      nome: inputs[0].value.trim(),
      telefone: inputs[1].value.trim(),
      email: inputs[2].value.trim(),
      cargo: inputs[3].value.trim()
    });
  });
  return contatos;
}
