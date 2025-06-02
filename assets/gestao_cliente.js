import { db } from './firebase-config.js';
import { ref, get } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

function carregarClientesAtivos() {
  const corpoTabela = document.getElementById('listaClientesAtivos');
  corpoTabela.innerHTML = '';

  const clientesRef = ref(db, 'clientes');

  get(clientesRef)
    .then(snapshot => {
      if (!snapshot.exists()) {
        corpoTabela.innerHTML = '<tr><td colspan="4">Nenhum cliente encontrado.</td></tr>';
        return;
      }

      let encontrou = false;

      snapshot.forEach(child => {
        const cliente = child.val();
        const id = child.key;
        const nome = cliente.nome || 'Sem nome';
        const statusEvento = cliente.clienteAtivo?.status || '';
        const dataPrimeiroEvento = cliente.clienteAtivo?.dataPrimeiroEvento || '';

        if (statusEvento.toLowerCase() === 'ativo') {
          encontrou = true;
          corpoTabela.innerHTML += `
            <tr>
              <td>${nome}</td>
              <td>${formatarData(dataPrimeiroEvento)}</td>
              <td>${statusEvento}</td>
              <td><button onclick="editarCliente('${id}')">Editar</button></td>
            </tr>
          `;
        }
      });

      if (!encontrou) {
        corpoTabela.innerHTML = '<tr><td colspan="4">Nenhum cliente ativo encontrado.</td></tr>';
      }
    })
    .catch(error => {
      console.error('Erro ao carregar clientes:', error);
      corpoTabela.innerHTML = '<tr><td colspan="4">Erro ao carregar dados.</td></tr>';
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

document.addEventListener('DOMContentLoaded', carregarClientesAtivos);
