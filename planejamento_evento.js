function exibirEventos(lista) {
  const container = document.getElementById("listaEventos");
  container.innerHTML = "";

  if (lista.length === 0) {
    container.innerHTML = "<p>Nenhum evento encontrado nesta semana.</p>";
    return;
  }

  lista.forEach((evento, index) => {
    const div = document.createElement("div");
    div.className = "evento";

    const titulo = document.createElement("h2");
    titulo.textContent = `${formatarDataBR(evento.data)} - ${evento.nomeEvento}`;
    div.appendChild(titulo);

    const label = document.createElement("label");
    label.textContent = "Equipe:";
    div.appendChild(label);

    const select = document.createElement("select");
    select.setAttribute("multiple", true);
    select.id = `selectEquipe_${index}`;
    select.dataset.eventoId = evento.id;

    for (const [id, nome] of Object.entries(evento.equipeMap)) {
      const option = document.createElement("option");
      option.value = id;
      option.textContent = nome;
      if (evento.equipeSelecionada.includes(id)) {
        option.setAttribute("selected", "selected");
      }
      select.appendChild(option);
    }

    div.appendChild(select);
    container.appendChild(div);

    // Aguarda o próximo ciclo para ativar Choices após DOM reconhecer os selected
    setTimeout(() => {
      new Choices(select, {
        removeItemButton: true,
        placeholder: true,
        placeholderValue: 'Selecione membros...',
        searchEnabled: true,
        shouldSort: false
      });
    }, 0);
  });
}
