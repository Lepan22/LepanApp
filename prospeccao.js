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
    contatos: capturarContatos()
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
      const id = child.key;
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 4;
      td.innerHTML = `
        <div class="detalhes" id="detalhes-${id}" style="display:none"></div>
      `;
      tr.innerHTML = `
        <td>${c.nome}</td>
        <td>${c.tipo}</td>
        <td>${c.observacoes || ""}</td>
        <td>
          <button onclick="editarContato('${id}')">Editar</button>
          <button onclick="excluirContato('${id}')">Excluir</button>
          <button onclick="toggleDetalhes('${id}')">Detalhes</button>
        </td>
      `;
      tabela.appendChild(tr);
      tabela.appendChild(Object.assign(document.createElement("tr"), { appendChild: () => tr.appendChild(td) }));
    });
  });
}

function toggleDetalhes(id) {
  const container = document.getElementById(`detalhes-${id}`);
  if (!container.innerHTML) {
    db.child(id).once("value").then(snap => {
      const c = snap.val();
      let html = "<div class='subtitulo'>Interações</div>";
      const interacoes = c.interacoes || {};
      for (let key in interacoes) {
        const i = interacoes[key];
        html += `<div class='item-interacao'><strong>${i.data}</strong>: ${i.descricao}<br><em>Próx: ${i.proximo}</em></div>`;
      }
      html += `
        <div class='linha'>
          <div class='campo'><input type='date' id='intData-${id}' /></div>
          <div class='campo'><input type='text' placeholder='Descrição' id='intDesc-${id}' /></div>
          <div class='campo'><input type='date' id='intProx-${id}' /></div>
          <div class='campo'><button onclick="salvarInteracao('${id}')">Adicionar</button></div>
        </div>
      `;
      html += "<div class='subtitulo'>Clientes Potenciais</div>";
      const pot = c.potenciais || {};
      for (let key in pot) {
        const p = pot[key];
        html += `<div class='item-potencial'><strong>${p.nome}</strong> (${p.status})<br>${p.obs || ""}</div>`;
      }
      html += `
        <div class='linha'>
          <div class='campo'><input type='text' placeholder='Condomínio' id='potNome-${id}' /></div>
          <div class='campo'><input type='text' placeholder='Status' id='potStatus-${id}' /></div>
          <div class='campo'><input type='text' placeholder='Observações' id='potObs-${id}' /></div>
          <div class='campo'><button onclick="salvarPotencial('${id}')">Adicionar</button></div>
        </div>
      `;
      container.innerHTML = html;
      container.style.display = "block";
    });
  } else {
    container.style.display = container.style.display === "none" ? "block" : "none";
  }
}

function salvarInteracao(id) {
  const data = document.getElementById(`intData-${id}`).value;
  const descricao = document.getElementById(`intDesc-${id}`).value;
  const proximo = document.getElementById(`intProx-${id}`).value;
  if (data && descricao) {
    db.child(id).child("interacoes").push({ data, descricao, proximo }).then(() => toggleDetalhes(id));
  }
}

function salvarPotencial(id) {
  const nome = document.getElementById(`potNome-${id}`).value;
  const status = document.getElementById(`potStatus-${id}`).value;
  const obs = document.getElementById(`potObs-${id}`).value;
  if (!nome) return;
  db.child(id).child("potenciais").push({ nome, status, obs }).then(() => {
    if (status === "Fechado") {
      firebase.database().ref("clientes").push({
        nome: nome,
        indicadoPor: id,
        status: "Fechado",
        dataCadastro: new Date().toISOString().split("T")[0],
        observacoes: obs || ""
      });
    }
    toggleDetalhes(id);
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

window.onload = carregarContatos;
