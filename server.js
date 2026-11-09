const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'perdas.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

// MIME types for static assets
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

// Helper to read data safely
function readPerdas() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, '[]', 'utf8');
      return [];
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    console.error('Erro ao ler perdas.json:', err);
    return [];
  }
}

// Helper to write data safely
function writePerdas(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Erro ao salvar perdas.json:', err);
    return false;
  }
}

// Calculate KPIs from dataset
function calculateKPIs(perdas) {
  const totalKg = perdas.reduce((sum, p) => sum + (Number(p.quantidade_kg) || 0), 0);
  const totalCusto = perdas.reduce((sum, p) => sum + (Number(p.custo_estimado_brl) || 0), 0);
  const totalMinutos = perdas.reduce((sum, p) => sum + (Number(p.tempo_parada_min) || 0), 0);
  const totalApontamentos = perdas.length;

  // Group by Maquina
  const porMaquina = {};
  perdas.forEach(p => {
    const maq = p.maquina || 'Outras';
    porMaquina[maq] = (porMaquina[maq] || 0) + (Number(p.quantidade_kg) || 0);
  });

  // Group by Causa
  const porCausa = {};
  perdas.forEach(p => {
    const c = p.causa || 'Outros Motivos';
    porCausa[c] = (porCausa[c] || 0) + (Number(p.quantidade_kg) || 0);
  });

  // Group by Turno
  const porTurno = {};
  perdas.forEach(p => {
    const t = p.turno || 'Não informado';
    porTurno[t] = (porTurno[t] || 0) + (Number(p.quantidade_kg) || 0);
  });

  // Group by Etapa
  const porEtapa = {};
  perdas.forEach(p => {
    const e = p.etapa_processo || 'Geral';
    porEtapa[e] = (porEtapa[e] || 0) + (Number(p.quantidade_kg) || 0);
  });

  // Sort Pareto Causas
  const causasOrdenadas = Object.entries(porCausa)
    .map(([causa, kg]) => ({ causa, kg, percentual: totalKg > 0 ? (kg / totalKg * 100).toFixed(1) : 0 }))
    .sort((a, b) => b.kg - a.kg);

  return {
    totalKg,
    totalTon: (totalKg / 1000).toFixed(2),
    totalCusto: totalCusto.toFixed(2),
    totalHorasParada: (totalMinutos / 60).toFixed(1),
    totalMinutosParada: totalMinutos,
    totalApontamentos,
    porMaquina,
    porCausa: causasOrdenadas,
    porTurno,
    porEtapa
  };
}

