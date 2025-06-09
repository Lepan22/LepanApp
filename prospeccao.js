const firebaseConfig = {
  apiKey: "AIzaSyBClDBA7f9-jfF6Nz6Ia-YlZ6G-hx3oerY",
  authDomain: "lepanapp.firebaseapp.com",
  databaseURL: "https://lepanapp-default-rtdb.firebaseio.com",
  projectId: "lepanapp"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database().ref("prospeccao/contatos");

const form = document.getElementById("contatoForm");
const tabela = document.querySelector("#tabelaContatos tbody");

form.addEventListener("submit", e => {
  e.preventDefault();

  const novo = {
    tipo: document.getElementById("tipoContato").value,
    nome: document.getElementById("nomeContato").value.trim(),
    observacoes: document.getElementById("obsContato").value.trim(),
    contatos: capturarContatos(),
    interacoes: [],
    potenciais: []
  };

  if (!novo.nome) {
    alert("Informe o nome do contato.");
    return;
  }

  db.push(novo).then(() => {
    alert("Contato salvo!");
    form.reset();
    document.getElementById("contatosSecundarios").innerHTML = "";
    carregarContatos();
  });
});

function adicionarContatoSecundario(contato = {}) {
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

  document.getElementById("contatosSecundarios").appendChild(div);
}

function capturarContatos() {
  const lista = [];
  const linhas = document.getElementById("contatosSecundarios").querySelectorAll("div");
  linhas.forEach(div => {
    const inputs = div.querySelectorAll("input");
    lista.push({
      nome: inputs[0].value.trim(),
      telefone: inputs[1].value.trim(),
      email: inputs[2].value.trim(),
      cargo: inputs[3].value.trim()
    });
  });
  return lista;
}

function carregarContatos() {
  tabela.innerHTML = "";
  db.once("value").then(snapshot => {
    snapshot.forEach(child => {
      const c = child.val();
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${c.nome}</td>
        <td>${c.tipo}</td>
        <td>${c.observacoes || ""}</td>
        <td>
          <button onclick="editarContato('${child.key}')">Editar</button>
          <button onclick="excluirContato('${child.key}')">Excluir</button>
          <button onclick="adicionarInteracao('${child.key}')">+ Interação</button>
          <button onclick="adicionarPotencial('${child.key}')">+ Cliente</button>
        </td>
      `;
      tabela.appendChild(tr);
    });
  });
}

function excluirContato(id) {
  if (confirm("Deseja excluir este contato?")) {
    db.child(id).remove().then(carregarContatos);
  }
}

function editarContato(id) {
  db.child(id).once("value").then(snapshot => {
    const c = snapshot.val();
    if (!c) return;
    document.getElementById("tipoContato").value = c.tipo || "";
    document.getElementById("nomeContato").value = c.nome || "";
    document.getElementById("obsContato").value = c.observacoes || "";
    document.getElementById("contatosSecundarios").innerHTML = "";
    (c.contatos || []).forEach(adicionarContatoSecundario);
    db.child(id).remove();
  });
}

function adicionarInteracao(id) {
  const data = prompt("Data da interação (AAAA-MM-DD):");
  const descricao = prompt("Descritivo da ação realizada:");
  const proximo = prompt("Data do próximo contato (AAAA-MM-DD):");
  if (data && descricao) {
    db.child(id).child("interacoes").push({ data, descricao, proximo });
  }
}

function adicionarPotencial(id) {
  const nome = prompt("Nome do condomínio:");
  const status = prompt("Status (Aberto, Negociando, Perdido, Fechado):", "Aberto");
  const obs = prompt("Observações:");
  if (!nome) return;
  const potencial = { nome, status, obs };
  db.child(id).child("potenciais").push(potencial).then(() => {
    if (status === "Fechado") {
      firebase.database().ref("clientes").push({
        nome: nome,
        indicadoPor: id,
        status: "Fechado",
        dataCadastro: new Date().toISOString().split("T")[0],
        observacoes: obs || ""
      });
    }
  });
}

window.onload = carregarContatos;
