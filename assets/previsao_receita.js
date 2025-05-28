const db = firebase.database();

let mesReferencia = new Date();
const tabelaPrevisao = document.getElementById('tabelaPrevisao');
const totalGeralEl = document.getElementById('totalGeral');

document.getElementById('atualizarPrevisaoBtn').addEventListener('click', atualizarPrevisao);

function atualizarMesTexto() {
  const mes = mesReferencia.getMonth() + 1;
  const ano = mesReferencia.getFullYear();
  document.getElementById('mesAtual').innerText = `${ano}-${mes.toString().padStart(2, '0')}`;
}

function alterarMes(delta) {
  mesReferencia.setMonth(mesReferencia.getMonth() + delta);
  carregarPrevisao();
}

function carregarPrevisao() {
  atualizarMesTexto();
  const anoMes = `${mesReferencia.getFullYear()}_${(mesReferencia.getMonth()+1).toString().padStart(2, '0')}`;

  Promise.all([
    db.ref(`projecao_eventos/${anoMes}`).once('value'),
    db.ref('media_cliente').once('value'),
    db.ref('clientes').once('value')
  ]).then(([projecaoSnap, mediasSnap, clientesSnap]) => {
    const eventos = projecaoSnap.val() || {};
    const medias = mediasSnap.val() || {};
    const clientes = clientesSnap.val() || {};

    tabelaPrevisao.innerHTML = '';
    let totalGeral = 0;

    Object.values(eventos).forEach(ev => {
      const clienteId = ev.clienteId;
      const media = medias[clienteId] || 0;
      const totalPrevisto = media;

      totalGeral += totalPrevisto;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${ev.data}</td>
        <td>${ev.nomeEvento}</td>
        <td>${clienteId}</td>
        <td>R$ ${media.toFixed(2)}</td>
        <td>R$ ${totalPrevisto.toFixed(2)}</td>
      `;
      tabelaPrevisao.appendChild(tr);
    });

    totalGeralEl.innerText = `R$ ${totalGeral.toFixed(2)}`;
  });
}

function atualizarPrevisao() {
  if (!confirm('Tem certeza que deseja atualizar a previsão financeira deste mês?')) return;

  const anoMes = `${mesReferencia.getFullYear()}_${(mesReferencia.getMonth()+1).toString().padStart(2, '0')}`;

  db.ref(`projecao_eventos/${anoMes}`).once('value').then(projecaoSnap => {
    const eventos = projecaoSnap.val() || {};

    db.ref('media_cliente').once('value').then(mediasSnap => {
      const medias = mediasSnap.val() || {};

      const updates = {};
      let totalGeral = 0;

      Object.values(eventos).forEach(ev => {
        const clienteId = ev.clienteId;
        const media = medias[clienteId] || 0;

        const totalPrevisto = media;

        const eventoId = `${clienteId}_${ev.data.replace(/\//g, '')}`;

        updates[eventoId] = {
          nomeEvento: ev.nomeEvento,
          data: ev.data,
          clienteId,
          media,
          totalPrevisto
        };

        totalGeral += totalPrevisto;
      });

      updates['total'] = totalGeral;

      db.ref(`previsao_receita/${anoMes}`).remove().then(() => {
        db.ref(`previsao_receita/${anoMes}`).set(updates).then(() => {
          alert('Previsão financeira atualizada com sucesso!');
          carregarPrevisao();
        });
      });
    });
  });
}

document.addEventListener('DOMContentLoaded', carregarPrevisao);
