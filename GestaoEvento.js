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
  const vendaPDV = parseFloat(document.getElementById('vendaPDV').value) || 0;
  const estimativaVenda = parseFloat(document.getElementById('estimativaVenda').value) || 0;

  let totalVendida = 0, vendaSistema = 0, custoPerda = 0, custoAssado = 0;
  listaProdutos.forEach(p => {
    const prod = produtosDisponiveis.find(x => x.id === p.produtoId) || { valorVenda: 0, custo: 0 };
    const vendida = (p.quantidade || 0) - (p.congelado || 0) - (p.assado || 0) - (p.perda || 0);
    totalVendida += vendida;
    vendaSistema += vendida * prod.valorVenda;
    custoPerda += (p.perda || 0) * prod.custo;
    custoAssado += (p.assado || 0) * prod.custo;
  });

  const custoEquipe = equipeAlocada.reduce((s, e) => s + (e.valor || 0), 0);
  const custoLogistica = logisticaAlocada.reduce((s, l) => s + (l.valor || 0), 0);
  const cmvCalculado = vendaPDV * (percentualCMV / 100);
  const lucroFinal = vendaPDV - cmvCalculado - custoEquipe - custoLogistica - custoPerda;
  const diferencaVenda = vendaPDV - vendaSistema;
  const potencialVenda = estimativaVenda - (custoEquipe + custoLogistica + custoAssado);

  document.getElementById('totalVendida').innerText = totalVendida;
  document.getElementById('vendaSistema').innerText = vendaSistema.toFixed(2);
  document.getElementById('diferencaVenda').innerText = diferencaVenda.toFixed(2);
  document.getElementById('cmvCalculado').innerText = cmvCalculado.toFixed(2);
  document.getElementById('lucroFinal').innerText = lucroFinal.toFixed(2);
  document.getElementById('custoPerda').innerText = custoPerda.toFixed(2);
  document.getElementById('valorAssados').innerText = custoAssado.toFixed(2);
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

    // Campos calculados agora gravados também
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
