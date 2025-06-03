import { db } from './firebase-config.js';
import { ref, onValue, set } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

const selectEvento = document.getElementById("selectEvento");
const tabelaProdutos = document.getElementById("tabelaProdutos");
const totalCalculado = document.getElementById("totalCalculado");
const totalReal = document.getElementById("totalReal");
const totalDiferenca = document.getElementById("totalDiferenca");
const salvarBtn = document.getElementById("salvarBtn");

let eventos = [];

function formatarValor(valor) {
  return `R$ ${valor.toFixed(2).replace('.', ',')}`;
}

function carregarEventos() {
  const eventosRef = ref(db, 'eventos');
  onValue(eventosRef, (snapshot) => {
    eventos = [];
    selectEvento.innerHTML = `<option value="">Selecione...</option>`;
    snapshot.forEach(child => {
      const evento = child.val();
      if (evento.nomeEvento && evento.data) {
        eventos.push({ id: child.key, nome: evento.nomeEvento, data: evento.data });
      }
    });
    eventos.sort((a, b) => a.nome.localeCompare(b.nome) || a.data.localeCompare(b.data));
    eventos.forEach(ev => {
      const option = document.createElement("option");
      option.value = ev.id;
      option.textContent = `${ev.nome} - ${ev.data}`;
      selectEvento.appendChild(option);
    });
  });
}

function carregarProdutos(idEvento) {
  const eventoRef = ref(db, `eventos/${idEvento}`);
  onValue(eventoRef, (snapshot) => {
    const evento = snapshot.val();
    if (!evento || !evento.produtos) return;

    tabelaProdutos.innerHTML = '';
    let somaCalculado = 0, somaReal = 0;

    evento.produtos.forEach((prod, i) => {
      const vendidaSistema = (prod.enviado || 0) - ((prod.congelado || 0) + (prod.assado || 0) + (prod.perda || 0));
      const valorUnitario = parseFloat(prod.valorVenda || 0);
      const valorCalculado = vendidaSistema * valorUnitario;

      const tr = document.createElement("tr");

      const tdNome = document.createElement("td");
      tdNome.textContent = prod.nome || '';

      const tdSistema = document.createElement("td");
      tdSistema.textContent = vendidaSistema;

      const tdValorUnitario = document.createElement("td");
      tdValorUnitario.textContent = formatarValor(valorUnitario);

      const tdReal = document.createElement("td");
      const inputReal = document.createElement("input");
      inputReal.type = "number";
      inputReal.min = "0";
      inputReal.value = vendidaSistema;
      inputReal.style.width = "60px";
      tdReal.appendChild(inputReal);

      const tdCalculado = document.createElement("td");
      const tdRealTotal = document.createElement("td");
      const tdDiferenca = document.createElement("td");

      const atualizarTotais = () => {
        const realVendida = parseFloat(inputReal.value || 0);
        const valorReal = realVendida * valorUnitario;
        const diferenca = valorReal - valorCalculado;

        tdCalculado.textContent = formatarValor(valorCalculado);
        tdRealTotal.textContent = formatarValor(valorReal);
        tdDiferenca.textContent = formatarValor(diferenca);
      };

      inputReal.addEventListener("input", atualizarTotais);
      atualizarTotais();

      somaCalculado += valorCalculado;
      somaReal += parseFloat(inputReal.value || 0) * valorUnitario;

      tr.append(tdNome, tdSistema, tdValorUnitario, tdReal, tdCalculado, tdRealTotal, tdDiferenca);
      tabelaProdutos.appendChild(tr);
    });

    totalCalculado.textContent = formatarValor(somaCalculado);
    totalReal.textContent = formatarValor(somaReal);
    totalDiferenca.textContent = formatarValor(somaReal - somaCalculado);
  });
}

salvarBtn.addEventListener("click", () => {
  const idEvento = selectEvento.value;
  if (!idEvento) return alert("Selecione um evento.");

  const linhas = tabelaProdutos.querySelectorAll("tr");
  const produtos = [];

  linhas.forEach(linha => {
    const tds = linha.querySelectorAll("td");
    if (tds.length < 7) return;

    const nome = tds[0].textContent;
    const qtdSistema = parseFloat(tds[1].textContent || 0);
    const valorUnit = parseFloat(tds[2].textContent.replace('R$', '').replace(',', '.').trim()) || 0;
    const qtdReal = parseFloat(tds[3].querySelector("input").value || 0);
    const valorCalc = qtdSistema * valorUnit;
    const valorReal = qtdReal * valorUnit;

    produtos.push({ nome, qtdSistema, qtdReal, valorUnit, valorCalc, valorReal, diferenca: valorReal - valorCalc });
  });

  set(ref(db, `conferencias/${idEvento}`), {
    dataHora: new Date().toISOString(),
    produtos
  }).then(() => {
    alert("Conferência salva com sucesso.");
  }).catch(err => {
    alert("Erro ao salvar: " + err.message);
  });
});

selectEvento.addEventListener("change", () => {
  const id = selectEvento.value;
  if (id) carregarProdutos(id);
});

carregarEventos();
