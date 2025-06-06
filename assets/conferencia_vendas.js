import { db } from './firebase-config.js';
import { ref, get, set, remove } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

const nomeEventoSelect = document.getElementById("nomeEventoSelect");
const dataEventoSelect = document.getElementById("dataEventoSelect");
const tabelaProdutos = document.getElementById("tabelaProdutos");
const totalCalculado = document.getElementById("totalCalculado");
const totalReal = document.getElementById("totalReal");
const totalDiferenca = document.getElementById("totalDiferenca");
const salvarBtn = document.getElementById("salvarBtn");
const corpoListaConferencias = document.getElementById("listaConferencias");

let eventos = [];
let produtosDB = {};
let eventoSelecionadoId = null;

function formatar(valor) {
  return `R$ ${valor.toFixed(2).replace('.', ',')}`;
}

async function carregarProdutosDB() {
  const snapshot = await get(ref(db, 'produtos'));
  produtosDB = {};
  snapshot.forEach(child => {
    produtosDB[child.key] = child.val();
  });
}

function carregarEventos() {
  get(ref(db, 'eventos')).then(snapshot => {
    eventos = [];
    nomeEventoSelect.innerHTML = `<option value="">Selecione</option>`;
    snapshot.forEach(child => {
      const evento = child.val();
      if (evento.nomeEvento && evento.data) {
        eventos.push({ id: child.key, nome: evento.nomeEvento, data: evento.data });
      }
    });

    const nomesUnicos = [...new Set(eventos.map(e => e.nome))];
    nomesUnicos.sort().forEach(nome => {
      const option = document.createElement("option");
      option.value = nome;
      option.textContent = nome;
      nomeEventoSelect.appendChild(option);
    });

    carregarListaConferencias();
    carregarEventoViaURL();
  });
}

nomeEventoSelect.addEventListener("change", () => {
  const nomeSelecionado = nomeEventoSelect.value;
  const datas = eventos
    .filter(e => e.nome === nomeSelecionado)
    .map(e => ({ id: e.id, data: e.data }))
    .sort((a, b) => b.data.localeCompare(a.data)).reverse();

  dataEventoSelect.innerHTML = `<option value="">Selecione</option>`;
  datas.forEach(item => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = item.data;
    dataEventoSelect.appendChild(option);
  });

  tabelaProdutos.innerHTML = '';
});

dataEventoSelect.addEventListener("change", async () => {
  eventoSelecionadoId = dataEventoSelect.value;
  if (!eventoSelecionadoId) return;
  await carregarProdutosDB();
  exibirProdutos(eventoSelecionadoId);
});

function exibirProdutos(idEvento) {
  get(ref(db, `eventos/${idEvento}`)).then(snapshot => {
    const evento = snapshot.val();
    tabelaProdutos.innerHTML = '';

    for (const [_, info] of Object.entries(evento.produtos || {})) {
      const produtoId = info.produtoId;
      const produto = produtosDB[produtoId] || {};
      const nome = produto.nome || 'Produto';
      const valorUnitario = parseFloat(produto.valorVenda || 0);

      const qtdSistema = (parseFloat(info.quantidade || 0) -
                         parseFloat(info.congelado || 0) -
                         parseFloat(info.assado || 0) -
                         parseFloat(info.perda || 0));
      const valorCalculado = qtdSistema * valorUnitario;

      const tr = document.createElement("tr");

      const tdNome = document.createElement("td");
      tdNome.textContent = nome;

      const tdQtdSistema = document.createElement("td");
      tdQtdSistema.textContent = qtdSistema;

      const tdValorUnit = document.createElement("td");
      tdValorUnit.textContent = formatar(valorUnitario);

      const tdQtdReal = document.createElement("td");
      const input = document.createElement("input");
      input.type = "number";
      input.value = qtdSistema;
      input.style.width = "60px";
      tdQtdReal.appendChild(input);

      const tdValorCalculado = document.createElement("td");
      const tdValorReal = document.createElement("td");
      const tdDiferenca = document.createElement("td");

      function atualizar() {
        const qtdReal = parseFloat(input.value || 0);
        const valorReal = qtdReal * valorUnitario;
        const diff = valorReal - valorCalculado;

        tdValorCalculado.textContent = formatar(valorCalculado);
        tdValorReal.textContent = formatar(valorReal);
        tdDiferenca.textContent = formatar(diff);

        recalcularTotais();
      }

      input.addEventListener("input", atualizar);
      atualizar();

      tr.append(tdNome, tdQtdSistema, tdValorUnit, tdQtdReal, tdValorCalculado, tdValorReal, tdDiferenca);
      tabelaProdutos.appendChild(tr);
    }
  });
}

