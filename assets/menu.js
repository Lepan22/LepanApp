export function carregarMenu(base = './') {
  const menuContainer = document.getElementById('menuLateral');
  if (!menuContainer) return;

  menuContainer.innerHTML = `
    <div class="logo-area">
      <h1>Le Pan</h1>
    </div>

    <div class="accordion" id="menuAccordion">
      <div class="accordion-item">
        <h2 class="accordion-header">
          <a class="accordion-button" href="${base}index.html">Home</a>
        </h2>
      </div>

      <div class="accordion-item">
        <h2 class="accordion-header">
          <a class="accordion-button collapsed" href="#" data-bs-toggle="collapse" data-bs-target="#eventos">Evento</a>
        </h2>
        <div id="eventos" class="accordion-collapse collapse" data-bs-parent="#menuAccordion">
          <div class="accordion-body">
            <a href="${base}compra_evento.html">Gerar Compra</a>
            <a href="${base}controle_etapas.html">Gestão Etapa</a>
            <a href="${base}eventos.html">Eventos</a>
            <a href="${base}relatorio/conferencia_vendas.html">Conferência de Vendas</a>
          </div>
        </div>
      </div>

      <div class="accordion-item">
        <h2 class="accordion-header">
          <a class="accordion-button collapsed" href="#" data-bs-toggle="collapse" data-bs-target="#clientes">Cliente</a>
        </h2>
        <div id="clientes" class="accordion-collapse collapse" data-bs-parent="#menuAccordion">
          <div class="accordion-body">
            <a href="${base}clientes.html">Cadastrar Cliente</a>
            <a href="${base}gestao_Cliente.html">Gestão de Cliente</a>
          </div>
        </div>
      </div>

      <div class="accordion-item">
        <h2 class="accordion-header">
          <a class="accordion-button collapsed" href="#" data-bs-toggle="collapse" data-bs-target="#financeiro">Financeiro</a>
        </h2>
        <div id="financeiro" class="accordion-collapse collapse" data-bs-parent="#menuAccordion">
          <div class="accordion-body">
            <span style="padding: 10px 15px; display: block; color: #ccc;">Em construção</span>
          </div>
        </div>
      </div>

      <div class="accordion-item">
        <h2 class="accordion-header">
          <a class="accordion-button collapsed" href="#" data-bs-toggle="collapse" data-bs-target="#relatorios">Relatório</a>
        </h2>
        <div id="relatorios" class="accordion-collapse collapse" data-bs-parent="#menuAccordion">
          <div class="accordion-body">
            <a href="${base}relatorio/custos_eventos_relatorio.html">Relatório Custo Evento</a>
            <a href="${base}relatorio/equipe_relatorio.html">Análise por Equipe</a>
            <a href="${base}relatorio/eventos_relatorio.html">Análise por Cliente</a>
            <a href="${base}relatorio/perda_prod_relatorio.html">Relatório Perda Produto</a>
          </div>
        </div>
      </div>

      <div class="accordion-item">
        <h2 class="accordion-header">
          <a class="accordion-button collapsed" href="#" data-bs-toggle="collapse" data-bs-target="#configuracoes">Configuração</a>
        </h2>
        <div id="configuracoes" class="accordion-collapse collapse" data-bs-parent="#menuAccordion">
          <div class="accordion-body">
            <a href="${base}equipe.html">Cadastrar Equipe</a>
            <a href="${base}logistica.html">Cadastrar Logística</a>
            <a href="${base}produto.html">Cadastro Produtos</a>
            <a href="${base}projecao_eventos.html">Gerar Previsão Eventos</a>
            <a href="${base}previsao_receita.html">Gerar Previsão Receita</a>
            <a href="${base}gestao_agenda.html">Gestão da Agenda</a>
            <a href="${base}configuracao.html">Parâmetros Gerais</a>
            <a href="${base}media_cliente.html">Gerar Média PDV</a>
            <a href="${base}media_produtos.html">Gerar Média Produto</a>
          </div>
        </div>
      </div>
    </div>

    <button class="btn-voltar" onclick="history.back()">Voltar</button>
  `;
}
