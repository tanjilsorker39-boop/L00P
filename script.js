// ============ LOOP — Startup Failure Intelligence ============
// Real AI analysis via Gemini API

const $ = (id) => document.getElementById(id);

// ============ Static Data (for country/sector context) ============
const COUNTRY_DATA = {
  bangladesh: { 
    flag: '🇧🇩', name: 'Bangladesh',
    fundingChange: -95, 
    topFailure: 'Product-market fit না থাকা',
    examples: ['Evaly', 'E-Orange', 'Chaldal (struggling)', 'HungryNaki'],
    regulatory: 'Escrow rules, Bangladesh Bank-এর অনুমোদন',
    burnRate: 'High — emerging market'
  },
  india: { 
    flag: '🇮🇳', name: 'India',
    fundingChange: -60, 
    topFailure: 'Cash burn বেশি',
    examples: ['BharatPe', "Byju's", 'Dunzo', 'GoMechanic'],
    regulatory: 'RBI compliance, GST জটিলতা',
    burnRate: 'Very High — competitive market'
  },
  indonesia: { 
    flag: '🇮🇩', name: 'Indonesia',
    fundingChange: -45, 
    topFailure: 'Over-expansion',
    examples: ['Tokopedia (merged)', 'JD.id (closed)', 'BliBli'],
    regulatory: 'BKPM licensing',
    burnRate: 'High'
  },
  nigeria: { 
    flag: '🇳🇬', name: 'Nigeria',
    fundingChange: -70, 
    topFailure: 'Regulatory challenges',
    examples: ['Jumia (struggling)', 'Konga', 'Airlift'],
    regulatory: 'CBN regulations, forex crisis',
    burnRate: 'Extreme — currency volatility'
  },
  pakistan: { 
    flag: '🇵🇰', name: 'Pakistan',
    fundingChange: -80, 
    topFailure: 'Economic instability',
    examples: ['Daraz', 'Airlift (closed)', 'Careem Pakistan'],
    regulatory: 'SECP, SBP regulations',
    burnRate: 'Extreme — economic crisis'
  },
  global: { 
    flag: '🌐', name: 'Global',
    fundingChange: -40, 
    topFailure: 'No market need (43%)',
    examples: ['Quibi', 'WeWork', 'FTX', 'Theranos'],
    regulatory: 'Varies by country',
    burnRate: 'Varies'
  }
};

const BUDGET_DATA = {
  under5k: { label: 'Under $5K', risk: 20 },
  '5k-25k': { label: '$5K - $25K', risk: 10 },
  '25k-100k': { label: '$25K - $100K', risk: 0 },
  over100k: { label: 'Over $100K', risk: -10 }
};

// ============ State ============
let state = {
  charts: {},
  currentAnalysis: null
};

// ============ Init ============
document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  setupTheme();
  setupAnalyze();
  setupHistory();
  setupDatabase();
  setupChecklist();
  setupExport();
  loadHistory();
});

// ============ Navigation ============
function setupNavigation() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const section = item.dataset.section;
      
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      
      document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
      $(`section-${section}`).classList.add('active');
      
      const titles = {
        analyze: ['Analyze Your Idea', 'Know why startups like yours failed — before you build.'],
        history: ['Analysis History', 'Your past risk reports and insights.'],
        database: ['Failure Database', '12,847 indexed startup failures across 6 regions.'],
        pricing: ['Pricing', 'Choose the plan that fits your journey.']
      };
      
      $('pageTitle').textContent = titles[section][0];
      $('pageSubtitle').textContent = titles[section][1];
    });
  });
}

// ============ Theme ============
function setupTheme() {
  const saved = localStorage.getItem('loop-theme') || 'dark';
  document.documentElement.dataset.theme = saved;
  
  $('themeToggle').addEventListener('click', () => {
    const current = document.documentElement.dataset.theme;
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('loop-theme', next);
    
    if (state.currentAnalysis) renderCharts(state.currentAnalysis);
  });
}

