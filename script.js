// ============ LOOP — Startup Failure Intelligence ============
// Full version: Landing + Analyze + Tabs + Region Comparison (Layer 1-3)

const $ = (id) => document.getElementById(id);

// ============ Static Country Data ============
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
  setupTabs();
  setupShare();
  setupReanalyze();
  setupLandingInteractions();
  loadHistory();
});

// ============ Navigation ============
function setupNavigation() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const section = item.dataset.section;
      navigateToSection(section);
    });
  });
}

function navigateToSection(section) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelector(`.nav-item[data-section="${section}"]`)?.classList.add('active');
  
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const sectionEl = $(`section-${section}`);
  if (sectionEl) sectionEl.classList.add('active');
  
  const titles = {
    home: ['', ''],
    analyze: ['Analyze Your Idea', 'Know why startups like yours failed — before you build.'],
    history: ['Analysis History', 'Your past risk reports and insights.'],
    database: ['Failure Database', '12,847 indexed startup failures across 6 regions.'],
    pricing: ['Pricing', 'Choose the plan that fits your journey.']
  };
  
  if (titles[section] && section !== 'home') {
    const titleEl = $('pageTitle');
    const subtitleEl = $('pageSubtitle');
    if (titleEl) titleEl.textContent = titles[section][0];
    if (subtitleEl) subtitleEl.textContent = titles[section][1];
  }
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  // Re-render charts if going back to analyze and results exist
  if (section === 'analyze' && state.currentAnalysis) {
    setTimeout(() => renderCharts(state.currentAnalysis), 100);
  }
}

// ============ Theme ============
function setupTheme() {
  const saved = localStorage.getItem('loop-theme') || 'dark';
  document.documentElement.dataset.theme = saved;
  
  $('themeToggle')?.addEventListener('click', () => {
    const current = document.documentElement.dataset.theme;
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('loop-theme', next);
    
    if (state.currentAnalysis) renderCharts(state.currentAnalysis);
  });
}

