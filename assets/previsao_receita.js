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

function gerarPrevisao() {
  const ano = document.getElementById('anoSelect').value;
  const mes = document.getElementById('mesSelect').value;
  const anoMes = `${ano}_${mes}`;

  const tabela = document.getElementById('tabelaPrevisao');
  tabela.innerHTML = '';

  Promise.all([
    db.ref(`projecao_eventos/${anoMes}`).once('value'),
    db.ref('media_cliente').once('value')
  ]).then(([projecaoSnap, mediaSnap]) => {
    const eventos = projecaoSnap.val() || {};
    const medias = mediaSnap.val() || {};

    Object.values(eventos).forEach(ev => {
      const nomeEvento = ev.nomeEvento || 'Sem nome';
      const data = ev.data || 'Sem data';
      const clienteId = ev.clienteId || '';
      const media = clienteId && medias[clienteId] ? medias[clienteId] : 0;

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
