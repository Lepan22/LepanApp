const firebaseConfig = {
  apiKey: "AIzaSyBClDBA7f9-jfF6Nz6Ia-YlZ6G-hx3oerY",
  authDomain: "lepanapp.firebaseapp.com",
  databaseURL: "https://lepanapp-default-rtdb.firebaseio.com",
  projectId: "lepanapp",
  storageBucket: "lepanapp.appspot.com",
  messagingSenderId: "542989944344",
  appId: "1:542989944344:web:576e28199960fd5440a56d"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

document.getElementById('gerarBtn').addEventListener('click', gerarPrevisao);
document.getElementById('salvarBtn').addEventListener('click', salvarPrevisao);

let dadosPrevisao = [];

function gerarPrevisao() {
  const ano = document.getElementById('anoSelect').value;
  const mes = document.getElementById('mesSelect').value;
  const anoMes = `${ano}_${mes}`;

  const tabela = document.getElementById('tabelaPrevisao');
  tabela.innerHTML = '';
  dadosPrevisao = [];

  Promise.all([
    db.ref(`projecao_eventos/${anoMes}`).once('value'),
    db.ref('media_cliente').once('value'),
    db.ref('clientes').once('value')
  ]).then(([projecaoSnap, mediaSnap, clientesSnap]) => {
    const eventos = projecaoSnap.val() || {};
    const medias = mediaSnap.val() || {};
    const clientes = clientesSnap.val() || {};

    Object.values(eventos).forEach(ev => {
      const nomeEvento = ev.nomeEvento || 'Sem nome';
      const data = ev.data || 'Sem data';

      // Encontrar o cliente correspondente
      let clienteId = '';
      for (let id in clientes) {
        const cli = clientes[id];
        if (cli.clienteAtivo && cli.clienteAtivo.nomeEvento === nomeEvento) {
          clienteId = id;
          break;
        }
      }

      const media = clienteId && medias[clienteId] ? medias[clienteId] : 0;

      dadosPrevisao.push({
        clienteId,
        nomeEvento,
        data,
        media,
        total: media
      });

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${nomeEvento}</td>
        <td>${data}</td>
        <td>R$ ${media.toFixed(2)}</td>
      `;
      tabela.appendChild(tr);
    });
  });
}

function salvarPrevisao() {
  const ano = document.getElementById('anoSelect').value;
  const mes = document.getElementById('mesSelect').value;
  const anoMes = `${ano}_${mes}`;

  if (dadosPrevisao.length === 0) {
    alert("Nenhum dado gerado para salvar.");
    return;
  }

  if (!confirm("Deseja salvar a previsão de receita para este mês? Isso substituirá a projeção anterior.")) return;

  const updates = {};
  let totalGeral = 0;

  dadosPrevisao.forEach(ev => {
    const id = `${ev.clienteId}_${ev.data.replace(/\//g, '-')}`;
    updates[id] = {
      nomeEvento: ev.nomeEvento,
      data: ev.data,
      clienteId: ev.clienteId,
      media: ev.media,
      totalPrevisto: ev.total
    };
    totalGeral += ev.total;
  });

  updates['total'] = totalGeral;

  db.ref(`previsao_receita/${anoMes}`).remove().then(() => {
    db.ref(`previsao_receita/${anoMes}`).set(updates).then(() => {
      alert("Previsão de receita salva com sucesso!");
    });
  });
}