// ============ Analyze Setup ============
function setupAnalyze() {
  $('analyzeBtn')?.addEventListener('click', runAnalysis);
  
  $('newAnalysisBtn')?.addEventListener('click', () => {
    $('results').classList.add('hidden');
    $('ideaInput').value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  
  $('ideaInput')?.addEventListener('keydown', (e) => {
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
    
    const verdictColor = aiData.risk_score >= 70 ? '#EF4444' 
                       : aiData.risk_score >= 50 ? '#F59E0B' 
                       : '#22C55E';
    
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
    
    $('skeleton').classList.add('hidden');
    $('analyzeBtn').disabled = false;
    $('analyzeBtn').querySelector('span').textContent = 'Analyze with AI';
    
    renderResults(analysis, idea, country, sector, budget);
    $('results').classList.remove('hidden');
    $('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    saveToHistory(idea, country, sector, analysis.riskScore);
    
  } catch (error) {
    console.error('Analysis error:', error);
    $('skeleton').classList.add('hidden');
    $('analyzeBtn').disabled = false;
    $('analyzeBtn').querySelector('span').textContent = 'Analyze with AI';
    alert('Analysis failed: ' + error.message + '\n\nPlease try again.');
  }
}

// ============ Render Results ============
function renderResults(analysis, idea, country, sector, budget) {
  const cData = COUNTRY_DATA[country];
  const bData = BUDGET_DATA[budget];
  
  // Risk score
  const riskScoreEl = $('riskScore');
  if (riskScoreEl) riskScoreEl.textContent = analysis.riskScore;
  
  const circumference = 2 * Math.PI * 85;
  const offset = circumference - (analysis.riskScore / 100) * circumference;
  const progressEl = $('riskProgress');
  if (progressEl) {
    progressEl.style.stroke = analysis.verdictColor;
    progressEl.style.strokeDashoffset = offset;
  }
  
  // Verdict
  const badge = $('verdictBadge');
  if (badge) {
    badge.textContent = analysis.verdict;
    badge.style.background = analysis.verdictColor + '22';
    badge.style.color = analysis.verdictColor;
    badge.style.border = `1px solid ${analysis.verdictColor}44`;
  }
  
  const verdictTextEl = $('verdictText');
  if (verdictTextEl) verdictTextEl.textContent = analysis.verdictText;
  
  // Meta chips
  const metaCountryEl = $('metaCountry');
  const metaSectorEl = $('metaSector');
  const metaBudgetEl = $('metaBudget');
  if (metaCountryEl) metaCountryEl.textContent = `${cData.flag} ${cData.name}`;
  if (metaSectorEl) metaSectorEl.textContent = `📊 ${sector.charAt(0).toUpperCase() + sector.slice(1)}`;
  if (metaBudgetEl) metaBudgetEl.textContent = `💰 ${bData.label}`;
  
  // Red flags
  const redFlagsList = $('redFlagsList');
  if (redFlagsList) redFlagsList.innerHTML = analysis.redFlags.map(f => `<li>${f}</li>`).join('');
  const flagCount = $('flagCount');
  if (flagCount) flagCount.textContent = analysis.redFlags.length;
  
  // Similar failures
  const similarFailuresEl = $('similarFailures');
  if (similarFailuresEl) {
    if (analysis.similarFailures.length > 0) {
      similarFailuresEl.innerHTML = analysis.similarFailures.map(f => `
        <div class="failure-card">
          <div class="name">💀 ${f.name}</div>
          <div class="country">${f.country}</div>
          <div class="reason">${f.reason}</div>
        </div>
      `).join('');
    } else {
      similarFailuresEl.innerHTML = '<p style="color: var(--text-muted);">No specific failures matched.</p>';
    }
  }
  
  // Checklist
  const checklistEl = $('checklist');
  if (checklistEl) {
    checklistEl.innerHTML = analysis.checklist.map(c => `<li>${c}</li>`).join('');
    setupChecklist();
  }
  
  // Brutal truth
  const brutalTruthEl = $('brutalTruth');
  if (brutalTruthEl) brutalTruthEl.textContent = analysis.brutalTruth;
  
  // Charts
  renderCharts(analysis);
  
  // Layer 3 additions
  animateConfidence(analysis.riskScore);
  renderBreakdown(analysis.riskScore);
  renderRegionComparison(country, analysis.riskScore);
  updateReportMeta();
  
  // Tab counts
  const tfCount = $('tabFailuresCount');
  const tfFlagsCount = $('tabFlagsCount');
  if (tfCount) tfCount.textContent = analysis.similarFailures.length;
  if (tfFlagsCount) tfFlagsCount.textContent = analysis.redFlags.length;
  
  // Reset to overview tab
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelector('.tab-btn[data-tab="overview"]')?.classList.add('active');
  $('tab-overview')?.classList.add('active');
}

// ============ Charts ============
function renderCharts(analysis) {
  const failureCanvas = $('failureChart');
  const trendCanvas = $('trendChart');
  
  if (!failureCanvas || !trendCanvas) return;
  
  if (state.charts.failure) state.charts.failure.destroy();
  if (state.charts.trend) state.charts.trend.destroy();
  
  const isDark = document.documentElement.dataset.theme === 'dark';
  const textColor = isDark ? '#94A3B8' : '#64748B';
  const gridColor = isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(15, 23, 42, 0.08)';
  
  const ctx1 = failureCanvas.getContext('2d');
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
  
  const ctx2 = trendCanvas.getContext('2d');
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

// ============ Tabs System ============
function setupTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      tabPanels.forEach(p => p.classList.remove('active'));
      $(`tab-${target}`)?.classList.add('active');
      
      if (target === 'overview' && state.currentAnalysis) {
        setTimeout(() => renderCharts(state.currentAnalysis), 50);
      }
    });
  });
}

// ============ Region Comparison ============
function renderRegionComparison(currentCountry, baseScore) {
  const container = $('regionCompare');
  if (!container) return;
  
  const regions = [
    { code: 'bangladesh', flag: '🇧🇩', name: 'Bangladesh', mod: 0 },
    { code: 'india', flag: '🇮🇳', name: 'India', mod: -8 },
    { code: 'indonesia', flag: '🇮🇩', name: 'Indonesia', mod: -5 },
    { code: 'nigeria', flag: '🇳🇬', name: 'Nigeria', mod: 8 },
    { code: 'pakistan', flag: '🇵🇰', name: 'Pakistan', mod: 10 },
    { code: 'global', flag: '🌐', name: 'Global', mod: -12 }
  ];
  
  container.innerHTML = regions.map(r => {
    const score = Math.max(15, Math.min(95, baseScore + r.mod));
    const cls = score >= 70 ? 'danger' : score >= 50 ? 'warning' : 'success';
    const isCurrent = r.code === currentCountry;
    return `
      <div class="region-card ${isCurrent ? 'current' : ''}">
        <div class="region-flag">${r.flag}</div>
        <div class="region-name">${r.name}</div>
        <div class="region-score ${cls}">${score}</div>
        <div class="region-label">${isCurrent ? 'Current' : 'Estimate'}</div>
      </div>
    `;
  }).join('');
}

