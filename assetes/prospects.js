import { db } from './firebase-config.js';
import {
  ref,
  push,
  set
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formContato');
  const btnAddContato = document.getElementById('btnAddContato');
  const btnAddProspect = document.getElementById('btnAddProspect');

  btnAddContato.addEventListener('click', adicionarContato);
  btnAddProspect.addEventListener('click', adicionarProspect);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const tipo = document.getElementById('tipo').value.trim();
    const nome = document.getElementById('nomeContato').value.trim();

    const contatos = [];
    document.querySelectorAll('.contato-item').forEach(div => {
      const nome = div.querySelector('.contato-nome').value.trim();
      const telefone = div.querySelector('.contato-telefone').value.trim();
      const email = div.querySelector('.contato-email').value.trim();
      if (nome) contatos.push({ nome, telefone, email });
    });

    const prospects = [];
    document.querySelectorAll('.prospect-item').forEach(div => {
      const nome = div.querySelector('.prospect-nome').value.trim();
      const status = div.querySelector('.prospect-status').value;
      if (nome) prospects.push({ nome, status });
    });

    const novoContato = {
      tipo, nome, contatos, prospects,
      criadoEm: new Date().toISOString()
    };

    const refContato = push(ref(db, 'prospecao'));
    await set(refContato, novoContato);

    alert('Contato salvo com sucesso!');
    location.reload();
  });
});

function adicionarContato() {
  const div = document.createElement('div');
  div.className = 'contato-item';
  div.innerHTML = `
    <input type="text" class="contato-nome" placeholder="Nome do Contato">
    <input type="text" class="contato-telefone" placeholder="Telefone">
    <input type="email" class="contato-email" placeholder="Email">
    <button type="button" onclick="this.parentElement.remove()">Remover</button>
  `;
  document.getElementById('listaContatos').appendChild(div);
}

function adicionarProspect() {
  const div = document.createElement('div');
  div.className = 'prospect-item';
  div.innerHTML = `
    <input type="text" class="prospect-nome" placeholder="Nome do Prospect">
    <select class="prospect-status">
      <option value="Aberto">Aberto</option>
      <option value="Negociando">Negociando</option>
      <option value="Fechado">Fechado</option>
      <option value="Perdido">Perdido</option>
    </select>
    <button type="button" onclick="this.parentElement.remove()">Remover</button>
  `;
  document.getElementById('listaProspects').appendChild(div);
}
