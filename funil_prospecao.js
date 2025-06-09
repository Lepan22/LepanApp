const firebaseConfig = {
  apiKey: "AIzaSyBClDBA7f9-jfF6Nz6Ia-YlZ6G-hx3oerY",
  authDomain: "lepanapp.firebaseapp.com",
  databaseURL: "https://lepanapp-default-rtdb.firebaseio.com",
  projectId: "lepanapp"
};

firebase.initializeApp(firebaseConfig);
const fontesRef = firebase.database().ref("prospeccao/fontes");
const condRef = firebase.database().ref("prospeccao/condominios");

// Salvar fonte de prospecção
const fonteForm = document.getElementById("fonteForm");
fonteForm.addEventListener("submit", e => {
  e.preventDefault();

  const novaFonte = {
    tipo: document.getElementById("tipoFonte").value,
    nome: document.getElementById("nomeFonte").value.trim(),
    observacoes: document.getElementById("obsFonte").value.trim(),
    contatos: capturarContatosFonte()
  };

  fontesRef.push(novaFonte).then(() => {
    alert("Fonte salva com sucesso!");
    fonteForm.reset();
    document.getElementById("contatosFonte").innerHTML = "";
  });
});

function adicionarContatoFonte(contato = {}) {
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

  document.getElementById("contatosFonte").appendChild(div);
}

function capturarContatosFonte() {
  const contatos = [];
  const container = document.getElementById("contatosFonte");
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

// Carregar lista de condomínios em prospecção
const tbody = document.querySelector("#prospecoesTable tbody");

function carregarProspecoes() {
  tbody.innerHTML = "";
  condRef.once("value").then(snapshot => {
    snapshot.forEach(child => {
      const c = child.val();
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${c.nome}</td>
        <td>${c.origem}</td>
        <td>${c.status}</td>
        <td>${c.proximaAcao}</td>
        <td>${c.dataAcao || ""}</td>
        <td><button onclick=\"converterCliente('${child.key}')\">Converter</button></td>
      `;
      tbody.appendChild(tr);
    });
  });
}

function converterCliente(id) {
  if (confirm("Deseja mover este condomínio para a base de clientes?")) {
    condRef.child(id).once("value").then(snapshot => {
      const dados = snapshot.val();
      if (!dados) return;
      firebase.database().ref("clientes").push({
        nome: dados.nome,
        indicadoPor: dados.origem,
        status: "Fechado",
        dataCadastro: new Date().toISOString().split('T')[0],
        observacoes: dados.observacoes || "",
        contatos: dados.contatos || []
      }).then(() => condRef.child(id).remove())
        .then(() => carregarProspecoes());
    });
  }
}

window.onload = carregarProspecoes;
