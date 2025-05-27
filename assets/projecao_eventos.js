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

let clientes = [];
let eventosReais = [];
let indisponibilidades = [];
let eventosProjetados = [];
let resumoClientes = {};
let totalEstimado = 0;

async function carregarDados() {
  const clientesSnap = await db.ref('clientes').once('value');
  clientesSnap.forEach(c => {
    const cli = c.val();
    cli.id = c.key;
    if (cli.status === "Fechado" && cli.clienteAtivo && cli.clienteAtivo.statusEvento === "Ativo") {
      clientes.push(cli);
    }
  });

  const eventosSnap = await db.ref('eventos').once('value');
  eventosSnap.forEach(e => eventosReais.push(e.val()));

  const indisSnap = await db.ref('configuracao/diasIndisponiveis').once('value');
  indisSnap.forEach(i => indisponibilidades.push(i.val()));

  gerarProjecoes();
}

function gerarProjecoes() {
  const hoje = new Date();
  const fim = new Date('2025-12-31');

  clientes.forEach(cliente => {
    const ativo = cliente.clienteAtivo;
    const nomeEvento = ativo.nomeEvento || "Evento";
    const frequencia = ativo.frequencia;
    const diasSemana = ativo.diasSemana || [];
    const clienteId = cliente.id;

    resumoClientes[clienteId] = { nome: nomeEvento, qtd: 0, media: 0, estimativa: 0 };

    db.ref('media_cliente/' + clienteId).once('value').then(mediaSnap => {
      const media = mediaSnap.val() || 0;
      resumoClientes[clienteId].media = media;

      let datas = [];

      if (frequencia === "Semanal") {
        diasSemana.forEach(dia => {
          for (let dt = new Date(hoje); dt <= fim; dt.setDate(dt.getDate() + 1)) {
            if (diaSemanaTexto(dt.getDay()) === dia) {
              datas.push(new Date(dt));
            }
          }
        });
      } else if (frequencia === "Quinzenal") {
        let lastEvent = eventosReais.filter(e => e.nomeEvento === nomeEvento)
          .map(e => new Date(e.data))
          .sort((a, b) => b - a)[0] || hoje;

        for (let dt = new Date(lastEvent); dt <= fim; dt.setDate(dt.getDate() + 14)) {
          datas.push(new Date(dt));
        }
      } else if (frequencia === "Mensal") {
        for (let m = hoje.getMonth(); m <= 11; m++) {
          let firstMonday = new Date(2025, m, 1);
          while (firstMonday.getDay() !== 1) firstMonday.setDate(firstMonday.getDate() + 1);
          datas.push(firstMonday);
        }
      }

      datas.forEach(data => {
        const dataStr = data.toISOString().split('T')[0];
        if (existeEventoReal(nomeEvento, dataStr) || indisponivel(dataStr)) return;

        eventosProjetados.push({ nomeEvento, data: dataStr, frequencia, status: "Projetado" });
        resumoClientes[clienteId].qtd++;
        resumoClientes[clienteId].estimativa += media;
        totalEstimado += media;
      });

      exibirProjetados();
      exibirResumo();
    });
  });
}

function diaSemanaTexto(num) {
  const dias = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"];
  return dias[num];
}

function existeEventoReal(nome, data) {
  return eventosReais.some(e => e.nomeEvento === nome && e.data === data);
}

function indisponivel(data) {
  return indisponibilidades.some(i => {
    if (i.data) return i.data === data;
    if (i.inicio && i.fim) return data >= i.inicio && data <= i.fim;
    return false;
  });
}

function exibirProjetados() {
  const tbody = document.getElementById('tabelaProjetados');
  tbody.innerHTML = '';
  eventosProjetados.forEach(ev => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${ev.nomeEvento}</td><td>${ev.data}</td><td>${ev.frequencia}</td><td>${ev.status}</td>`;
    tbody.appendChild(tr);
  });
}

function exibirResumo() {
  const tbody = document.getElementById('tabelaResumo');
  tbody.innerHTML = '';
  Object.values(resumoClientes).forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${r.nome}</td><td>${r.qtd}</td><td>R$ ${r.media.toFixed(2)}</td><td>R$ ${r.estimativa.toFixed(2)}</td>`;
    tbody.appendChild(tr);
  });
  document.getElementById('totalEstimado').innerText = totalEstimado.toFixed(2);
}

function salvarProjecao() {
  const mes = document.getElementById('mesSelect').value;
  const ano_mes = `2025_${mes}`;
  const projRef = db.ref('projecaoReceita/' + ano_mes);

  projRef.once('value').then(snap => {
    if (snap.exists()) {
      alert('Projeção já existente.');
    } else {
      if (confirm(`Deseja realmente salvar a projeção de receita para ${mes}/2025?`)) {
        projRef.child('total').set(totalEstimado);
        Object.keys(resumoClientes).forEach(cid => {
          projRef.child('clientes').child(cid).set(resumoClientes[cid].estimativa);
        });
        alert('Projeção salva com sucesso!');
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', carregarDados);