function recalcularTotais() {
  let calc = 0, real = 0;
  tabelaProdutos.querySelectorAll("tr").forEach(row => {
    const tds = row.querySelectorAll("td");
    if (tds.length < 7) return;
    const valorCalculado = parseFloat(tds[4].textContent.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
    const valorReal = parseFloat(tds[5].textContent.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
    calc += valorCalculado;
    real += valorReal;
  });
  totalCalculado.textContent = formatar(calc);
  totalReal.textContent = formatar(real);
  totalDiferenca.textContent = formatar(real - calc);
}

salvarBtn.addEventListener("click", () => {
  if (!eventoSelecionadoId) return alert("Selecione um evento válido.");
  const dados = [];
  tabelaProdutos.querySelectorAll("tr").forEach(row => {
    const tds = row.querySelectorAll("td");
    if (tds.length < 7) return;
    dados.push({
      nome: tds[0].textContent,
      qtdSistema: parseFloat(tds[1].textContent),
      valorUnitario: parseFloat(tds[2].textContent.replace(/[^\d,-]/g, '').replace(',', '.')),
      qtdReal: parseFloat(tds[3].querySelector("input").value),
      valorCalculado: parseFloat(tds[4].textContent.replace(/[^\d,-]/g, '').replace(',', '.')),
      valorReal: parseFloat(tds[5].textContent.replace(/[^\d,-]/g, '').replace(',', '.')),
      diferenca: parseFloat(tds[6].textContent.replace(/[^\d,-]/g, '').replace(',', '.'))
    });
  });

  set(ref(db, `conferencias/${eventoSelecionadoId}`), {
    dataHora: new Date().toISOString(),
    produtos: dados
  }).then(() => {
    alert("Conferência salva com sucesso.");
    carregarListaConferencias();
  });
});

function carregarListaConferencias() {
  Promise.all([
    get(ref(db, 'conferencias')),
    get(ref(db, 'eventos'))
  ]).then(([confSnap, eventosSnap]) => {
    const conferencias = confSnap.val() || {};
    const eventos = eventosSnap.val() || {};
    corpoListaConferencias.innerHTML = '';

    Object.entries(conferencias).forEach(([idEvento, dados]) => {
      const evento = eventos[idEvento] || {};
      const nome = evento.nomeEvento || 'Evento';
      const data = evento.data || '—';

      let totalReal = 0;
      let totalDiferenca = 0;

      (dados.produtos || []).forEach(p => {
        totalReal += parseFloat(p.valorReal || 0);
        totalDiferenca += parseFloat(p.diferenca || 0);
      });

      const percentual = totalReal > 0 ? (totalDiferenca / totalReal * 100).toFixed(1) + '%' : '—';

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${nome}</td>
        <td>${data}</td>
        <td>${formatar(totalDiferenca)}</td>
        <td>${percentual}</td>
        <td>
          <button onclick="window.location.href='conferencia_vendas.html?idEvento=${idEvento}'">Editar</button>
          <button onclick="excluirConferencia('${idEvento}')">Excluir</button>
        </td>
      `;
      corpoListaConferencias.appendChild(tr);
    });
  });
}

window.excluirConferencia = function (id) {
  if (!confirm("Deseja realmente excluir esta conferência?")) return;
  remove(ref(db, `conferencias/${id}`)).then(() => {
    alert("Conferência excluída.");
    carregarListaConferencias();
  });
};

function getIdEventoDaURL() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('idEvento') || null;
}

function carregarEventoViaURL() {
  const idURL = getIdEventoDaURL();
  if (!idURL || !eventos.length) return;

  const evento = eventos.find(e => e.id === idURL);
  if (!evento) return;

  nomeEventoSelect.value = evento.nome;
  nomeEventoSelect.dispatchEvent(new Event('change'));

  setTimeout(() => {
    dataEventoSelect.value = idURL;
    dataEventoSelect.dispatchEvent(new Event('change'));
  }, 300);
}

carregarEventos();