// ============ Analyze Setup ============
function setupAnalyze() {
  $('analyzeBtn').addEventListener('click', runAnalysis);
  $('newAnalysisBtn')?.addEventListener('click', () => {
    $('results').classList.add('hidden');
    $('ideaInput').value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  
  $('ideaInput').addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') runAnalysis();
  });
}

// ============ Run Analysis (REAL AI) ============
async function runAnalysis() {
  const idea = $('ideaInput').value.trim();
  const country = $('countrySelect').value;
  const sector = $('sectorSelect').value;
  const budget = $('budgetSelect').value;
  
  if (!idea) {
    $('ideaInput').focus();
    $('ideaInput').style.borderBottom = '2px solid #EF4444';
    setTimeout(() => $('ideaInput').style.borderBottom = '', 1000);
    return;
  }
  
  if (idea.length < 20) {
    alert('Please describe your idea in more detail (minimum 20 characters).');
    return;
  }
  
  // Show skeleton
  $('results').classList.add('hidden');
  $('skeleton').classList.remove('hidden');
  $('analyzeBtn').disabled = true;
  $('analyzeBtn').querySelector('span').textContent = 'Analyzing with AI...';
  
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idea, country, sector, budget })
    });
    
    if (!response.ok) {
      throw new Error('API request failed (status ' + response.status + ')');
    }
    
    const aiData = await response.json();
    
    if (aiData.error) {
      throw new Error(aiData.error);
    }
    
    // Verdict color
    const verdictColor = aiData.risk_score >= 70 ? '#EF4444' 
                       : aiData.risk_score >= 50 ? '#F59E0B' 
                       : '#22C55E';
    
    // Trend chart data
    const countryTrends = {
      bangladesh: [120, 100, 60, 30, 15, 8, 6],
      india: [500, 700, 900, 600, 400, 250, 200],
      indonesia: [200, 300, 350, 250, 150, 100, 80],
      nigeria: [100, 150, 200, 120, 80, 50, 30],
      pakistan: [80, 120, 150, 100, 60, 30, 20],
      global: [1000, 1400, 1600, 1100, 800, 600, 500]
    };
    
    const analysis = {
      riskScore: aiData.risk_score,
      verdict: aiData.verdict,
      verdictColor: verdictColor,
      verdictText: aiData.verdict_text,
      redFlags: aiData.red_flags || [],
      similarFailures: (aiData.similar_failures || []).map(f => ({
        name: f.name,
        country: f.country,
        reason: f.reason
      })),
      checklist: aiData.checklist || [],
      brutalTruth: aiData.brutal_truth,
      categoryData: {
        labels: ['No market need', 'Ran out of cash', 'Wrong team', 'Outcompeted', 'Pricing issues'],
        values: [43, 29, 23, 19, 18]
      },
      trendData: {
        labels: ['2020', '2021', '2022', '2023', '2024', '2025', '2026'],
        values: countryTrends[country] || countryTrends.global
      }
    };
    
    state.currentAnalysis = analysis;
    
    // Hide skeleton
    $('skeleton').classList.add('hidden');
    $('analyzeBtn').disabled = false;
    $('analyzeBtn').querySelector('span').textContent = 'Analyze with AI';
    
    // Render
    renderResults(analysis, idea, country, sector, budget);
    $('results').classList.remove('hidden');
    $('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // Save history
    saveToHistory(idea, country, sector, analysis.riskScore);
    
  } catch (error) {
    console.error('Analysis error:', error);
    $('skeleton').classList.add('hidden');
    $('analyzeBtn').disabled = false;
    $('analyzeBtn').querySelector('span').textContent = 'Analyze with AI';
    alert('Analysis failed: ' + error.message + '\n\nPlease try again.');
  }
}

