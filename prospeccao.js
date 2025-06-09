const firebaseConfig = {
  apiKey: "AIzaSyBClDBA7f9-jfF6Nz6Ia-YlZ6G-hx3oerY",
  authDomain: "lepanapp.firebaseapp.com",
  databaseURL: "https://lepanapp-default-rtdb.firebaseio.com",
  projectId: "lepanapp"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const selectContato = document.getElementById("selectContato");
const selectProspect = document.getElementById("selectProspect");
const kanbanBoard = document.getElementById("kanbanBoard");
const listaProximas = document.querySelector("#listaProximas tbody");

const statusList = ["Aberto", "Negociando", "Proposta", "Fechado", "Perdido"];
let contatosMap = {};
let prospectsMap = {};

// Carrega contatos e prospects
function carregarContatos() {
  selectContato.innerHTML = "<option value=''>Selecione</option>";
  db.ref("prospeccao/contatos").once("value").then(snap => {
    contatosMap = {};
    snap.forEach(child => {
      const c = child.val();
      contatosMap[child.key] = c;
      const op = document.createElement("option");
      op.value = child.key;
      op.textContent = c.nome;
      selectContato.appendChild(op);
    });
  });
}

function carregarProspects() {
  selectProspect.innerHTML = "<option value=''>Selecione</option>";
  db.ref("prospeccao/prospects").once("value").then(snap => {
    prospectsMap = {};
    snap.forEach(child => {
      const p = child.val();
      prospectsMap[child.key] = p;
      const op = document.createElement("option");
      op.value = child.key;
      op.textContent = p.nome;
      selectProspect.appendChild(op);
    });
  });
}

function salvarAcao() {
  const contatoId = selectContato.value;
  const prospectId = selectProspect.value;
  const status = document.getElementById("statusProspect").value;
  const dataContato = document.getElementById("dataContato").value;
  const comentario = document.getElementById("comentario").value;
  const observacao = document.getElementById("observacao").value;
  const proximaData = document.getElementById("proximaData").value;

  if (!contatoId || !prospectId || !dataContato) {
    alert("Preencha os campos obrigatórios.");
    return;
  }

  const nova = {
    contatoId,
    prospectId,
    status,
    dataContato,
    comentario,
    observacao,
    proximaData,
    dataCriacao: new Date().toISOString()
  };

  db.ref("prospeccao/acoes").push(nova).then(() => {
    if (status === "Fechado") {
      const prospect = prospectsMap[prospectId];
      firebase.database().ref("clientes").push({
        nome: prospect.nome,
        indicadoPor: contatoId,
        status: "Fechado",
        dataCadastro: new Date().toISOString().split("T")[0]
      });
    }
    carregarKanban();
    carregarProximas();
  });
}

function carregarKanban() {
  kanbanBoard.innerHTML = "";
  const colunas = {};
  statusList.forEach(status => {
    const col = document.createElement("div");
    col.className = "kanban-column";
    col.dataset.status = status;
    col.innerHTML = `<h3>${status}</h3>`;
    col.ondragover = e => e.preventDefault();
    col.ondrop = e => {
      const id = e.dataTransfer.getData("text");
      alterarStatus(id, status);
    };
    kanbanBoard.appendChild(col);
    colunas[status] = col;
  });

  db.ref("prospeccao/acoes").once("value").then(snap => {
    snap.forEach(child => {
      const acao = child.val();
      const div = document.createElement("div");
      div.className = "kanban-item";
      div.draggable = true;
      div.ondragstart = e => e.dataTransfer.setData("text", child.key);
      div.onclick = () => abrirPainel(child.key);
      const prospect = prospectsMap[acao.prospectId]?.nome || "Sem nome";
      div.innerHTML = `<strong>${prospect}</strong><br>${acao.comentario || ""}`;
      colunas[acao.status]?.appendChild(div);
    });
  });
}

function alterarStatus(acaoId, novoStatus) {
  db.ref("prospeccao/acoes/" + acaoId + "/status").set(novoStatus).then(() => {
    if (novoStatus === "Fechado") {
      db.ref("prospeccao/acoes/" + acaoId).once("value").then(snap => {
        const acao = snap.val();
        const prospect = prospectsMap[acao.prospectId];
        if (prospect) {
          firebase.database().ref("clientes").push({
            nome: prospect.nome,
            indicadoPor: acao.contatoId,
            status: "Fechado",
            dataCadastro: new Date().toISOString().split("T")[0]
          });
        }
      });
    }
    carregarKanban();
    carregarProximas();
  });
}

function carregarProximas() {
  listaProximas.innerHTML = "";
  db.ref("prospeccao/acoes").once("value").then(snap => {
    const linhas = [];
    snap.forEach(child => {
      const a = child.val();
      if (a.proximaData) {
        linhas.push({
          nome: prospectsMap[a.prospectId]?.nome || "-",
          contato: contatosMap[a.contatoId]?.nome || "-",
          proxima: a.proximaData,
          id: child.key
        });
      }
    });

    linhas.sort((a, b) => new Date(a.proxima) - new Date(b.proxima));

    linhas.forEach(l => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><a href="#" onclick="abrirPainel('${l.id}')">${l.nome}</a></td>
        <td>${l.contato}</td>
        <td>${l.proxima}</td>
        <td><button onclick="abrirPainel('${l.id}')">Ver</button></td>
      `;
      listaProximas.appendChild(tr);
    });
  });
}

function abrirPainel(id) {
  const painel = document.getElementById("sidePanel");
  const div = document.getElementById("detalheProspect");
  painel.classList.add("open");

  db.ref("prospeccao/acoes/" + id).once("value").then(snap => {
    const a = snap.val();
    const contato = contatosMap[a.contatoId]?.nome || "-";
    const prospect = prospectsMap[a.prospectId]?.nome || "-";
    div.innerHTML = `
      <h3>${prospect}</h3>
      <p><strong>Contato:</strong> ${contato}</p>
      <p><strong>Status:</strong> ${a.status}</p>
      <p><strong>Data do Contato:</strong> ${a.dataContato}</p>
      <p><strong>Comentário:</strong> ${a.comentario}</p>
      <p><strong>Observação:</strong> ${a.observacao}</p>
      <p><strong>Próxima Data:</strong> ${a.proximaData}</p>
    `;
  });
}

function fecharPainel() {
  document.getElementById("sidePanel").classList.remove("open");
}

window.onload = () => {
  carregarContatos();
  carregarProspects();
  carregarKanban();
  carregarProximas();
};