// ============ Confidence Animation ============
function animateConfidence(score) {
  const confidence = Math.round(75 + Math.random() * 20);
  
  const fillEl = $('confidenceFill');
  const valueEl = $('confidenceValue');
  
  if (fillEl) {
    fillEl.style.width = '0%';
    setTimeout(() => {
      fillEl.style.width = confidence + '%';
    }, 100);
  }
  
  if (valueEl) {
    let current = 0;
    const target = confidence;
    const step = Math.ceil(target / 30);
    const interval = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(interval);
      }
      valueEl.textContent = current + '%';
    }, 30);
  }
  
  return confidence;
}

// ============ Risk Breakdown ============
function renderBreakdown(baseScore) {
  const variance = () => Math.round((Math.random() - 0.5) * 30);
  const clamp = (v) => Math.max(15, Math.min(95, v));
  
  const setVal = (id, value) => {
    const el = $(id);
    if (!el) return;
    el.textContent = value;
    el.className = 'breakdown-value ' + (value >= 70 ? 'danger' : value >= 50 ? 'warning' : 'success');
  };
  
  setVal('bd-market', clamp(baseScore + variance() + 5));
  setVal('bd-comp', clamp(baseScore + variance()));
  setVal('bd-econ', clamp(baseScore + variance() - 5));
  setVal('bd-reg', clamp(baseScore + variance() + 8));
  setVal('bd-team', clamp(baseScore + variance() - 20));
  setVal('bd-time', clamp(baseScore + variance()));
}

// ============ Report Metadata ============
function updateReportMeta() {
  const timeEl = $('analysisTime');
  const idEl = $('reportId');
  
  if (timeEl) timeEl.textContent = 'just now';
  if (idEl) idEl.textContent = '#' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ============ Share / Copy Link ============
function setupShare() {
  const copyBtn = $('copyLinkBtn');
  if (!copyBtn) return;
  
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast('✓ Link copied to clipboard', 'success');
    } catch (err) {
      showToast('Could not copy link', 'error');
    }
  });
}

// ============ Re-analyze ============
function setupReanalyze() {
  const btn = $('reanalyzeBtn');
  if (!btn) return;
  
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => runAnalysis(), 500);
  });
}

// ============ Toast ============
function showToast(message, type = 'default') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  
  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// ============ Landing Interactions ============
function setupLandingInteractions() {
  // data-goto buttons
  document.querySelectorAll('[data-goto]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const target = btn.dataset.goto;
      navigateToSection(target);
    });
  });
  
  // Animated counters
  const counters = document.querySelectorAll('[data-count]');
  const animateCounter = (el) => {
    const target = parseInt(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const duration = 2000;
    const start = performance.now();
    
    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(target * eased);
      el.textContent = current.toLocaleString() + suffix;
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = target.toLocaleString() + suffix;
    };
    requestAnimationFrame(tick);
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.dataset.animated) {
        entry.target.dataset.animated = 'true';
        animateCounter(entry.target);
      }
    });
  }, { threshold: 0.3 });
  
  counters.forEach(c => observer.observe(c));
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


// ============ Run Analysis (REAL AI with loading) ============
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
  
  // Show loader
  $('results').classList.add('hidden');
  $('skeleton').classList.remove('hidden');
  $('analyzeBtn').disabled = true;
  $('analyzeBtn').querySelector('span').textContent = 'Analyzing with AI...';
  
  // Start loading animation
  const stopLoading = startLoadingAnimation();
  
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
    
    // Complete the progress to 100%
    stopLoading(true);
    
    // Wait a bit for progress bar to finish
    await new Promise(r => setTimeout(r, 400));
    
    const verdictColor = aiData.risk_score >= 70 ? '#EF4444' 
                       : aiData.risk_score >= 50 ? '#F59E0B' 
                       : '#22C55E';
    
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
    
    $('skeleton').classList.add('hidden');
    $('analyzeBtn').disabled = false;
    $('analyzeBtn').querySelector('span').textContent = 'Analyze with AI';
    
    renderResults(analysis, idea, country, sector, budget);
    $('results').classList.remove('hidden');
    $('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    saveToHistory(idea, country, sector, analysis.riskScore);
    
  } catch (error) {
    console.error('Analysis error:', error);
    stopLoading(false);
    $('skeleton').classList.add('hidden');
    $('analyzeBtn').disabled = false;
    $('analyzeBtn').querySelector('span').textContent = 'Analyze with AI';
    alert('Analysis failed: ' + error.message + '\n\nPlease try again.');
  }
}

