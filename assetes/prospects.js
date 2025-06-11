const firebaseConfig = {
  apiKey: "AIzaSyBClDBA7f9-jfF6Nz6Ia-YlZ6G-hx3oerY",
  authDomain: "lepanapp.firebaseapp.com",
  databaseURL: "https://lepanapp-default-rtdb.firebaseio.com",
  projectId: "lepanapp"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database().ref("prospecao");

document.getElementById("formProspect").addEventListener("submit", (e) => {
  e.preventDefault();

  const novo = {
    tipo: document.getElementById("tipo").value.trim(),
    nome: document.getElementById("nome").value.trim(),
    contatos: capturarContatos(),
    prospects: capturarProspects(),
    criadoEm: new Date().toISOString()
  };

  db.push(novo).then(() => {
    alert("Salvo com sucesso!");
    location.reload();
  });
});

function adicionarContato(contato = {}) {
  const div = document.createElement("div");

  const nome = document.createElement("input");
  nome.placeholder = "Nome";
  nome.value = contato.nome || "";

  const telefone = document.createElement("input");
  telefone.placeholder = "Telefone";
  telefone.value = contato.telefone || "";

  const email = document.createElement("input");
  email.placeholder = "Email";
  email.value = contato.email || "";

  div.appendChild(nome);
  div.appendChild(telefone);
  div.appendChild(email);

  document.getElementById("contatosContainer").appendChild(div);
}

function adicionarProspect(prospect = {}) {
  const div = document.createElement("div");

  const nome = document.createElement("input");
  nome.placeholder = "Nome do Prospect";
  nome.value = prospect.nome || "";

  const status = document.createElement("select");
  ["Aberto", "Negociando", "Fechado", "Perdido"].forEach(op => {
    const option = document.createElement("option");
    option.value = op;
    option.textContent = op;
    if (prospect.status === op) option.selected = true;
    status.appendChild(option);
  });

  div.appendChild(nome);
  div.appendChild(status);

  document.getElementById("prospectsContainer").appendChild(div);
}

function capturarContatos() {
  const lista = [];
  const divs = document.querySelectorAll("#contatosContainer > div");
  divs.forEach(div => {
    const inputs = div.querySelectorAll("input");
    lista.push({
      nome: inputs[0].value.trim(),
      telefone: inputs[1].value.trim(),
      email: inputs[2].value.trim()
    });
  });
  return lista;
}

function capturarProspects() {
  const lista = [];
  const divs = document.querySelectorAll("#prospectsContainer > div");
  divs.forEach(div => {
    const inputs = div.querySelectorAll("input");
    const select = div.querySelector("select");
    lista.push({
      nome: inputs[0].value.trim(),
      status: select.value
    });
  });
  return lista;
}

// Carregar tabela
db.once("value").then(snapshot => {
  const tbody = document.querySelector("#tabelaProspects tbody");
  tbody.innerHTML = "";
  snapshot.forEach(child => {
    const p = child.val();
    const nomes = (p.prospects || []).map(p => `${p.nome} (${p.status})`).join("<br>");
    const row = `<tr>
      <td>${p.tipo}</td>
      <td>${p.nome}</td>
      <td>${nomes}</td>
    </tr>`;
    tbody.innerHTML += row;
  });
});
