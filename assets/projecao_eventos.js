// Arquivo: assets/projecao_eventos.js

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

let anoAtual = new Date().getFullYear();
let mesAtual = (new Date().getMonth() + 1).toString().padStart(2, '0');

document.getElementById('mesSelect').value = mesAtual;
document.getElementById('anoSelect').value = anoAtual;

const tabelaProjetados = document.getElementById('tabelaProjetados');
const tabelaResumo = document.getElementById('tabelaResumo');
const totalEstimadoEl = document.getElementById('totalEstimado');

let eventosProjetados = [];

function carregarProjecao() {
  const ano = document.getElementById('anoSelect').value;
  const mes = document.getElementById('mesSelect').value;

  const anoMes = `${ano}_${mes}`;
  db.ref(`projecao_eventos/${anoMes}`).once('value').then(snapshot => {
    eventosProjetados = [];

    snapshot.forEach(child => {
      eventosProjetados.push({ id: child.key, ...child.val() });
    });

    eventosProjetados.sort((a, b) => {
      const [da, ma, aa] = a.data.split('/');
      const [db, mb, ab] = b.data.split('/');
      return new Date(`20${aa}-${ma}-${da}`) - new Date(`20${ab}-${mb}-${db}`);
    });

    listarProjetados();
  });
}

function listarProjetados() {
  tabelaProjetados.innerHTML = '';

  eventosProjetados.forEach(ev => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${ev.nomeEvento}</td>
      <td>${ev.data}</td>
      <td>${ev.frequencia}</td>
      <td>
        <button class="btn btn-sm btn-warning" onclick="editarEvento('${ev.id}')">Editar</button>
        <button class="btn btn-sm btn-danger" onclick="excluirEvento('${ev.id}')">Excluir</button>
      </td>
    `;
    tabelaProjetados.appendChild(tr);
  });
}

function salvarProjecao() {
  if (!confirm('Deseja atualizar as projeções para os próximos 6 meses? Clientes inativos terão suas projeções removidas.')) return;

  const ano = parseInt(document.getElementById('anoSelect').value);
  let mes = parseInt(document.getElementById('mesSelect').value);

  db.ref('clientes').once('value').then(clientesSnap => {
    const clientes = [];

    clientesSnap.forEach(child => {
      const c = child.val();
      if (c.clienteAtivo && c.clienteAtivo.status === 'Ativo') {
        clientes.push({ id: child.key, ...c });
      }
    });

    for (let i = 0; i < 6; i++) {
      const projAno = mes + i > 12 ? ano + 1 : ano;
      const projMes = ((mes + i - 1) % 12) + 1;
      const anoMes = `${projAno}_${projMes.toString().padStart(2, '0')}`;

      db.ref(`projecao_eventos/${anoMes}`).once('value').then(snap => {
        const updates = {};

        snap.forEach(proj => {
          const p = proj.val();
          if (!clientes.find(c => c.id === p.clienteId)) {
            updates[proj.key] = null;
          }
        });

        clientes.forEach(cli => {
          const dias = Array.isArray(cli.clienteAtivo.diasSemana) ? cli.clienteAtivo.diasSemana : [cli.clienteAtivo.diaSemana];

          dias.forEach(diaSemana => {
            for (let d = 1; d <= 31; d++) {
              const data = new Date(projAno, projMes - 1, d);
              if (data.getMonth() !== projMes - 1) break;

              const diaSem = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][data.getDay()];
              if (!dias.includes(diaSem)) continue;

              let incluir = false;
              const freq = cli.clienteAtivo.frequencia;

              if (freq === 'Semanal') incluir = true;
              if (freq === 'Quinzenal' && Math.floor((d - 1) / 7) % 2 === 0) incluir = true;
              if (freq === 'Mensal' && d <= 7) incluir = true;

              if (incluir) {
                const dataStr = `${data.getDate().toString().padStart(2, '0')}/${(data.getMonth()+1).toString().padStart(2, '0')}/${data.getFullYear().toString().slice(-2)}`;
                const id = `${cli.id}_${dataStr.replace(/\//g, '')}`;

                updates[id] = {
                  clienteId: cli.id,
                  nomeEvento: cli.clienteAtivo.nomeEvento,
                  data: dataStr,
                  frequencia: freq,
                  status: 'Projetado'
                };
              }
            }
          });
        });

        db.ref(`projecao_eventos/${anoMes}`).update(updates);
      });
    }

    alert('Projeções atualizadas com sucesso!');
    carregarProjecao();
  });
}

function editarEvento(id) {
  const ev = eventosProjetados.find(e => e.id === id);
  const novoNome = prompt('Nome do Evento:', ev.nomeEvento);
  const novaData = prompt('Data (dd/mm/aa):', ev.data);

  if (novoNome && novaData) {
    db.ref(`projecao_eventos/${getAnoMes(novaData)}/${id}`).update({
      nomeEvento: novoNome,
      data: novaData
    }).then(() => carregarProjecao());
  }
}

function excluirEvento(id) {
  if (confirm('Deseja excluir este evento projetado?')) {
    const ev = eventosProjetados.find(e => e.id === id);
    db.ref(`projecao_eventos/${getAnoMes(ev.data)}/${id}`).remove().then(() => carregarProjecao());
  }
}

function getAnoMes(dataStr) {
  const [dia, mes, ano] = dataStr.split('/');
  return `20${ano}_${mes}`;
}

// Inicial
carregarProjecao();
