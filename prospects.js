const db = firebase.database();

document.getElementById('formContato').addEventListener('submit', async (e) => {
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
    if (nome) prospects.push({ nome });
  });

  const novoContato = {
    tipo, nome, contatos, prospects,
    criadoEm: new Date().toISOString()
  };

  await db.ref('prospecao').push(novoContato);
  alert('Contato salvo com sucesso!');
  location.reload();
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
    <button type="button" onclick="this.parentElement.remove()">Remover</button>
  `;
  document.getElementById('listaProspects').appendChild(div);
}
