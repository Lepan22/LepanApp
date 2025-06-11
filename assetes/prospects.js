import { db } from './firebase-config.js';
import {
  ref,
  push,
  set
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formContato');
  const listaContatos = document.getElementById('listaContatos');
  const listaProspects = document.getElementById('listaProspects');

  document.getElementById('btnAddContato').addEventListener('click', () => {
    const div = document.createElement('div');
    div.className = 'contato-item';
    div.innerHTML = `
      <input type="text" class="contato-nome" placeholder="Nome do Contato" required>
      <input type="text" class="contato-telefone" placeholder="Telefone">
      <input type="email" class="contato-email" placeholder="Email">
      <button type="button" onclick="this.parentElement.remove()">Remover</button>
    `;
    listaContatos.appendChild(div);
  });

  document.getElementById('btnAddProspect').addEventListener('click', () => {
    const div = document.createElement('div');
    div.className = 'prospect-item';
    div.innerHTML = `
      <input type="text" class="prospect-nome" placeholder="Nome do Prospect" required>
      <select class="prospect-status">
        <option value="Aberto">Aberto</option>
        <option value="Negociando">Negociando</option>
        <option value="Fechado">Fechado</option>
        <option value="Perdido">Perdido</option>
      </select>
      <button type="button" onclick="this.parentElement.remove()">Remover</button>
    `;
    listaProspects.appendChild(div);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const tipo = document.getElementById('tipo').value.trim();
    const nome = document.getElementById('nomeContato').value.trim();

    const contatos = Array.from(document.querySelectorAll('.contato-item')).map(item => ({
      nome: item.querySelector('.contato-nome').value.trim(),
      telefone: item.querySelector('.contato-telefone').value.trim(),
      email: item.querySelector('.contato-email').value.trim()
    }));

    const prospects = Array.from(document.querySelectorAll('.prospect-item')).map(item => ({
      nome: item.querySelector('.prospect-nome').value.trim(),
      status: item.querySelector('.prospect-status').value
    }));

    const novoCadastro = {
      tipo,
      nome,
      contatos,
      prospects,
      criadoEm: new Date().toISOString()
    };

    try {
      await set(push(ref(db, 'prospecao')), novoCadastro);
      alert('Salvo com sucesso!');
      location.reload();
    } catch (error) {
      alert('Erro ao salvar: ' + error.message);
    }
  });
});