// Specialized AI Assistant Brain for Pulp & Paper Industry
function processAssistantQuery(userPrompt, perdas) {
  const q = (userPrompt || '').toLowerCase();
  const kpis = calculateKPIs(perdas);

  // 1. Maiores perdas / Pareto / Principal problema
  if (q.includes('maior') || q.includes('maiores') || q.includes('pareto') || q.includes('principal causa') || q.includes('pior')) {
    const top = kpis.porCausa[0];
    const top2 = kpis.porCausa[1];
    let resp = `### 📊 Análise de Pareto das Principais Perdas de Produção\n\n`;
    resp += `Atualmente temos um acumulado de **${kpis.totalTon} toneladas** (${kpis.totalKg.toLocaleString('pt-BR')} kg) em perdas registradas.\n\n`;
    if (top) {
      resp += `1. **${top.causa}**: **${top.kg.toLocaleString('pt-BR')} kg** (${top.percentual}% do total);\n`;
    }
    if (top2) {
      resp += `2. **${top2.causa}**: **${top2.kg.toLocaleString('pt-BR')} kg** (${top2.percentual}% do total);\n`;
    }
    resp += `\n**💡 Recomendação Técnica do Especialista:**\n`;
    resp += `- Concentre os esforços da equipe de operação na causa raiz número 1 (**${top ? top.causa : 'não identificada'}**).\n`;
    resp += `- Verifique a calibração do scanner QCS, a tensão das telas formadoras e o alinhamento das lonas dos grupos secadores.`;
    return resp;
  }

  // 2. Consulta por Máquina específica (MP1, MP2, Bobinadeira, Cortadeira)
  if (q.includes('mp1') || q.includes('mp2') || q.includes('bobinadeira') || q.includes('cortadeira') || q.includes('máquina') || q.includes('maquina')) {
    let filtro = null;
    if (q.includes('mp1')) filtro = 'MP1';
    else if (q.includes('mp2')) filtro = 'MP2';
    else if (q.includes('bobinadeira')) filtro = 'Bobinadeira';
    else if (q.includes('cortadeira')) filtro = 'Cortadeira';

    let filtradas = perdas;
    if (filtro) {
      filtradas = perdas.filter(p => (p.maquina || '').toLowerCase().includes(filtro.toLowerCase()));
    }

    const subTotalKg = filtradas.reduce((acc, p) => acc + (Number(p.quantidade_kg) || 0), 0);
    const subTotalMin = filtradas.reduce((acc, p) => acc + (Number(p.tempo_parada_min) || 0), 0);

    let resp = `### 🏭 Diagnóstico da ${filtro || 'Máquinas'}\n\n`;
    resp += `- **Registros de perda:** ${filtradas.length} ocorrências\n`;
    resp += `- **Volume total perdido:** **${(subTotalKg / 1000).toFixed(2)} toneladas** (${subTotalKg.toLocaleString('pt-BR')} kg)\n`;
    resp += `- **Tempo parado acumulado:** **${subTotalMin} minutos** (~${(subTotalMin / 60).toFixed(1)}h)\n\n`;
    resp += `**Últimos apontamentos nesta máquina:**\n`;
    filtradas.slice(-3).reverse().forEach(p => {
      resp += `- **${p.causa}** (${p.quantidade_kg} kg) - Etapa: *${p.etapa_processo}* - Turno: *${p.turno}*\n  *Ação adotada:* ${p.acao_corretiva || 'N/A'}\n`;
    });
    return resp;
  }

  // 3. Consulta de Custo / Financeiro
  if (q.includes('custo') || q.includes('prejuízo') || q.includes('prejuizo') || q.includes('valor') || q.includes('r$') || q.includes('dinheiro')) {
    return `### 💰 Impacto Financeiro das Perdas de Papel\n\n` +
      `- **Custo total estimado de perdas:** **R$ ${Number(kpis.totalCusto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}**\n` +
      `- **Volume de refugo acumulado:** ${kpis.totalTon} toneladas\n` +
      `- **Custo médio por tonelada de refugo:** R$ ${(kpis.totalKg > 0 ? (kpis.totalCusto / (kpis.totalKg / 1000)).toFixed(2) : '0,00')}/t\n\n` +
      `*Nota de Gestão Lean:* Além do custo da celulose virgem e amido, considere o custo energético do vapor nos cilindros secadores e consumo elétrico de refino.*`;
  }

  // 4. Quebra de folha / Secagem / Prensas
  if (q.includes('quebra') || q.includes('rompimento') || q.includes('secagem') || q.includes('prensa') || q.includes('esmagamento')) {
    return `### ⚙️ Guia Técnico: Diagnóstico de Quebra de Folha em Máquinas de Papel\n\n` +
      `**Causas mais frequentes na indústria papeleira:**\n` +
      `1. **Tensão Desbalanceada (Draws):** Diferença excessiva de velocidade entre a mesa formadora e o 1º grupo secador.\n` +
      `2. **Esmagamento nas Prensas:** Umidade excessiva na entrada da prensa por entupimento de feltros pick-up ou vácuo deficiente na caixa de sucção.\n` +
      `3. **Grumos de Massa (Flocks) e Furos:** Floculação na caixa de entrada, bicos de chuveiro descalibrados ou piche (stickies) aderido à tela.\n` +
      `4. **Perfil Térmico Irregular:** Condensado acumulado dentro dos cilindros secadores gerando faixas frias e variação de umidade transversal.\n\n` +
      `**Ações Imediatas Recomendadas:**\n` +
      `- Inspecionar os chuveiros de alta pressão da tela de formação e feltros;\n` +
      `- Verificar leituras de vácuo das caixas Uhle e caixas de drenagem;\n` +
      `- Revisar as purgas de vapor dos cilindros do grupo afetado.`;
  }

  // 5. Variação de Gramatura / Umidade / QCS
  if (q.includes('gramatura') || q.includes('umidade') || q.includes('qcs') || q.includes('scanner') || q.includes('perfil')) {
    return `### 🎯 Controle de Gramatura e Umidade Transversal (CD/MD)\n\n` +
      `Para mitigar o desvio de gramatura e refugo fora de padrão:\n` +
      `1. **Caixa de Entrada com Diluição:** Verifique se as válvulas de diluição por perfil não apresentam histerese ou entupimento de massa fina.\n` +
      `2. **Lábio da Caixa de Entrada:** Realize a checagem mecânica do micro-ajuste dos fusos do lábio flexível.\n` +
      `3. **Calibração do Scanner QCS:** Execute a padronização do sensor beta (gramatura) e sensor infravermelho (umidade).\n` +
      `4. **Fator de Drenagem:** Confirme se o vácuo dos foils e caixas de alto vácuo na mesa plana estão homogêneos ao longo da largura da folha.`;
  }

  // 6. Resumo geral / Status
  if (q.includes('resumo') || q.includes('status') || q.includes('relatório') || q.includes('relatorio') || q.includes('hoje') || q.includes('kpi')) {
    return `### 📋 Relatório Geral de Apontamentos de Perda\n\n` +
      `* **Total de Apontamentos:** ${kpis.totalApontamentos} registros\n` +
      `* **Volume Total de Perda:** **${kpis.totalTon} toneladas** (${kpis.totalKg.toLocaleString('pt-BR')} kg)\n` +
      `* **Horas de Máquina Paradas:** **${kpis.totalHorasParada} horas** (${kpis.totalMinutosParada} min)\n` +
      `* **Impacto Financeiro:** **R$ ${Number(kpis.totalCusto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n` +
      `* **Máquina mais crítica:** ${Object.entries(kpis.porMaquina).sort((a,b)=>b[1]-a[1])[0] ? Object.entries(kpis.porMaquina).sort((a,b)=>b[1]-a[1])[0][0] : 'N/A'}\n` +
      `* **Principal Motivo:** ${kpis.porCausa[0] ? kpis.porCausa[0].causa : 'N/A'}\n\n` +
      `Deseja detalhar algum apontamento por máquina, turno ou causa específica?`;
  }

  // Resposta padrão inteligente
  return `### 🤖 Olá! Sou o Copilot de Produção da Fábrica de Papel.\n\n` +
    `Estou conectado à base de dados de perdas em tempo real (${kpis.totalApontamentos} apontamentos registrados, totalizando **${kpis.totalTon} t** de refugo).\n\n` +
    `**Posso te ajudar com:**\n` +
    `- **"Qual foi a maior causa de perda?"** (Análise de Pareto);\n` +
    `- **"Diagnóstico da MP1"** ou **"MP2"**;\n` +
    `- **"Como resolver quebra de folha na secagem?"** (Recomendações técnicas de operação);\n` +
    `- **"Qual o custo acumulado das perdas?"**;\n` +
    `- **"Como controlar a variação de gramatura e umidade?"**;\n` +
    `- **"Resumo geral da produção"**.\n\n` +
    `Como posso ajudar sua equipe de produção agora?`;
}

