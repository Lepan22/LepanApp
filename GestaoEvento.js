const firebaseConfig = {
  apiKey: "AIzaSyBClDBA7f9-jfF6Nz6Ia-YlZ6G-hx3oerY",
  authDomain: "lepanapp.firebaseapp.com",
  databaseURL: "https://lepanapp-default-rtdb.firebaseio.com",
  projectId: "lepanapp"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let equipeDisponivel = [], logisticaDisponivel = [], produtosDisponiveis = [];
let equipeAlocada = [], logisticaAlocada = [], listaProdutos = [];
let eventoId = null;
let percentualCMV = 0;

function carregarPercentualCMV() {
  return db.ref('/configuracao/percentualCMV').once('value').then(snapshot => {
    percentualCMV = snapshot.val() || 0;
  });
}

function calcularTotais() {
  let totalVendida = 0, vendaSistema = 0, custoPerda = 0, valorAssados = 0, cmvCalculado = 0, potencialVenda = 0;

  listaProdutos.forEach(item => {
    const produto = produtosDisponiveis.find(p => p.id === item.produtoId) || { valorVenda: 0, custo: 0 };
    const vendida = Math.max(0, item.quantidade - item.congelado - item.assado - item.perda);
    totalVendida += vendida;
    vendaSistema += vendida * produto.valorVenda;
    custoPerda += item.perda * produto.custo;
    valorAssados += item.assado * produto.custo;
    cmvCalculado += vendida * produto.custo;
    potencialVenda += item.quantidade * produto.valorVenda;
  });

  const vendaPDV = parseFloat(document.getElementById('vendaPDV').value) || 0;
  const cmvReal = vendaPDV * (percentualCMV / 100);
  document.getElementById('cmvReal').value = cmvReal.toFixed(2);

  const custoEquipe = equipeAlocada.reduce((s, e) => s + (e.valor || 0), 0);
  const custoLogistica = logisticaAlocada.reduce((s, l) => s + (l.valor || 0), 0);

  const diferencaVenda = vendaPDV - vendaSistema;
  const lucroFinal = vendaPDV - cmvReal - custoLogistica - custoEquipe - custoPerda;

  document.getElementById('totalVendida').innerText = totalVendida;
  document.getElementById('vendaSistema').innerText = vendaSistema.toFixed(2);
  document.getElementById('diferencaVenda').innerText = diferencaVenda.toFixed(2);
  document.getElementById('cmvCalculado').innerText = cmvCalculado.toFixed(2);
  document.getElementById('lucroFinal').innerText = lucroFinal.toFixed(2);
  document.getElementById('custoPerda').innerText = custoPerda.toFixed(2);
  document.getElementById('valorAssados').innerText = valorAssados.toFixed(2);
  document.getElementById('custoLogistica').innerText = custoLogistica.toFixed(2);
  document.getElementById('custoEquipe').innerText = custoEquipe.toFixed(2);
  document.getElementById('potencialVenda').innerText = potencialVenda.toFixed(2);
}

document.getElementById('formGestaoEvento').addEventListener('submit', function(e) {
  e.preventDefault();

  calcularTotais();

  const vendaPDV = parseFloat(document.getElementById('vendaPDV').value) || 0;
  const cmvReal = vendaPDV * (percentualCMV / 100);

  const evento = {
    nomeEvento: document.getElementById('nomeEvento').value,
    data: document.getElementById('data').value,
    responsavel: document.getElementById('responsavel').value,
    status: document.getElementById('status').value,
    vendaPDV: vendaPDV,
    cmvReal: cmvReal,
    estimativaVenda: parseFloat(document.getElementById('estimativaVenda').value) || 0,
    produtos: listaProdutos,
    equipe: equipeAlocada,
    logistica: logisticaAlocada,

    // CAMPOS CALCULADOS INCLUÍDOS
    totalVendida: parseInt(document.getElementById('totalVendida').innerText),
    vendaSistema: parseFloat(document.getElementById('vendaSistema').innerText),
    diferencaVenda: parseFloat(document.getElementById('diferencaVenda').innerText),
    cmvCalculado: parseFloat(document.getElementById('cmvCalculado').innerText),
    lucroFinal: parseFloat(document.getElementById('lucroFinal').innerText),
    custoPerda: parseFloat(document.getElementById('custoPerda').innerText),
    valorAssados: parseFloat(document.getElementById('valorAssados').innerText),
    custoLogistica: parseFloat(document.getElementById('custoLogistica').innerText),
    custoEquipe: parseFloat(document.getElementById('custoEquipe').innerText),
    potencialVenda: parseFloat(document.getElementById('potencialVenda').innerText)
  };

  const id = eventoId || db.ref('eventos').push().key;
  db.ref('eventos/' + id).set(evento).then(() => {
    alert('Evento salvo com sucesso!');
    window.location.href = "eventos.html";
  });
});

document.addEventListener("DOMContentLoaded", () => {
  carregarPercentualCMV().then(() => {
    carregarClientes();
    carregarResponsaveis();
    carregarEquipeDisponivel();
    carregarLogisticaDisponivel();
    carregarProdutosDisponiveis();
    carregarEventoExistente();
  });
});
