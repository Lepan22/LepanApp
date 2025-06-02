// Firebase já está inicializado no HTML
const db = firebase.database();
const anoAtual = new Date().getFullYear();

function carregarClientes() {
  db.ref('clientes').once('value').then(snapshot => {
    const listaAtivos = document.getElementById('listaClientesAtivos');
    const listaQuentes = document.getElementById('listaClientesQuentes');
    let kpiAtivos = 0;
    let kpiQuentes = 0;
    let kpiNovosAno = 0;
    let kpiPerdidos = 0;

    listaAtivos.innerHTML = '';
    listaQuentes.innerHTML = '';

    snapshot.forEach(child => {
      const cliente = child.val();
      const id = child.key;

      const status = (cliente.clienteAtivo && cliente.clienteAtivo.status) || cliente.status || '';
      const nome = cliente.nome || 'Sem nome';
      const dataPrimeiroEvento = cliente.clienteAtivo?.dataPrimeiroEvento || '';
      const dataUltimoContato = cliente.dataUltimoContato || '';

      const isAtivo = status.toLowerCase() === 'ativo';
      const isQuente = status.toLowerCase() === 'quente';

      // KPI: Clientes Ativos
      if (isAtivo) {
        kpiAtivos++;
        listaAtivos.innerHTML += `
          <tr>
            <td>${nome}</td>
            <td>${formatarData(dataPrimeiroEvento)}</td>
            <td>${status}</td>
            <td><button onclick="editarCliente('${id}')">Editar</button></td>
          </tr>
        `;
      }

      // KPI: Clientes Quentes
      if (isQuente) {
        kpiQuentes++;
        listaQuentes.innerHTML += `
          <tr>
            <td>${nome}</td>
            <td>${status}</td>
            <td><button onclick="editarCliente('${id}')">Editar</button></td>
          </tr>
        `;
      }

      // KPI: Novos Clientes no Ano
      if (dataPrimeiroEvento && new Date(dataPrimeiroEvento).getFullYear() === anoAtual) {
        kpiNovosAno++;
      }

      // KPI: Clientes Perdidos no Ano
      if (dataUltimoContato && new Date(dataUltimoContato).getFullYear() === anoAtual) {
        kpiPerdidos++;
      }
    });

    document.getElementById('kpiAtivos').innerText = kpiAtivos;
    document.getElementById('kpiQuentes').innerText = kpiQuentes;
    document.getElementById('kpiNovosAno').innerText = kpiNovosAno;
    document.getElementById('kpiPerdidos').innerText = kpiPerdidos;
  });
}

function editarCliente(id) {
  window.location.href = `cadastro_cliente.html?id=${id}`;
}

function formatarData(dataStr) {
  if (!dataStr) return '';
  const data = new Date(dataStr);
  if (isNaN(data)) return '';
  return data.toLocaleDateString('pt-BR');
}

document.addEventListener('DOMContentLoaded', carregarClientes);
