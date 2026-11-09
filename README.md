# 📜 PapelSys - Apontamento de Perdas de Produção & IA Copilot

> Sistema industrial moderno para controle de perdas, refugo e paradas de máquina na **indústria de celulose e papel**, com **IA Assistente Especialista** integrada para diagnósticos em tempo real.

---

## 🚀 Funcionalidades

- **📊 Dashboard & KPIs Industriais**:
  - Acompanhamento em tempo real de perda acumulada ($t$ e $kg$), horas paradas e custo estimado em R$.
  - **Diagrama de Pareto Interativo**: Classificação das causas raízes de maior impacto.
  - **Distribuição por Máquina**: Métricas específicas para MP1 (Fourdrinier), MP2 (Tissue), Bobinadeira e Cortadeiras.
- **📝 Ficha de Apontamento Operacional**:
  - Registro de ocorrências com cálculo dinâmico de tonelagem e impacto financeiro.
  - Categorização por etapas (Mesa Plana, Prensas, Secagem, Yankee, Calandra/Pope, Refilamento).
- **📋 Histórico & Exportação CSV**:
  - Rastreamento completo com filtros rápidos por máquina e turno.
  - Exportação para relatórios em Excel / Power BI.
- **🤖 IA Copilot Papeleiro Integrado**:
  - Assistente de chat em tempo real conectado à base de perdas.
  - Tira dúvidas técnicas sobre causas de quebra de folha, esmagamento em prensas, controle de gramatura/umidade (QCS) e boas práticas de operação.

---

## 🛠️ Tecnologias Utilizadas

- **Backend**: Node.js (Servidor nativo HTTP, sem dependências externas)
- **Frontend**: HTML5, CSS3 Moderno, JavaScript Vanilla (Arquitetura SPA)
- **Banco de Dados**: JSON estruturado com persistência local
- **IA**: Motor de diagnóstico especializado em engenharia papeleira

---

## 📦 Como Executar o Projeto

### Pré-requisitos
- [Node.js](https://nodejs.org/) instalado (versão 18 ou superior).

### Passo a Passo

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/SEU_USUARIO/papel-perdas-app.git
   cd papel-perdas-app
   ```

2. **Inicie o servidor:**
   - **No Windows:** Dê dois cliques em `iniciar_aplicativo.bat`
   - **Ou pelo terminal:**
     ```bash
     node server.js
     ```

3. **Acesse no navegador:**
   Abra [http://localhost:3000](http://localhost:3000)
