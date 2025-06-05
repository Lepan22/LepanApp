document.addEventListener('DOMContentLoaded', function () {
  const menuContainer = document.getElementById('menuLateral');
  if (menuContainer) {
    menuContainer.innerHTML = `
      <div class="logo-area">
        <h1>Le Pan</h1>
      </div>

      <div class="accordion" id="menuAccordion">
        <div class="accordion-item">
          <h2 class="accordion-header">
            <a class="accordion-button" href="/LepanApp/index.html">Home</a>
          </h2>
        </div>

        <div class="accordion-item">
          <h2 class="accordion-header">
            <a class="accordion-button collapsed" href="#" data-bs-toggle="collapse" data-bs-target="#eventos">Evento</a>
          </h2>
          <div id="eventos" class="accordion-collapse collapse" data-bs-parent="#menuAccordion">
            <div class="accordion-body">
              <a href="/LepanApp/eventos.html">Eventos</a>
              <a href="/LepanApp/compra_evento.html">Gerar Compra</a>
              <a href="/LepanApp/controle_etapas.html">Gestão Etapa</a>
              <a href="/LepanApp/agenda.html">Agenda</a>
              <a href="/LepanApp/relatorio/conferencia_vendas.html">Conferencia Evento</a>
            </div>
          </div>
        </div>

        <div class="accordion-item">
          <h2 class="accordion-header">
            <a class="accordion-button collapsed" href="#" data-bs-toggle="collapse" data-bs-target="#clientes">Cliente</a>
          </h2>
          <div id="clientes" class="accordion-collapse collapse" data-bs-parent="#menuAccordion">
            <div class="accordion-body">
              <a href="/LepanApp/clientes.html">Cadastrar Cliente</a>
              <a href="/LepanApp/gestao_Cliente.html">Gestão de Cliente</a>
            </div>
          </div>
        </div>

        <div class="accordion-item">
          <h2 class="accordion-header">
            <a class="accordion-button collapsed" href="#" data-bs-toggle="collapse" data-bs-target="#financeiro">Financeiro</a>
          </h2>
          <div id="financeiro" class="accordion-collapse collapse" data-bs-parent="#menuAccordion">
            <div class="accordion-body">
              <a href="/LepanApp/Importe_DRE.html">Importar DRE</a>
              <a href="/LepanApp/DRE.html">DRE</a>
            </div>
          </div>
        </div>

        <div class="accordion-item">
          <h2 class="accordion-header">
            <a class="accordion-button collapsed" href="#" data-bs-toggle="collapse" data-bs-target="#relatorios">Relatório</a>
          </h2>
          <div id="relatorios" class="accordion-collapse collapse" data-bs-parent="#menuAccordion">
            <div class="accordion-body">
              <a href="/LepanApp/relatorio/custos_eventos_relatorio.html">Relatório Custo Evento</a>
              <a href="/LepanApp/relatorio/equipe_relatorio.html">Análise por Equipe</a>
              <a href="/LepanApp/relatorio/eventos_relatorio.html">Análise por Cliente</a>
              <a href="/LepanApp/relatorio/perda_prod_relatorio.html">Relatório Perda Produto</a>
            </div>
          </div>
        </div>

        <div class="accordion-item">
          <h2 class="accordion-header">
            <a class="accordion-button collapsed" href="#" data-bs-toggle="collapse" data-bs-target="#configuracoes">Configuração</a>
          </h2>
          <div id="configuracoes" class="accordion-collapse collapse" data-bs-parent="#menuAccordion">
            <div class="accordion-body">
              <a href="/LepanApp/equipe.html">Cadastrar Equipe</a>
              <a href="/LepanApp/logistica.html">Cadastrar Logística</a>
              <a href="/LepanApp/produto.html">Cadastro Produtos</a>
              <a href="/LepanApp/projecao_eventos.html">Gerar Previsão Eventos</a>
              <a href="/LepanApp/previsao_receita.html">Gerar Previsão Receita</a>
              <a href="/LepanApp/gestao_agenda.html">Gestão da Agenda</a>
              <a href="/LepanApp/configuracao.html">Parâmetros Gerais</a>
              <a href="/LepanApp/Categoria_Fin.html">Cadastro Centro Custo</a>
              <a href="/LepanApp/media_cliente.html">Gerar Média PDV</a>
              <a href="/LepanApp/media_produtos.html">Gerar Média Produto</a>
            </div>
          </div>
        </div>
      </div>

      <button class="btn-voltar" onclick="history.back()">Voltar</button>
    `;
  }

  // Botão mobile
  const body = document.body;
  const menuToggle = document.createElement('button');
  menuToggle.className = 'menu-toggle';
  menuToggle.innerHTML = '☰';
  menuToggle.addEventListener('click', function () {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('open');
  });
  body.appendChild(menuToggle);

  // Acordeão e item ativo
  const accordionButtons = document.querySelectorAll('.accordion-button[data-bs-toggle="collapse"]');
  accordionButtons.forEach(button => {
    button.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('data-bs-target'));
      const isCollapsed = this.classList.contains('collapsed');
      document.querySelectorAll('.accordion-collapse.show').forEach(item => {
        if (item !== target) {
          item.classList.remove('show');
          const btn = document.querySelector(`[data-bs-target="#${item.id}"]`);
          if (btn) btn.classList.add('collapsed');
        }
      });
      if (isCollapsed) {
        target.classList.add('show');
        this.classList.remove('collapsed');
      } else {
        target.classList.remove('show');
        this.classList.add('collapsed');
      }
    });
  });

  // Marcar ativo
  const currentPage = window.location.pathname;
  const menuLinks = document.querySelectorAll('.sidebar a');
  menuLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href && currentPage.endsWith(href.replace('/LepanApp/', ''))) {
      link.classList.add('active');
      const parentCollapse = link.closest('.accordion-collapse');
      if (parentCollapse) {
        parentCollapse.classList.add('show');
        const parentButton = document.querySelector(`[data-bs-target="#${parentCollapse.id}"]`);
        if (parentButton) parentButton.classList.remove('collapsed');
      }
    }
  });
});
