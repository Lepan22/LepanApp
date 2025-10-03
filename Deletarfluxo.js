import { db } from './assets/firebase-config.js';
import {
  ref, onValue, set, update, get, child
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

/** ===========================
 *  Utilitários
 *  =========================== */
const BR = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtNum = (n) => isFinite(n) ? BR.format(n) : '-';
const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const two = (n) => String(n).padStart(2, '0');
const thisYear = new Date().getFullYear();

/** Normaliza números no padrão BR: "1.234,56" -> 1234.56 */
function parseBRNumber(str) {
  if (typeof str !== 'string') return 0;
  const s = str.replace(/\./g,'').replace(',', '.').replace(/[^\d.-]/g,'').trim();
  const v = parseFloat(s);
  return isFinite(v) ? v : 0;
}

/** Detecta 'entrada'/'saida' num CSV pré-formatado por seção (Entradas/Saídas) */
function inferTipoFromCategoria(cell) {
  const s = (cell || '').toString().trim().toLowerCase();
  if (['entradas','entrada'].includes(s)) return 'entrada';
  if (['saídas','saidas','saída','saida'].includes(s)) return 'saida';
  return '';
}

/** ===========================
 *  Estado em memória
 *  =========================== */
let categorias = [];  // {id, nome, tipo, centroDeCusto}
let mapaCategorias = {}; // nomeLower -> {id, nome, tipo}

/** ===========================
 *  Carregar Categorias
 *  =========================== */
function carregarCategorias() {
  return new Promise((resolve) => {
    onValue(ref(db, 'financeiro/categorias'), snap => {
      categorias = [];
      mapaCategorias = {};
      snap.forEach(ch => {
        const id = ch.key;
        const v = ch.val();
        const item = { id, ...v };
        categorias.push(item);
        mapaCategorias[(v?.nome || '').toString().trim().toLowerCase()] = item;
      });
      // UI chips
      const chips = document.getElementById('chipsCategorias');
      const tot = document.getElementById('totalCategorias');
      chips.innerHTML = '';
      categorias.forEach(c => {
        const span = document.createElement('span');
        span.className = 'cat-badge';
        span.textContent = `${c.nome} (${c.tipo})`;
        chips.appendChild(span);
      });
      tot.textContent = categorias.length;
      resolve();
    }, { onlyOnce: true });
  });
}

/** ===========================
 *  Ano Fiscal + Grade de Meses
 *  =========================== */
function montarAnos() {
  const sel = document.getElementById('selectAno');
  const anos = [thisYear-1, thisYear, thisYear+1];
  sel.innerHTML = anos.map(a => `<option value="${a}" ${a===thisYear?'selected':''}>${a}</option>`).join('');
  sel.addEventListener('change', () => renderMeses());
}

function renderMeses() {
  const ano = document.getElementById('selectAno').value;
  const grid = document.getElementById('gridMeses');
  grid.innerHTML = '';

  for (let m = 1; m <= 12; m++) {
    const mm = two(m);
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${meses[m-1]} / ${ano}</h3>

      <div class="row">
        <input type="file" id="file-${ano}-${mm}" accept=".csv" style="display:none" />
        <div class="btns">
          <button class="btn" id="btnEscolher-${ano}-${mm}">Escolher CSV</button>
          <button class="btn primary" id="btnImportar-${ano}-${mm}">Importar</button>
        </div>
      </div>

      <div class="kpis">
        <div class="kpi"><b>Entradas</b><span id="in-${ano}-${mm}">-</span></div>
        <div class="kpi"><b>Saídas</b><span id="out-${ano}-${mm}">-</span></div>
        <div class="kpi"><b>Saldo</b><span id="bal-${ano}-${mm}">-</span></div>
      </div>

      <table class="resumo" id="tbl-${ano}-${mm}" style="margin-top:8px;">
        <thead>
          <tr><th style="width:55%">Categoria</th><th class="right" style="width:45%">Valor (R$)</th></tr>
        </thead>
        <tbody></tbody>
      </table>

      <div class="row" style="margin-top:10px;">
        <label>Produto Usado (CMV)<input type="number" step="0.01" min="0" id="cmv-${ano}-${mm}" placeholder="Ex.: 16151.57"></label>
        <label>Produto Comprado<input type="number" step="0.01" min="0" id="comp-${ano}-${mm}" placeholder="Ex.: 23223.03"></label>
        <label>Valor de Estoque<input type="number" step="0.01" min="0" id="stk-${ano}-${mm}" placeholder="Ex.: 39095.31"></label>
        <label>Perda Não Operacional<input type="number" step="0.01" min="0" id="loss-${ano}-${mm}" placeholder="Ex.: 0.00"></label>
      </div>

      <div class="row">
        <label>% Embalagem<input type="number" step="0.01" min="0" id="pemb-${ano}-${mm}" placeholder="Ex.: 0.80 (sobre Receita/CMV)"></label>
        <label>% Perda Operacional<input type="number" step="0.01" min="0" id="pper-${ano}-${mm}" placeholder="Ex.: 0.02 (2% sobre CMV)"></label>
        <div class="btns" style="align-items:flex-end;">
          <button class="btn primary" id="btnSalvarMov-${ano}-${mm}">Salvar Movimentação/Percentuais</button>
        </div>
      </div>

      <div class="hint">Importe o CSV do ERP para este mês. Depois preencha os campos de movimentação do produto e percentuais (se desejar) e salve.</div>
    `;
    grid.appendChild(card);

    // Listeners do upload
    const fileInput = card.querySelector(`#file-${ano}-${mm}`);
    const btnEscolher = card.querySelector(`#btnEscolher-${ano}-${mm}`);
    const btnImportar = card.querySelector(`#btnImportar-${ano}-${mm}`);
    const btnSalvarMov = card.querySelector(`#btnSalvarMov-${ano}-${mm}`);

    btnEscolher.addEventListener('click', () => fileInput.click());
    btnImportar.addEventListener('click', () => handleImportCSV(ano, mm, fileInput));
    btnSalvarMov.addEventListener('click', () => salvarMovParametros(ano, mm));

    // Carregar dados já salvos para o mês
    hidratarMes(ano, mm);
  }
}

/** ===========================
 *  Persistência no Firebase
 *  =========================== */
async function hidratarMes(ano, mm) {
  const base = `financeiro/imports/${ano}/${mm}`;
  const snap = await get(ref(db, base));
  if (!snap.exists()) return;

  const data = snap.val() || {};
  // KPIs
  setText(`in-${ano}-${mm}`, fmtNum(data.totalEntradas || 0));
  setText(`out-${ano}-${mm}`, fmtNum(data.totalSaidas || 0));
  setText(`bal-${ano}-${mm}`, fmtNum((data.totalEntradas || 0) - (data.totalSaidas || 0)));

  // Tabela
  renderTabelaCategorias(ano, mm, data.totalsByCategory || {});
  // Campos movimentação / percentuais
  const mov = data.movProd || {};
  setValue(`cmv-${ano}-${mm}`, mov.usado ?? '');
  setValue(`comp-${ano}-${mm}`, mov.comprado ?? '');
  setValue(`stk-${ano}-${mm}`, mov.estoque ?? '');
  setValue(`loss-${ano}-${mm}`, mov.perdaExtra ?? '');
  setValue(`pemb-${ano}-${mm}`, mov.percEmbalagem ?? '');
  setValue(`pper-${ano}-${mm}`, mov.percPerdaOperacional ?? '');
}

function setText(id, txt) {
  const el = document.getElementById(id);
  if (el) el.textContent = txt;
}
function setValue(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = (val ?? '') === '' ? '' : Number(val);
}

/** Renderiza a tabela resumida de categorias importadas */
function renderTabelaCategorias(ano, mm, totalsByCategory) {
  const tbody = document.querySelector(`#tbl-${ano}-${mm} tbody`);
  tbody.innerHTML = '';
  // Ordena por maior valor absoluto
  const entries = Object.entries(totalsByCategory || {}).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1]));
  entries.forEach(([cat, val]) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${cat}</td><td class="right">${fmtNum(val)}</td>`;
    tbody.appendChild(tr);
  });
}

/** Salva movimentação e percentuais */
async function salvarMovParametros(ano, mm) {
  const mov = {
    usado: +document.getElementById(`cmv-${ano}-${mm}`).value || 0,
    comprado: +document.getElementById(`comp-${ano}-${mm}`).value || 0,
    estoque: +document.getElementById(`stk-${ano}-${mm}`).value || 0,
    perdaExtra: +document.getElementById(`loss-${ano}-${mm}`).value || 0,
    percEmbalagem: +document.getElementById(`pemb-${ano}-${mm}`).value || 0,
    percPerdaOperacional: +document.getElementById(`pper-${ano}-${mm}`).value || 0,
  };
  const base = `financeiro/imports/${ano}/${mm}/movProd`;
  await set(ref(db, base), mov);
  alert('Movimentação e percentuais salvos ✔');
}

/** ===========================
 *  Importação CSV (ERP)
 *  =========================== */
async function handleImportCSV(ano, mm, fileInput) {
  if (!fileInput.files || !fileInput.files[0]) {
    alert('Selecione um arquivo CSV primeiro.');
    return;
  }
  const file = fileInput.files[0];
  const arrayBuffer = await file.arrayBuffer();

  // Tentar ler como CSV (usando SheetJS para robustez de encoding/delimitador)
  const wb = XLSX.read(arrayBuffer, { type: 'array', codepage: 65001 });
  // SheetJS tenta CSV como um único "Sheet" chamado "(CSV)" ou nome do arquivo
  const firstSheetName = wb.SheetNames[0];
  const ws = wb.Sheets[firstSheetName];
  let rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });

  if (!rows || !rows.length) {
    alert('CSV vazio ou inválido.');
    return;
  }

  // Descobrir índice de colunas possíveis
  const header = rows[0].map(h => (h||'').toString().trim().toLowerCase());
  let idxCategoria = header.findIndex(h => h.includes('categoria'));
  let idxValor     = header.findIndex(h => h.includes('valor') && !h.includes('total'));
  let idxTipo      = header.findIndex(h => h.includes('tipo'));
  // Algumas planilhas podem não ter data/descrição
  let idxData      = header.findIndex(h => h.includes('data'));
  let idxDesc      = header.findIndex(h => h.includes('descri'));

  // Se não houver header confiável (muitos relatórios CSV saem “em bloco”), tratamos por linhas/ seção
  const body = rows.slice(1);

  // Percorre linhas, tratando seções "Entradas" / "Saídas" e somando por categoria
  let currentTipo = '';
  const totalsByCategory = {};
  let totalEntradas = 0, totalSaidas = 0;

  for (const r of body) {
    const catRaw = (idxCategoria>=0 ? r[idxCategoria] : r[0]) || '';
    const valRaw = (idxValor>=0 ? r[idxValor] : r.find((c)=>/^-?\d/.test((c||'').toString().trim())) ) || '';
    const tipoRaw = (idxTipo>=0 ? r[idxTipo] : '');

    // Se a linha é uma seção
    const infer = inferTipoFromCategoria(catRaw);
    if (infer) {
      currentTipo = infer;
      continue; // não é lançamento
    }

    // Determinar tipo:
    let tipo = (tipoRaw||'').toString().trim().toLowerCase();
    if (!['entrada','saida','saída'].includes(tipo)) tipo = currentTipo || '';

    // Categoria (normalizada)
    const cat = (catRaw || '').toString().trim();
    if (!cat) continue;

    // Valor
    const valor = parseBRNumber(valRaw?.toString?.() ?? '');
    if (!isFinite(valor) || valor === 0) continue;

    // Ignorar cabeçalhos duplicados
    const low = cat.toLowerCase();
    if (['entradas','saídas','saidas','resultado','lucro/prejuizo mês','lucro/prejuizo acumulado'].includes(low)) continue;

    // Montar chave de categoria padrão "TIPO/NOME"
    const tipoKey = (tipo === 'entrada') ? 'ENTRADA' : 'SAIDA';
    const chaveCat = `${tipoKey}/${cat}`;

    totalsByCategory[chaveCat] = (totalsByCategory[chaveCat] || 0) + valor;
    if (tipo === 'entrada') totalEntradas += valor;
    else totalSaidas += valor;
  }

  // Persistir no Firebase
  const base = `financeiro/imports/${ano}/${mm}`;
  const payload = {
    meta: {
      source: 'CSV',
      filename: file.name,
      importedAt: new Date().toISOString()
    },
    totalsByCategory,
    totalEntradas,
    totalSaidas
  };
  await set(ref(db, base), payload);

  // Atualizar UI
  setText(`in-${ano}-${mm}`, fmtNum(totalEntradas));
  setText(`out-${ano}-${mm}`, fmtNum(totalSaidas));
  setText(`bal-${ano}-${mm}`, fmtNum(totalEntradas - totalSaidas));
  renderTabelaCategorias(ano, mm, totalsByCategory);

  alert(`Mês ${mm}/${ano}: CSV importado com sucesso ✔`);
}

/** ===========================
 *  Boot
 *  =========================== */
(async function init(){
  await carregarCategorias();
  montarAnos();
  renderMeses();
})();