// Request dispatcher
const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API ROUTES
  if (pathname === '/api/perdas' && method === 'GET') {
    const perdas = readPerdas();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(perdas));
    return;
  }

  if (pathname === '/api/kpis' && method === 'GET') {
    const perdas = readPerdas();
    const kpis = calculateKPIs(perdas);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(kpis));
    return;
  }

  if (pathname === '/api/perdas' && method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const item = JSON.parse(body || '{}');
        if (!item.maquina || !item.causa || !item.quantidade_kg) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Campos obrigatórios ausentes (máquina, causa, quantidade)' }));
          return;
        }

        const perdas = readPerdas();
        const novoId = 'loss-' + Date.now();
        const qtdKg = Number(item.quantidade_kg) || 0;
        // Default pulp & paper cost approx R$ 3.50/kg for liner/tissue
        const custoCalculado = item.custo_estimado_brl ? Number(item.custo_estimado_brl) : (qtdKg * 3.50);

        const novoRegistro = {
          id: novoId,
          data_hora: item.data_hora || new Date().toISOString(),
          maquina: item.maquina,
          turno: item.turno || 'Turno A',
          tipo_papel: item.tipo_papel || 'Kraftliner',
          etapa_processo: item.etapa_processo || 'Secagem',
          causa: item.causa,
          quantidade_kg: qtdKg,
          tempo_parada_min: Number(item.tempo_parada_min) || 0,
          operador: item.operador || 'Operador',
          acao_corretiva: item.acao_corretiva || '',
          custo_estimado_brl: custoCalculado
        };

        perdas.unshift(novoRegistro);
        writePerdas(perdas);

        res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, item: novoRegistro }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'JSON inválido' }));
      }
    });
    return;
  }

  if (pathname.startsWith('/api/perdas/') && method === 'DELETE') {
    const idToDelete = pathname.replace('/api/perdas/', '');
    let perdas = readPerdas();
    const originalLen = perdas.length;
    perdas = perdas.filter(p => p.id !== idToDelete);
    if (perdas.length < originalLen) {
      writePerdas(perdas);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, deletedId: idToDelete }));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Registro não encontrado' }));
    }
    return;
  }

  // AI Assistant Chat endpoint
  if (pathname === '/api/chat' && method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { message } = JSON.parse(body || '{}');
        const perdas = readPerdas();
        const reply = processAssistantQuery(message, perdas);

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ reply }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Erro no processamento da IA' }));
      }
    });
    return;
  }

  // STATIC FILES SERVING
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);

  // Security check to avoid directory traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Acesso Negado');
    return;
  }

  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Fallback to index.html for SPA if not found
        fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (err2, fallback) => {
          if (err2) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Arquivo não encontrado');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(fallback);
          }
        });
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Erro interno do servidor');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`====================================================`);
  console.log(`🏭 PAPELSYS - Sistema de Apontamento de Perdas & IA`);
  console.log(`🚀 Servidor rodando em: http://localhost:${PORT}`);
  console.log(`====================================================`);
});

