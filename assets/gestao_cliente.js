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

    if (!snapshot.exists()) {
      listaAtivos.innerHTML = '<tr><td colspan="4">Nenhum cliente encontrado.</td></tr>';
      listaQuentes.innerHTML = '<tr><td colspan="3">Nenhum cliente encontrado.</td></tr>';
      return;
    }

    snapshot.forEach(child => {
      const cliente = child.val();
      const id = child.key;

      const nome = cliente.nome || 'Sem nome';
      const statusPrincipal = cliente.status || '';
      const statusAtivo = cliente.clienteAtivo?.status || '';
      const dataPrimeiroEvento = cliente.clienteAtivo?.dataPrimeiroEvento || '';
      const dataUltimoContato = cliente.dataUltimoContato || '';

      // Cliente Ativo
      if (statusAtivo.toLowerCase() === 'ativo') {
        kpiAtivos++;
        listaAtivos.innerHTML += `
          <tr>
            <td>${nome}</td>
            <td>${formatarData(dataPrimeiroEvento)}</td>
            <td>${statusAtivo}</td>
            <td><button onclick="editarCliente('${id}')">Editar</button></td>
          </tr>
        `;
      }

      // Cliente Quente
      if (statusPrincipal.toLowerCase() === 'quente') {
        kpiQuentes++;
        listaQuentes.innerHTML += `
          <tr>
            <td>${nome}</td>
            <td>${statusPrincipal}</td>
            <td><button onclick="editarCliente('${id}')">Editar</button></td>
          </tr>
        `;
      }

      // Novos Clientes no Ano
      if (dataPrimeiroEvento && new Date(dataPrimeiroEvento).getFullYear() === anoAtual) {
        kpiNovosAno++;
      }

      // Clientes Perdidos no Ano
      if (dataUltimoContato && new Date(dataUltimoContato).getFullYear() === anoAtual) {
        kpiPerdidos++;
      }
    });

    // Atualiza KPIs
    document.getElementById('kpiAtivos').innerText = kpiAtivos;
    document.getElementById('kpiQuentes').innerText = kpiQuentes;
    document.getElementById('kpiNovosAno').innerText = kpiNovosAno;
    document.getElementById('kpiPerdidos').innerText = kpiPerdidos;
  }).catch(error => {
    console.error('Erro ao carregar clientes:', error);
    document.getElementById('listaClientesAtivos').innerHTML = '<tr><td colspan="4">Erro ao carregar dados.</td></tr>';
    document.getElementById('listaClientesQuentes').innerHTML = '<tr><td colspan="3">Erro ao carregar dados.</td></tr>';
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