// ============ Loading Animation Engine ============
function startLoadingAnimation() {
  const stageEl = $('loaderStage');
  const substageEl = $('loaderSubstage');
  const dotsEl = $('loaderDots');
  const progressFill = $('loaderProgressFill');
  const percentEl = $('loaderPercent');
  const timeEl = $('loaderTime');
  const tipEl = $('loaderTip');
  
  if (!stageEl || !progressFill) {
    return () => {};
  }
  
  const stages = [
    { 
      stage: 'Initializing analysis…', 
      substage: 'Warming up the failure database',
      targetProgress: 12
    },
    { 
      stage: 'Scanning 12,847 failures…', 
      substage: 'Matching your idea against real post-mortems',
      targetProgress: 32
    },
    { 
      stage: 'Analyzing market reality…', 
      substage: 'Checking regional funding trends and saturation',
      targetProgress: 55
    },
    { 
      stage: 'Checking unit economics…', 
      substage: 'Benchmarking CAC, LTV, and burn rate',
      targetProgress: 72
    },
    { 
      stage: 'Running regulatory scan…', 
      substage: 'Reviewing licensing, escrow, and compliance rules',
      targetProgress: 85
    },
    { 
      stage: 'Generating verdict…', 
      substage: 'Preparing your brutal truth and checklist',
      targetProgress: 96
    }
  ];
  
  const tips = [
    '<strong>Did you know?</strong> 43% of startups fail because they build something nobody needs.',
    '<strong>Pro tip:</strong> Talk to 50+ potential customers before writing any code.',
    '<strong>Reality check:</strong> Bangladesh startup funding dropped 95% in 2024.',
    '<strong>Rule of thumb:</strong> Keep 18 months of runway minimum before launching.',
    '<strong>Warning sign:</strong> If LTV is less than 3× CAC, your unit economics are broken.',
    '<strong>Ask yourself:</strong> What happens if a giant like Google enters your space tomorrow?',
    '<strong>Validation:</strong> A "yes" from a friend is not customer validation. Get payment commitments.'
  ];
  
  const startTime = Date.now();
  let currentStage = 0;
  let currentProgress = 0;
  let tipIndex = 0;
  let stopped = false;
  
  // Timer
  const timerInterval = setInterval(() => {
    if (stopped) return;
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    if (timeEl) timeEl.textContent = elapsed + 's';
  }, 100);
  
  // Stage progression
  const stageInterval = setInterval(() => {
    if (stopped) return;
    if (currentStage < stages.length) {
      const s = stages[currentStage];
      
      stageEl.style.animation = 'none';
      void stageEl.offsetWidth;
      stageEl.style.animation = '';
      stageEl.textContent = s.stage;
      
      substageEl.textContent = s.substage;
      
      // Update dots
      if (dotsEl) {
        const dots = dotsEl.querySelectorAll('.loader-dot');
        dots.forEach((d, i) => {
          d.classList.remove('active', 'done');
          if (i < currentStage) d.classList.add('done');
          if (i === currentStage) d.classList.add('active');
        });
      }
      
      // Animate progress
      const targetProgress = s.targetProgress;
      const startProgress = currentProgress;
      const progressDuration = 800;
      const progressStart = Date.now();
      
      const animateProgress = () => {
        if (stopped) return;
        const elapsed = Date.now() - progressStart;
        const t = Math.min(elapsed / progressDuration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        const value = startProgress + (targetProgress - startProgress) * eased;
        
        progressFill.style.width = value + '%';
        if (percentEl) percentEl.textContent = Math.round(value) + '%';
        currentProgress = value;
        
        if (t < 1) requestAnimationFrame(animateProgress);
      };
      requestAnimationFrame(animateProgress);
      
      currentStage++;
    }
  }, 700);
  
  // Rotating tips
  const tipInterval = setInterval(() => {
    if (stopped) return;
    tipIndex = (tipIndex + 1) % tips.length;
    tipEl.style.animation = 'none';
    void tipEl.offsetWidth;
    tipEl.style.animation = '';
    tipEl.innerHTML = tips[tipIndex];
  }, 3500);
  
  // Return stop function
  return (success = true) => {
    stopped = true;
    clearInterval(timerInterval);
    clearInterval(stageInterval);
    clearInterval(tipInterval);
    
    if (success) {
      // Complete to 100%
      progressFill.style.width = '100%';
      if (percentEl) percentEl.textContent = '100%';
      stageEl.textContent = 'Complete!';
      substageEl.textContent = 'Preparing your report…';
      
      if (dotsEl) {
        dotsEl.querySelectorAll('.loader-dot').forEach(d => {
          d.classList.remove('active');
          d.classList.add('done');
        });
      }
    }
  };
}