// ============ Render ============
function renderResults(analysis, idea, country, sector, budget) {
  const cData = COUNTRY_DATA[country];
  const bData = BUDGET_DATA[budget];
  
  // Risk score
  $('riskScore').textContent = analysis.riskScore;
  const circumference = 2 * Math.PI * 85;
  const offset = circumference - (analysis.riskScore / 100) * circumference;
  const progressEl = $('riskProgress');
  progressEl.style.stroke = analysis.verdictColor;
  progressEl.style.strokeDashoffset = offset;
  
  // Verdict
  const badge = $('verdictBadge');
  badge.textContent = analysis.verdict;
  badge.style.background = analysis.verdictColor + '22';
  badge.style.color = analysis.verdictColor;
  badge.style.border = `1px solid ${analysis.verdictColor}44`;
  
  $('verdictText').textContent = analysis.verdictText;
  
  // Meta chips
  $('metaCountry').textContent = `${cData.flag} ${cData.name}`;
  $('metaSector').textContent = `📊 ${sector.charAt(0).toUpperCase() + sector.slice(1)}`;
  $('metaBudget').textContent = `💰 ${bData.label}`;
  
  // Red flags
  $('redFlagsList').innerHTML = analysis.redFlags.map(f => `<li>${f}</li>`).join('');
  $('flagCount').textContent = analysis.redFlags.length;
  
  // Similar failures
  if (analysis.similarFailures.length > 0) {
    $('similarFailures').innerHTML = analysis.similarFailures.map(f => `
      <div class="failure-card">
        <div class="name">💀 ${f.name}</div>
        <div class="country">${f.country}</div>
        <div class="reason">${f.reason}</div>
      </div>
    `).join('');
  } else {
    $('similarFailures').innerHTML = '<p style="color: var(--text-muted);">No specific failures matched.</p>';
  }
  
  // Checklist
  $('checklist').innerHTML = analysis.checklist.map(c => `<li>${c}</li>`).join('');
  setupChecklist();
  
  // Brutal truth
  $('brutalTruth').textContent = analysis.brutalTruth;
  
  // Charts
  renderCharts(analysis);
}

// ============ Charts ============
function renderCharts(analysis) {
  if (state.charts.failure) state.charts.failure.destroy();
  if (state.charts.trend) state.charts.trend.destroy();
  
  const isDark = document.documentElement.dataset.theme === 'dark';
  const textColor = isDark ? '#94A3B8' : '#64748B';
  const gridColor = isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(15, 23, 42, 0.08)';
  
  const ctx1 = $('failureChart').getContext('2d');
  state.charts.failure = new Chart(ctx1, {
    type: 'bar',
    data: {
      labels: analysis.categoryData.labels,
      datasets: [{
        data: analysis.categoryData.values,
        backgroundColor: [
          'rgba(239, 68, 68, 0.7)',
          'rgba(245, 158, 11, 0.7)',
          'rgba(168, 85, 247, 0.7)',
          'rgba(59, 130, 246, 0.7)',
          'rgba(34, 197, 94, 0.7)'
        ],
        borderRadius: 6,
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
          titleColor: textColor,
          bodyColor: textColor,
          borderColor: gridColor,
          borderWidth: 1
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: textColor, callback: v => v + '%' },
          grid: { color: gridColor }
        },
        x: {
          ticks: { color: textColor, font: { size: 10 } },
          grid: { display: false }
        }
      }
    }
  });
  
  const ctx2 = $('trendChart').getContext('2d');
  const gradient = ctx2.createLinearGradient(0, 0, 0, 200);
  gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
  gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
  
  state.charts.trend = new Chart(ctx2, {
    type: 'line',
    data: {
      labels: analysis.trendData.labels,
      datasets: [{
        data: analysis.trendData.values,
        borderColor: '#3B82F6',
        backgroundColor: gradient,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#3B82F6',
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
          titleColor: textColor,
          bodyColor: textColor,
          borderColor: gridColor,
          borderWidth: 1,
          callbacks: {
            label: (ctx) => '$' + ctx.parsed.y + 'M raised'
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: textColor, callback: v => '$' + v + 'M' },
          grid: { color: gridColor }
        },
        x: {
          ticks: { color: textColor },
          grid: { display: false }
        }
      }
    }
  });
}

