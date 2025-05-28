document.addEventListener('DOMContentLoaded', function() {
  // Carregar o menu
  const menuContainer = document.getElementById('menuLateral');
  if (menuContainer) {
    menuContainer.innerHTML = `
      <div class="logo-area">
        <h1>Le Pan</h1>
      </div>
      
      <div class="accordion" id="menuAccordion">
        <div class="accordion-item">
          <h2 class="accordion-header">
            <a class="accordion-button" href="index.html">Home</a>
          </h2>
        </div>

        <div class="accordion-item">
          <h2 class="accordion-header">
            <a class="accordion-button collapsed" href="cadastros.html" data-bs-toggle="collapse" data-bs-target="#cadastros">Cadastros</a>
          </h2>
          <div id="cadastros" class="accordion-collapse collapse" data-bs-parent="#menuAccordion">
            <div class="accordion-body">
              <a href="produto.html">Produtos</a>
              <a href="clientes.html">Clientes</a>
              <a href="equipe.html">Equipe</a>
              <a href="logistica.html">Logística</a>
            </div>
          </div>
        </div>

        <div class="accordion-item">
          <h2 class="accordion-header">
            <a class="accordion-button collapsed" href="eventos.html" data-bs-toggle="collapse" data-bs-target="#eventos">Eventos</a>
          </h2>
          <div id="eventos" class="accordion-collapse collapse" data-bs-parent="#menuAccordion">
            <div class="accordion-body">
              <a href="GestaoEvento.html">Gestão de Evento</a>
              <a href="compra_evento.html">Compras</a>
              <a href="controle_etapas.html">Controle de Etapas</a>
              <a href="visualizar_evento.html">Visualizar Evento</a>
            </div>
          </div>
        </div>

        <div class="accordion-item">
          <h2 class="accordion-header">
            <a class="accordion-button collapsed" href="agenda.html" data-bs-toggle="collapse" data-bs-target="#agenda">Agenda</a>
          </h2>
          <div id="agenda" class="accordion-collapse collapse" data-bs-parent="#menuAccordion">
            <div class="accordion-body">
              <a href="agenda.html">Agenda de Eventos</a>
              <a href="gestao_agenda.html">Gestão da Agenda</a>
              <a href="projecao_eventos.html">Projeção de Eventos</a>
              <a href="previsao_receita.html">Previsão de Receita</a>
            </div>
          </div>
        </div>

        <div class="accordion-item">
          <h2 class="accordion-header">
            <a class="accordion-button collapsed" href="relatorios.html" data-bs-toggle="collapse" data-bs-target="#relatorios">Relatórios</a>
          </h2>
          <div id="relatorios" class="accordion-collapse collapse" data-bs-parent="#menuAccordion">
            <div class="accordion-body">
              <a href="relatorio/eventos_relatorio.html">Eventos por Cliente</a>
              <a href="relatorio/equipe_relatorio.html">Equipe</a>
              <a href="relatorio/custos_eventos_relatorio.html">Custos dos Eventos</a>
              <a href="relatorio/perda_prod_relatorio.html">Perdas de Produtos</a>
            </div>
          </div>
        </div>

        <div class="accordion-item">
          <h2 class="accordion-header">
            <a class="accordion-button collapsed" href="configuracao.html" data-bs-toggle="collapse" data-bs-target="#configuracoes">Configurações</a>
          </h2>
          <div id="configuracoes" class="accordion-collapse collapse" data-bs-parent="#menuAccordion">
            <div class="accordion-body">
              <a href="configuracao.html">Parâmetros Gerais</a>
            </div>
          </div>
        </div>

        <div class="accordion-item">
          <h2 class="accordion-header">
            <a class="accordion-button collapsed" href="financeiro.html" data-bs-toggle="collapse" data-bs-target="#financeiro">Financeiro</a>
          </h2>
          <div id="financeiro" class="accordion-collapse collapse" data-bs-parent="#menuAccordion">
            <div class="accordion-body">
              <a href="financeiro_lancamentos.html">Lançamentos</a>
              <a href="financeiro_fluxo_caixa.html">Fluxo de Caixa</a>
              <a href="financeiro_contas_pagar.html">Contas a Pagar</a>
              <a href="financeiro_contas_receber.html">Contas a Receber</a>
              <a href="financeiro_relatorios.html">Relatórios</a>
            </div>
          </div>
        </div>
      </div>

      <button class="btn-voltar" onclick="history.back()">Voltar</button>
    `;
  }

  // Adicionar botão de toggle para dispositivos móveis
  const body = document.body;
  const menuToggle = document.createElement('button');
  menuToggle.className = 'menu-toggle';
  menuToggle.innerHTML = '☰';
  menuToggle.addEventListener('click', function() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('open');
  });
  body.appendChild(menuToggle);

  // Funcionalidade do acordeão
  const accordionButtons = document.querySelectorAll('.accordion-button[data-bs-toggle="collapse"]');
  accordionButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      
      const target = document.querySelector(this.getAttribute('data-bs-target'));
      const isCollapsed = this.classList.contains('collapsed');
      
      // Fechar todos os outros itens
      document.querySelectorAll('.accordion-collapse.show').forEach(item => {
        if (item !== target) {
          item.classList.remove('show');
          const btn = document.querySelector(`[data-bs-target="#${item.id}"]`);
          if (btn) btn.classList.add('collapsed');
        }
      });
      
      // Alternar o estado do item atual
      if (isCollapsed) {
        target.classList.add('show');
        this.classList.remove('collapsed');
      } else {
        target.classList.remove('show');
        this.classList.add('collapsed');
      }
    });
  });

  // Destacar item ativo do menu
  const currentPage = window.location.pathname.split('/').pop();
  const menuLinks = document.querySelectorAll('.sidebar a');
  
  menuLinks.forEach(link => {
    const linkHref = link.getAttribute('href');
    if (linkHref === currentPage) {
      link.classList.add('active');
      
      // Se for um submenu, abrir o acordeão pai
      const parentCollapse = link.closest('.accordion-collapse');
      if (parentCollapse) {
        parentCollapse.classList.add('show');
        const parentButton = document.querySelector(`[data-bs-target="#${parentCollapse.id}"]`);
        if (parentButton) {
          parentButton.classList.remove('collapsed');
        }
      }
    }
  });
});
