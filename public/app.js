// PAPELSYS - Frontend Application Logic
document.addEventListener('DOMContentLoaded', () => {
  // State
  let perdas = [];
  let kpis = {};

  // DOM Elements
  const liveClock = document.getElementById('live-clock');
  const navItems = document.querySelectorAll('.nav-item');
  const contentViews = document.querySelectorAll('.content-view');
  const pageTitle = document.getElementById('page-title');
  const pageSubtitle = document.getElementById('page-subtitle');

  // KPI Elements
  const kpiTotalTon = document.getElementById('kpi-total-ton');
  const kpiTotalKg = document.getElementById('kpi-total-kg');
  const kpiTotalHoras = document.getElementById('kpi-total-horas');
  const kpiTotalMin = document.getElementById('kpi-total-min');
  const kpiTotalCusto = document.getElementById('kpi-total-custo');
  const kpiTotalRegistros = document.getElementById('kpi-total-registros');
  const alertText = document.getElementById('alert-text');

  // Chart & Table Containers
  const paretoChart = document.getElementById('pareto-chart');
  const machineChart = document.getElementById('machine-chart');
  const recentTableBody = document.getElementById('recent-table-body');
  const historyTableBody = document.getElementById('history-table-body');

  // Form Elements
  const formApontamento = document.getElementById('form-apontamento');
  const inputQuantidade = document.getElementById('input-quantidade');
  const calcHint = document.getElementById('calc-hint');
  const inputDataHora = document.getElementById('input-data-hora');

  // History Filter Elements
  const filterSearch = document.getElementById('filter-search');
  const filterMaquina = document.getElementById('filter-maquina');
  const btnExportCsv = document.getElementById('btn-export-csv');

  // Chat Elements
  const chatMessages = document.getElementById('chat-messages');
  const chatInput = document.getElementById('chat-input');
  const btnSendChat = document.getElementById('btn-send-chat');
  const btnClearChat = document.getElementById('btn-clear-chat');
  const chipButtons = document.querySelectorAll('.chip');

  // Live Clock
  function updateClock() {
    const now = new Date();
    liveClock.textContent = now.toLocaleTimeString('pt-BR');
  }
  setInterval(updateClock, 1000);
  updateClock();

  // Set default datetime to now in local ISO
  if (inputDataHora) {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    inputDataHora.value = now.toISOString().slice(0, 16);
  }

  // Live ton calculation in form
  inputQuantidade.addEventListener('input', () => {
    const val = Number(inputQuantidade.value) || 0;
    const tons = (val / 1000).toFixed(3);
    const estCusto = (val * 3.50).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    calcHint.textContent = `Equivale a ${tons} t • Custo est.: ${estCusto}`;
  });

  // Navigation switching
  function switchView(viewName) {
    contentViews.forEach(v => v.classList.remove('active'));
    navItems.forEach(n => n.classList.remove('active'));

    const targetView = document.getElementById(`view-${viewName}`);
    const targetNav = document.querySelector(`.nav-item[data-view="${viewName}"]`);

    if (targetView) targetView.classList.add('active');
    if (targetNav) targetNav.classList.add('active');

    if (viewName === 'dashboard') {
      pageTitle.textContent = 'Painel Geral de Perdas de Produção';
      pageSubtitle.textContent = 'Monitoramento de refugo, quebras de folha e rendimento industrial';
      loadData();
    } else if (viewName === 'novo-apontamento') {
      pageTitle.textContent = 'Registro de Perda Operacional';
      pageSubtitle.textContent = 'Apontamento em tempo real de quebras, refugo e paradas de máquina';
    } else if (viewName === 'historico') {
      pageTitle.textContent = 'Histórico Completo de Perdas';
      pageSubtitle.textContent = 'Filtros, rastreamento de lotes e exportação para engenharia de processo';
      renderHistoryTable();
    } else if (viewName === 'chat-ia') {
      pageTitle.textContent = 'IA Assistente de Celulose & Papel';
      pageSubtitle.textContent = 'Consultas em linguagem natural e diagnóstico técnico especializado';
    }
  }

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const view = item.getAttribute('data-view');
      switchView(view);
    });
  });

  document.getElementById('btn-quick-new')?.addEventListener('click', () => switchView('novo-apontamento'));
  document.getElementById('link-go-history')?.addEventListener('click', (e) => {
    e.preventDefault();
    switchView('historico');
  });
  document.getElementById('btn-ask-ai-alert')?.addEventListener('click', () => {
    switchView('chat-ia');
    sendChatMessage('Faça uma análise crítica das maiores causas de perda registradas e sugira ações.');
  });
  document.getElementById('btn-refresh')?.addEventListener('click', loadData);

  // FETCH DATA FROM SERVER
  async function loadData() {
    try {
      const [resPerdas, resKpis] = await Promise.all([
        fetch('/api/perdas'),
        fetch('/api/kpis')
      ]);

      perdas = await resPerdas.json();
      kpis = await resKpis.json();

      renderKPIs();
      renderParetoChart();
      renderMachineChart();
      renderRecentTable();
      renderHistoryTable();
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    }
  }

  // RENDER KPIS
  function renderKPIs() {
    kpiTotalTon.innerHTML = `${kpis.totalTon || '0.00'} <span class="unit">ton</span>`;
    kpiTotalKg.textContent = `${(kpis.totalKg || 0).toLocaleString('pt-BR')} kg registrados`;
    kpiTotalHoras.innerHTML = `${kpis.totalHorasParada || '0.0'} <span class="unit">horas</span>`;
    kpiTotalMin.textContent = `${kpis.totalMinutosParada || 0} minutos de parada`;
    kpiTotalCusto.textContent = `R$ ${Number(kpis.totalCusto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    kpiTotalRegistros.textContent = kpis.totalApontamentos || 0;

    // Smart Alert
    if (kpis.porCausa && kpis.porCausa.length > 0) {
      const principal = kpis.porCausa[0];
      alertText.textContent = `A principal causa de refugo é "${principal.causa}", respondendo por ${principal.percentual}% de todo o volume perdido (${principal.kg.toLocaleString('pt-BR')} kg).`;
    } else {
      alertText.textContent = 'Nenhum desvio crítico apontado no momento.';
    }
  }

  // RENDER PARETO CHART
  function renderParetoChart() {
    paretoChart.innerHTML = '';
    if (!kpis.porCausa || kpis.porCausa.length === 0) {
      paretoChart.innerHTML = '<p class="text-muted">Nenhum dado registrado.</p>';
      return;
    }

    const maxKg = kpis.porCausa[0].kg || 1;

    kpis.porCausa.slice(0, 5).forEach(item => {
      const barWidth = ((item.kg / maxKg) * 100).toFixed(1);
      const row = document.createElement('div');
      row.className = 'pareto-bar-item';
      row.innerHTML = `
        <div class="pareto-bar-header">
          <span class="pareto-label" title="${item.causa}">${item.causa}</span>
          <span class="pareto-values">${item.kg.toLocaleString('pt-BR')} kg (${item.percentual}%)</span>
        </div>
        <div class="pareto-track">
          <div class="pareto-fill" style="width: ${barWidth}%"></div>
        </div>
      `;
      paretoChart.appendChild(row);
    });
  }

  // RENDER PERDAS POR MÁQUINA
  function renderMachineChart() {
    machineChart.innerHTML = '';
    if (!kpis.porMaquina || Object.keys(kpis.porMaquina).length === 0) {
      machineChart.innerHTML = '<p class="text-muted">Nenhum dado registrado.</p>';
      return;
    }

    const entries = Object.entries(kpis.porMaquina).sort((a, b) => b[1] - a[1]);
    const maxVal = entries[0][1] || 1;

    entries.forEach(([maquina, kg]) => {
      const barWidth = ((kg / maxVal) * 100).toFixed(1);
      const ton = (kg / 1000).toFixed(2);
      const row = document.createElement('div');
      row.className = 'machine-item';
      row.innerHTML = `
        <div class="machine-bar-header">
          <span>${maquina}</span>
          <span class="text-muted">${ton} t (${kg.toLocaleString('pt-BR')} kg)</span>
        </div>
        <div class="machine-track">
          <div class="machine-fill" style="width: ${barWidth}%"></div>
        </div>
      `;
      machineChart.appendChild(row);
    });
  }

  // RENDER RECENT TABLE
  function renderRecentTable() {
    recentTableBody.innerHTML = '';
    const ultimos = perdas.slice(0, 5);

    if (ultimos.length === 0) {
      recentTableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Nenhum apontamento cadastrado.</td></tr>';
      return;
    }

    ultimos.forEach(p => {
      const dt = new Date(p.data_hora);
      const dataFmt = dt.toLocaleDateString('pt-BR') + ' ' + dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${dataFmt}</td>
        <td><span class="tag-machine">${p.maquina}</span></td>
        <td><span class="tag-shift">${p.turno}</span></td>
        <td>${p.tipo_papel}</td>
        <td><strong>${p.causa}</strong></td>
        <td class="loss-val">${Number(p.quantidade_kg).toLocaleString('pt-BR')} kg</td>
        <td>${p.tempo_parada_min} min</td>
        <td>${p.operador}</td>
      `;
      recentTableBody.appendChild(tr);
    });
  }

  // RENDER HISTORY TABLE WITH FILTERS
  function renderHistoryTable() {
    historyTableBody.innerHTML = '';
    const termo = (filterSearch.value || '').toLowerCase();
    const maqFiltro = filterMaquina.value;

    const filtradas = perdas.filter(p => {
      const matchTexto = (
        (p.causa || '').toLowerCase().includes(termo) ||
        (p.tipo_papel || '').toLowerCase().includes(termo) ||
        (p.operador || '').toLowerCase().includes(termo) ||
        (p.etapa_processo || '').toLowerCase().includes(termo)
      );
      const matchMaq = !maqFiltro || (p.maquina || '').includes(maqFiltro);
      return matchTexto && matchMaq;
    });

    if (filtradas.length === 0) {
      historyTableBody.innerHTML = '<tr><td colspan="11" style="text-align:center;">Nenhum registro encontrado para os filtros.</td></tr>';
      return;
    }

    filtradas.forEach(p => {
      const dt = new Date(p.data_hora);
      const dataFmt = dt.toLocaleDateString('pt-BR') + ' ' + dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${dataFmt}</td>
        <td><span class="tag-machine">${p.maquina}</span></td>
        <td><span class="tag-shift">${p.turno}</span></td>
        <td>${p.etapa_processo}</td>
        <td>${p.tipo_papel}</td>
        <td><strong>${p.causa}</strong></td>
        <td class="loss-val">${Number(p.quantidade_kg).toLocaleString('pt-BR')} kg</td>
        <td>${p.tempo_parada_min} min</td>
        <td>R$ ${Number(p.custo_estimado_brl || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
        <td>${p.operador}</td>
        <td>
          <button class="btn-delete-row" data-id="${p.id}" title="Excluir Registro">🗑️</button>
        </td>
      `;
      historyTableBody.appendChild(tr);
    });

    // Delete buttons listener
    document.querySelectorAll('.btn-delete-row').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (confirm('Tem certeza que deseja excluir este apontamento?')) {
          await fetch(`/api/perdas/${id}`, { method: 'DELETE' });
          loadData();
        }
      });
    });
  }

  filterSearch.addEventListener('input', renderHistoryTable);
  filterMaquina.addEventListener('change', renderHistoryTable);

  // EXPORT CSV
  btnExportCsv.addEventListener('click', () => {
    if (perdas.length === 0) {
      alert('Não há dados para exportar.');
      return;
    }
    const headers = ['ID', 'Data/Hora', 'Máquina', 'Turno', 'Etapa', 'Tipo de Papel', 'Causa da Perda', 'Quantidade (kg)', 'Tempo de Parada (min)', 'Custo Est. (BRL)', 'Operador', 'Ação Corretiva'];
    const rows = perdas.map(p => [
      p.id,
      p.data_hora,
      `"${p.maquina}"`,
      `"${p.turno}"`,
      `"${p.etapa_processo}"`,
      `"${p.tipo_papel}"`,
      `"${p.causa}"`,
      p.quantidade_kg,
      p.tempo_parada_min,
      p.custo_estimado_brl,
      `"${p.operador}"`,
      `"${(p.acao_corretiva || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `apontamento_perdas_papel_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // SUBMIT FORM
  formApontamento.addEventListener('submit', async (e) => {
    e.preventDefault();

    const novo = {
      maquina: document.getElementById('input-maquina').value,
      turno: document.getElementById('input-turno').value,
      etapa_processo: document.getElementById('input-etapa').value,
      tipo_papel: document.getElementById('input-tipo-papel').value,
      causa: document.getElementById('input-causa').value,
      quantidade_kg: Number(document.getElementById('input-quantidade').value),
      tempo_parada_min: Number(document.getElementById('input-parada').value),
      operador: document.getElementById('input-operador').value,
      data_hora: inputDataHora.value ? new Date(inputDataHora.value).toISOString() : new Date().toISOString(),
      acao_corretiva: document.getElementById('input-acao').value
    };

    try {
      const res = await fetch('/api/perdas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novo)
      });

      if (res.ok) {
        alert('✅ Apontamento salvo com sucesso no banco de dados!');
        formApontamento.reset();
        calcHint.textContent = 'Equivale a 0.00 toneladas';
        switchView('dashboard');
      } else {
        alert('Erro ao salvar apontamento.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao salvar.');
    }
  });

  // CHAT ASSISTANT LOGIC
  function appendMessage(sender, text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message message-${sender}`;

    const avatar = document.createElement('div');
    avatar.className = 'msg-avatar';
    avatar.textContent = sender === 'ai' ? '🤖' : '👤';

    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';

    // Simple markdown renderer for bold, lists, headers
    let formatted = text
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/^\s*-\s+(.*$)/gim, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/gms, '<ul>$1</ul>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');

    bubble.innerHTML = formatted;

    msgDiv.appendChild(avatar);
    msgDiv.appendChild(bubble);
    chatMessages.appendChild(msgDiv);

    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  async function sendChatMessage(promptText) {
    const text = promptText || chatInput.value.trim();
    if (!text) return;

    appendMessage('user', text);
    chatInput.value = '';

    // Typing placeholder
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'message message-ai typing';
    typingIndicator.innerHTML = `
      <div class="msg-avatar">🤖</div>
      <div class="msg-bubble"><em>Consultando base de perdas e gerando diagnóstico...</em></div>
    `;
    chatMessages.appendChild(typingIndicator);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      const data = await res.json();
      typingIndicator.remove();
      appendMessage('ai', data.reply || 'Não consegui obter uma resposta no momento.');
    } catch (err) {
      typingIndicator.remove();
      appendMessage('ai', 'Erro de comunicação com o assistente inteligente.');
    }
  }

  btnSendChat.addEventListener('click', () => sendChatMessage());
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  });

  chipButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const p = btn.getAttribute('data-prompt');
      sendChatMessage(p);
    });
  });

  btnClearChat.addEventListener('click', () => {
    chatMessages.innerHTML = '';
    appendMessage('ai', 'Conversa reiniciada. Como posso ajudar com a produção da fábrica de papel hoje?');
  });

  // INITIAL LOAD
  loadData();
});