// ============ Checklist ============
function setupChecklist() {
  document.querySelectorAll('.checklist li').forEach(li => {
    li.addEventListener('click', () => li.classList.toggle('done'));
  });
}

// ============ History ============
function saveToHistory(idea, country, sector, score) {
  const history = JSON.parse(localStorage.getItem('loop-history') || '[]');
  history.unshift({
    idea: idea.substring(0, 80) + (idea.length > 80 ? '...' : ''),
    country,
    sector,
    score,
    date: new Date().toISOString()
  });
  localStorage.setItem('loop-history', JSON.stringify(history.slice(0, 20)));
  loadHistory();
}

function loadHistory() {
  const history = JSON.parse(localStorage.getItem('loop-history') || '[]');
  const list = $('historyList');
  
  if (!list) return;
  
  if (history.length === 0) {
    list.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 40px;">No analyses yet. Run your first analysis!</p>';
    return;
  }
  
  list.innerHTML = history.map((h, i) => `
    <div class="history-item" data-index="${i}">
      <div class="idea">${h.idea}</div>
      <div class="meta">${COUNTRY_DATA[h.country]?.flag || '🌐'} ${h.score}%</div>
    </div>
  `).join('');
}

function setupHistory() {
  const clearBtn = $('clearHistory');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('Clear all history?')) {
        localStorage.removeItem('loop-history');
        loadHistory();
      }
    });
  }
}

// ============ Database ============
function setupDatabase() {
  const list = $('dbList');
  if (!list) return;
  
  const failures = [
    { name: 'Quibi', country: '🇺🇸 USA', reason: 'No market need' },
    { name: 'WeWork', country: '🇺🇸 USA', reason: 'Bad unit economics' },
    { name: 'FTX', country: '🇧🇸 Bahamas', reason: 'Fraud / mismanagement' },
    { name: 'Theranos', country: '🇺🇸 USA', reason: 'Fraud' },
    { name: 'Evaly', country: '🇧🇩 Bangladesh', reason: 'Escrow fraud' },
    { name: 'E-Orange', country: '🇧🇩 Bangladesh', reason: 'Cash crunch' },
    { name: "Byju's", country: '🇮🇳 India', reason: 'Over-expansion' },
    { name: 'Dunzo', country: '🇮🇳 India', reason: 'Cash burn' },
    { name: 'GoMechanic', country: '🇮🇳 India', reason: 'Financial fraud' },
    { name: 'BharatPe', country: '🇮🇳 India', reason: 'Governance issues' },
    { name: 'Tokopedia', country: '🇮🇩 Indonesia', reason: 'Merged (GoTo)' },
    { name: 'JD.id', country: '🇮🇩 Indonesia', reason: 'Market exit' },
    { name: 'Airlift', country: '🇵🇰 Pakistan', reason: 'Funding winter' },
    { name: 'Daraz', country: '🇵🇰 Pakistan', reason: 'Restructuring' },
    { name: 'Jumia', country: '🇳🇬 Nigeria', reason: 'Fraud allegations' },
    { name: 'Konga', country: '🇳🇬 Nigeria', reason: 'Acquired (Zinox)' }
  ];
  
  list.innerHTML = failures.map(f => `
    <div class="failure-card">
      <div class="name">💀 ${f.name}</div>
      <div class="country">${f.country}</div>
      <div class="reason">${f.reason}</div>
    </div>
  `).join('');
}

// ============ Export ============
function setupExport() {
  const btn = $('exportBtn');
  if (!btn) return;
  
  btn.addEventListener('click', () => {
    window.print();
  });
}
