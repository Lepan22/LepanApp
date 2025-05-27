const db = firebase.database();

let mesAtual = new Date();
let eventos = [];
let clientes = [];
let eventosProjetados = [];
let totalProjecao = 0;

function mudarMes(delta) {
  mesAtual.setMonth(mesAtual.getMonth() + delta);
  atualizarInterface();
}

async function carregarDados() {
  eventos = [];
  eventosProjetados = [];
  clientes = [];

  const eventosSnap = await db.ref('eventos').once('value');
  eventosSnap.forEach(child => {
    const evento = child.val();
    evento.id = child.key;
    eventos.push(evento);
  });

  const clientesSnap = await db.ref('clientes').once('value');
  clientesSnap.forEach(child => {
    const cliente = child.val();
    cliente.id = child.key;
    if (cliente.clienteAtivo && cliente.clienteAtivo.status === 'Fechado') {
      clientes.push(cliente);
    }
  });

  await gerarEventosProjetados();
  atualizarInterface();
}

async function gerarEventosProjetados() {
  const ano = mesAtual.getFullYear();
  const mes = (mesAtual.getMonth() + 1).toString().padStart(2, '0');
  totalProjecao = 0;

  for (const cliente of clientes) {
    const freq = cliente.clienteAtivo.frequencia;
    const dias = cliente.clienteAtivo.diasSemana || [];
    const clienteId = cliente.id;

    let quantidadeEventos = 0;
    if (freq === 'semanal') quantidadeEventos = 4;
    else if (freq === 'quinzenal') quantidadeEventos = 2;
    else if (freq === 'mensal') quantidadeEventos = 1;

    const mediaSnap = await db.ref(`media_cliente/${clienteId}`).once('value');
    const media = mediaSnap.val() || 0;

    totalProjecao += (media * quantidadeEventos);

    for (let i = 0; i < quantidadeEventos; i++) {
      eventosProjetados.push({
        nomeEvento: cliente.nomeEvento || cliente.nome,
        data: `${ano}-${mes}-${(i * 7 + 1).toString().padStart(2, '0')}`,
        status: 'Projetado',
        tipo: 'projetado'
      });
    }
  }
}

function atualizarInterface() {
  document.getElementById('mesAtual').textContent = mesAtual.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
  renderizarCalendario();
  listarEventos();
}

function renderizarCalendario() {
  const calendario = document.getElementById('calendario');
  calendario.innerHTML = '';

  const cabecalho = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
  cabecalho.forEach(dia => {
    const div = document.createElement('div');
    div.classList.add('cabecalho');
    div.textContent = dia;
    calendario.appendChild(div);
  });

  const ano = mesAtual.getFullYear();
  const mes = mesAtual.getMonth();
  const primeiroDia = new Date(ano, mes, 1);
  const ultimoDia = new Date(ano, mes + 1, 0);
  const diaSemanaInicio = (primeiroDia.getDay() + 6) % 7;

  for (let i = 0; i < diaSemanaInicio; i++) {
    calendario.appendChild(document.createElement('div'));
  }

  const semanaAtual = getSemanaAtual();
  const eventosTodos = [...eventos, ...eventosProjetados];

  for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
    const data = new Date(ano, mes, dia);
    const dataStr = data.toISOString().split('T')[0];

    const divDia = document.createElement('div');
    divDia.classList.add('dia');

    if (semanaAtual.includes(dataStr)) {
      divDia.classList.add('semana-atual');
    }

    const numeroDia = document.createElement('div');
    numeroDia.textContent = dia;
    divDia.appendChild(numeroDia);

    eventosTodos.filter(ev => ev.data === dataStr).forEach(ev => {
      const eventoDiv = document.createElement('div');
      eventoDiv.classList.add('evento-dia');
      eventoDiv.style.background = ev.tipo === 'projetado' ? 'lightblue' : '#ff7f00';
      eventoDiv.textContent = ev.nomeEvento || 'Sem nome';
      divDia.appendChild(eventoDiv);
    });

    calendario.appendChild(divDia);
  }
}

function listarEventos() {
  const tbody = document.getElementById('tabelaEventos');
  tbody.innerHTML = '';

  const ano = mesAtual.getFullYear();
  const mes = (mesAtual.getMonth() + 1).toString().padStart(2, '0');
  const eventosTodos = [...eventos, ...eventosProjetados];

  const eventosFiltrados = eventosTodos.filter(e => e.data && e.data.startsWith(`${ano}-${mes}`));

  eventosFiltrados.forEach(e => {
    const cor = e.tipo === 'projetado' ? 'style="color: lightblue;"' : 'style="color: orange;"';
    const tr = document.createElement('tr');
    tr.innerHTML = `<td ${cor}>${e.nomeEvento || '-'}</td><td>${e.data || '-'}</td><td>${e.status || '-'}</td>`;
    tbody.appendChild(tr);
  });
}

function getSemanaAtual() {
  const hoje = new Date();
  const diaSemana = hoje.getDay();
  const inicio = new Date(hoje);
  inicio.setDate(hoje.getDate() - diaSemana + 1);
  const datas = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(inicio);
    d.setDate(inicio.getDate() + i);
    datas.push(d.toISOString().split('T')[0]);
  }
  return datas;
}

function salvarProjecao() {
  const ano = mesAtual.getFullYear();
  const mes = (mesAtual.getMonth() + 1).toString().padStart(2, '0');
  const path = `projecaoReceita/${ano}-${mes}/total`;

  db.ref(path).once('value').then(snapshot => {
    if (snapshot.exists()) {
      alert('Projeção já existente, não sobrescrevida.');
    } else {
      if (confirm('Deseja realmente salvar a projeção de receita deste mês?')) {
        db.ref(path).set(totalProjecao.toFixed(2));
        alert('Projeção salva com sucesso!');
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', carregarDados);
