// ============ LOOP — Startup Failure Intelligence ============
// Full version: Landing + Analyze + Tabs + Loader + Dynamic DB (Layer 1-4, 6)

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
  currentAnalysis: null,
  allFailures: []
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
  setupMobileNav();
  setupMobileThemeToggle();
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
  // Sync mobile nav
  document.querySelectorAll('.mobile-nav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.section === section);
  });

  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelector(`.nav-item[data-section="${section}"]`)?.classList.add('active');
  
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const sectionEl = $(`section-${section}`);
  if (sectionEl) sectionEl.classList.add('active');
  
  const titles = {
    home: ['', ''],
    analyze: ['Analyze Your Idea', 'Know why startups like yours failed — before you build.'],
    history: ['Analysis History', 'Your past risk reports and insights.'],
    database: ['Failure Database', '200+ indexed startup failures across 6 regions.'],
    pricing: ['Pricing', 'Choose the plan that fits your journey.']
  };
  
  if (titles[section] && section !== 'home') {
    const titleEl = $('pageTitle');
    const subtitleEl = $('pageSubtitle');
    if (titleEl) titleEl.textContent = titles[section][0];
    if (subtitleEl) subtitleEl.textContent = titles[section][1];
  }
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  if (section === 'analyze' && state.currentAnalysis) {
    setTimeout(() => renderCharts(state.currentAnalysis), 100);
  }
}

// ============ Theme ============
function setupTheme() {
  const saved = localStorage.getItem('loop-theme') || 'dark';
  document.documentElement.dataset.theme = saved;
  
  $('themeToggle')?.addEventListener('click', () => {
    toggleTheme();
  });
}

function setupMobileThemeToggle() {
  const mobileToggle = $('themeToggleMobile');
  if (!mobileToggle) return;
  
  mobileToggle.addEventListener('click', () => {
    toggleTheme();
  });
}

function toggleTheme() {
  const current = document.documentElement.dataset.theme;
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  localStorage.setItem('loop-theme', next);
  
  if (state.currentAnalysis) renderCharts(state.currentAnalysis);
}

// ============ Mobile Navigation ============
function setupMobileNav() {
  document.querySelectorAll('.mobile-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const section = item.dataset.section;
      navigateToSection(section);
      
      if (navigator.vibrate) navigator.vibrate(10);
    });
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
  
  $('results').classList.add('hidden');
  $('skeleton').classList.remove('hidden');
  $('analyzeBtn').disabled = true;
  $('analyzeBtn').querySelector('span').textContent = 'Analyzing with AI...';
  
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
    
    stopLoading(true);
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
    { stage: 'Initializing analysis…', substage: 'Warming up the failure database', targetProgress: 12 },
    { stage: 'Scanning 12,847 failures…', substage: 'Matching your idea against real post-mortems', targetProgress: 32 },
    { stage: 'Analyzing market reality…', substage: 'Checking regional funding trends and saturation', targetProgress: 55 },
    { stage: 'Checking unit economics…', substage: 'Benchmarking CAC, LTV, and burn rate', targetProgress: 72 },
    { stage: 'Running regulatory scan…', substage: 'Reviewing licensing, escrow, and compliance rules', targetProgress: 85 },
    { stage: 'Generating verdict…', substage: 'Preparing your brutal truth and checklist', targetProgress: 96 }
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
  
  const timerInterval = setInterval(() => {
    if (stopped) return;
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    if (timeEl) timeEl.textContent = elapsed + 's';
  }, 100);
  
  const stageInterval = setInterval(() => {
    if (stopped) return;
    if (currentStage < stages.length) {
      const s = stages[currentStage];
      
      stageEl.style.animation = 'none';
      void stageEl.offsetWidth;
      stageEl.style.animation = '';
      stageEl.textContent = s.stage;
      
      substageEl.textContent = s.substage;
      
      if (dotsEl) {
        const dots = dotsEl.querySelectorAll('.loader-dot');
        dots.forEach((d, i) => {
          d.classList.remove('active', 'done');
          if (i < currentStage) d.classList.add('done');
          if (i === currentStage) d.classList.add('active');
        });
      }
      
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
  
  const tipInterval = setInterval(() => {
    if (stopped) return;
    tipIndex = (tipIndex + 1) % tips.length;
    tipEl.style.animation = 'none';
    void tipEl.offsetWidth;
    tipEl.style.animation = '';
    tipEl.innerHTML = tips[tipIndex];
  }, 3500);
  
  return (success = true) => {
    stopped = true;
    clearInterval(timerInterval);
    clearInterval(stageInterval);
    clearInterval(tipInterval);
    
    if (success) {
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

// ============ Render Results ============
function renderResults(analysis, idea, country, sector, budget) {
  const cData = COUNTRY_DATA[country];
  const bData = BUDGET_DATA[budget];
  
  const riskScoreEl = $('riskScore');
  if (riskScoreEl) riskScoreEl.textContent = analysis.riskScore;
  
  const circumference = 2 * Math.PI * 85;
  const offset = circumference - (analysis.riskScore / 100) * circumference;
  const progressEl = $('riskProgress');
  if (progressEl) {
    progressEl.style.stroke = analysis.verdictColor;
    progressEl.style.strokeDashoffset = offset;
  }
  
  const badge = $('verdictBadge');
  if (badge) {
    badge.textContent = analysis.verdict;
    badge.style.background = analysis.verdictColor + '22';
    badge.style.color = analysis.verdictColor;
    badge.style.border = `1px solid ${analysis.verdictColor}44`;
  }
  
  const verdictTextEl = $('verdictText');
  if (verdictTextEl) verdictTextEl.textContent = analysis.verdictText;
  
  const metaCountryEl = $('metaCountry');
  const metaSectorEl = $('metaSector');
  const metaBudgetEl = $('metaBudget');
  if (metaCountryEl) metaCountryEl.textContent = `${cData.flag} ${cData.name}`;
  if (metaSectorEl) metaSectorEl.textContent = `📊 ${sector.charAt(0).toUpperCase() + sector.slice(1)}`;
  if (metaBudgetEl) metaBudgetEl.textContent = `💰 ${bData.label}`;
  
  const redFlagsList = $('redFlagsList');
  if (redFlagsList) redFlagsList.innerHTML = analysis.redFlags.map(f => `<li>${f}</li>`).join('');
  const flagCount = $('flagCount');
  if (flagCount) flagCount.textContent = analysis.redFlags.length;
  
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
  
  const checklistEl = $('checklist');
  if (checklistEl) {
    checklistEl.innerHTML = analysis.checklist.map(c => `<li>${c}</li>`).join('');
    setupChecklist();
  }
  
  const brutalTruthEl = $('brutalTruth');
  if (brutalTruthEl) brutalTruthEl.textContent = analysis.brutalTruth;
  
  renderCharts(analysis);
  
  animateConfidence(analysis.riskScore);
  renderBreakdown(analysis.riskScore);
  renderRegionComparison(country, analysis.riskScore);
  updateReportMeta();
  
  const tfCount = $('tabFailuresCount');
  const tfFlagsCount = $('tabFlagsCount');
  if (tfCount) tfCount.textContent = analysis.similarFailures.length;
  if (tfFlagsCount) tfFlagsCount.textContent = analysis.redFlags.length;
  
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
  document.querySelectorAll('[data-goto]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const target = btn.dataset.goto;
      navigateToSection(target);
    });
  });
  
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

// ============ Database (Dynamic) ============
async function setupDatabase() {
  const list = $('dbList');
  if (!list) return;
  
  list.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 40px;">Loading database…</p>';
  
  try {
    const res = await fetch('/data/failures.json');
    if (!res.ok) throw new Error('Failed to load');
    const failures = await res.json();
    state.allFailures = failures;
    
    renderDatabase(failures);
    setupDatabaseFilters(failures);
  } catch (err) {
    console.error('DB load error:', err);
    
    const fallback = [
      { name: 'Quibi', country: 'USA', flag: '🇺🇸', reason: 'No market need', sector: 'media' },
      { name: 'WeWork', country: 'USA', flag: '🇺🇸', reason: 'Bad unit economics', sector: 'realestate' },
      { name: 'FTX', country: 'Bahamas', flag: '🇧🇸', reason: 'Fraud', sector: 'fintech' },
      { name: 'Theranos', country: 'USA', flag: '🇺🇸', reason: 'Fraud', sector: 'healthtech' },
      { name: 'Evaly', country: 'Bangladesh', flag: '🇧🇩', reason: 'Escrow fraud', sector: 'ecommerce' },
      { name: 'E-Orange', country: 'Bangladesh', flag: '🇧🇩', reason: 'Cash crunch', sector: 'ecommerce' },
      { name: "Byju's", country: 'India', flag: '🇮🇳', reason: 'Over-expansion', sector: 'edtech' },
      { name: 'Dunzo', country: 'India', flag: '🇮🇳', reason: 'Cash burn', sector: 'delivery' },
      { name: 'GoMechanic', country: 'India', flag: '🇮🇳', reason: 'Financial fraud', sector: 'autotech' },
      { name: 'BharatPe', country: 'India', flag: '🇮🇳', reason: 'Governance', sector: 'fintech' },
      { name: 'Tokopedia', country: 'Indonesia', flag: '🇮🇩', reason: 'Merged', sector: 'ecommerce' },
      { name: 'JD.id', country: 'Indonesia', flag: '🇮🇩', reason: 'Market exit', sector: 'ecommerce' },
      { name: 'Airlift', country: 'Pakistan', flag: '🇵🇰', reason: 'Funding winter', sector: 'delivery' },
      { name: 'Daraz', country: 'Pakistan', flag: '🇵🇰', reason: 'Restructuring', sector: 'ecommerce' },
      { name: 'Jumia', country: 'Nigeria', flag: '🇳🇬', reason: 'Fraud allegations', sector: 'ecommerce' },
      { name: 'Konga', country: 'Nigeria', flag: '🇳🇬', reason: 'Acquired', sector: 'ecommerce' }
    ];
    state.allFailures = fallback;
    renderDatabase(fallback);
  }
}

function renderDatabase(failures) {
  const list = $('dbList');
  if (!list) return;
  
  if (failures.length === 0) {
    list.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 40px;">No cases found.</p>';
    return;
  }
  
  list.innerHTML = failures.map((f, i) => `
    <div class="failure-card" data-idx="${i}" style="cursor: pointer;">
      <div class="name">💀 ${f.name}</div>
      <div class="country">${f.flag || ''} ${f.country}</div>
      <div class="reason">${f.reason}</div>
    </div>
  `).join('');
  
  list.querySelectorAll('.failure-card').forEach(card => {
    card.addEventListener('click', () => {
      const idx = parseInt(card.dataset.idx);
      const failure = failures[idx];
      if (failure) showFailureDetail(failure);
    });
  });
}

function showFailureDetail(f) {
  const modal = document.createElement('div');
  modal.className = 'failure-modal';
  modal.innerHTML = `
    <div class="failure-modal-content">
      <button class="failure-modal-close">×</button>
      <div class="failure-modal-flag">${f.flag || '💀'}</div>
      <h2>${f.name}</h2>
      <div class="failure-modal-meta">
        <span>${f.country}</span>
        ${f.sector ? `<span>${f.sector}</span>` : ''}
        ${f.founded ? `<span>Founded: ${f.founded}</span>` : ''}
        ${f.died ? `<span>Died: ${f.died}</span>` : ''}
      </div>
      ${f.funding && f.funding > 0 ? `<div class="failure-modal-funding">Raised: $${(f.funding / 1000000).toFixed(1)}M</div>` : ''}
      <div class="failure-modal-section">
        <h3>What Happened</h3>
        <p>${f.summary || 'No details available.'}</p>
      </div>
      ${f.lesson ? `
        <div class="failure-modal-section">
          <h3>💡 Lesson</h3>
          <p>${f.lesson}</p>
        </div>
      ` : ''}
      <div class="failure-modal-section">
        <h3>🚩 Failure Reason</h3>
        <p class="failure-modal-reason">${f.reason}</p>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  
  setTimeout(() => modal.classList.add('show'), 10);
  
  const closeModal = () => {
    modal.classList.remove('show');
    setTimeout(() => modal.remove(), 300);
    document.removeEventListener('keydown', escHandler);
  };
  
  const escHandler = (e) => {
    if (e.key === 'Escape') closeModal();
  };
  
  modal.querySelector('.failure-modal-close').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener('keydown', escHandler);
}

function setupDatabaseFilters(failures) {
  const dbSection = $('section-database');
  if (!dbSection || dbSection.querySelector('.db-filters')) return;
  
  const glassCard = dbSection.querySelector('.glass-card');
  if (!glassCard) return;
  
  const filters = document.createElement('div');
  filters.className = 'db-filters';
  filters.innerHTML = `
    <div class="db-stats">
      <div class="db-stat">
        <div class="db-stat-value">${failures.length}</div>
        <div class="db-stat-label">Total Cases</div>
      </div>
      <div class="db-stat">
        <div class="db-stat-value">${new Set(failures.map(f => f.country)).size}</div>
        <div class="db-stat-label">Countries</div>
      </div>
      <div class="db-stat">
        <div class="db-stat-value">${new Set(failures.map(f => f.sector).filter(Boolean)).size}</div>
        <div class="db-stat-label">Sectors</div>
      </div>
    </div>
    <div class="db-filter-row">
      <input type="text" id="dbSearch" placeholder="Search companies, countries, reasons..." />
      <select id="dbCountryFilter">
        <option value="">All Countries</option>
        ${[...new Set(failures.map(f => f.country))].sort().map(c => `<option value="${c}">${c}</option>`).join('')}
      </select>
      <select id="dbSectorFilter">
        <option value="">All Sectors</option>
        ${[...new Set(failures.map(f => f.sector).filter(Boolean))].sort().map(s => `<option value="${s}">${s}</option>`).join('')}
      </select>
    </div>
  `;
  
  glassCard.insertBefore(filters, $('dbList'));
  
  const search = $('dbSearch');
  const countryFilter = $('dbCountryFilter');
  const sectorFilter = $('dbSectorFilter');
  
  const applyFilters = () => {
    const q = search.value.toLowerCase();
    const country = countryFilter.value;
    const sector = sectorFilter.value;
    
    const filtered = failures.filter(f => {
      if (country && f.country !== country) return false;
      if (sector && f.sector !== sector) return false;
      if (q) {
        const haystack = `${f.name} ${f.country} ${f.reason} ${f.summary || ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
    
    renderDatabase(filtered);
  };
  
  search.addEventListener('input', applyFilters);
  countryFilter.addEventListener('change', applyFilters);
  sectorFilter.addEventListener('change', applyFilters);
}

// ============ Export ============
function setupExport() {
  const btn = $('exportBtn');
  if (!btn) return;
  
  btn.addEventListener('click', () => {
    window.print();
  });
}



// ============================================================
// ============ SUPABASE AUTH + CLOUD HISTORY (Layer 7) =======
// ============================================================

let supabase = null;
let currentUser = null;

async function initSupabase() {
  try {
    const res = await fetch('/api/config');
    const config = await res.json();
    
    if (!config.supabaseUrl || !config.supabaseAnonKey) {
      console.warn('Supabase not configured — running local-only');
      return false;
    }
    
    supabase = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      currentUser = session.user;
      updateAuthUI();
      await loadCloudHistory();
    }
    
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        currentUser = session.user;
        updateAuthUI();
        await loadCloudHistory();
      } else {
        currentUser = null;
        updateAuthUI();
        loadHistory();
      }
    });
    
    return true;
  } catch (err) {
    console.error('Supabase init error:', err);
    return false;
  }
}

function setupAuth() {
  const signInBtn = $('signInBtn');
  const signOutBtn = $('signOutBtn');
  const authModal = $('authModal');
  const authModalClose = $('authModalClose');
  const authForm = $('authForm');
  const authSwitchBtn = $('authSwitchBtn');
  
  let isSignUp = false;
  
  const openModal = () => {
    if (!supabase) {
      alert('Authentication is not configured yet.');
      return;
    }
    authModal.classList.remove('hidden');
    setTimeout(() => $('authEmail')?.focus(), 100);
  };
  
  const closeModal = () => {
    authModal.classList.add('hidden');
    authForm.reset();
    $('authError').classList.add('hidden');
  };
  
  signInBtn?.addEventListener('click', openModal);
  signOutBtn?.addEventListener('click', async () => {
    if (!confirm('Sign out?')) return;
    await supabase.auth.signOut();
    currentUser = null;
    updateAuthUI();
    showToast('Signed out', 'success');
  });
  
  authModalClose?.addEventListener('click', closeModal);
  authModal?.addEventListener('click', (e) => {
    if (e.target === authModal) closeModal();
  });
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && authModal && !authModal.classList.contains('hidden')) closeModal();
  });
  
  authSwitchBtn?.addEventListener('click', () => {
    isSignUp = !isSignUp;
    $('authTitle').textContent = isSignUp ? 'Create your account' : 'Welcome back';
    $('authSubtitle').textContent = isSignUp 
      ? 'Save your analysis history across devices' 
      : 'Sign in to save your analysis history';
    $('authSubmitText').textContent = isSignUp ? 'Sign Up' : 'Sign In';
    $('authSwitchText').textContent = isSignUp 
      ? 'Already have an account?' 
      : "Don't have an account?";
    $('authSwitchBtn').textContent = isSignUp ? 'Sign In' : 'Sign Up';
    $('authPassword').setAttribute('autocomplete', isSignUp ? 'new-password' : 'current-password');
    $('authError').classList.add('hidden');
  });
  
  authForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = $('authEmail').value.trim();
    const password = $('authPassword').value;
    const submitBtn = $('authSubmitBtn');
    const submitText = $('authSubmitText');
    const errorEl = $('authError');
    
    if (!email || !password) return;
    
    submitBtn.disabled = true;
    submitText.textContent = isSignUp ? 'Creating account…' : 'Signing in…';
    errorEl.classList.add('hidden');
    
    try {
      let result;
      if (isSignUp) {
        result = await supabase.auth.signUp({ email, password });
      } else {
        result = await supabase.auth.signInWithPassword({ email, password });
      }
      
      if (result.error) throw result.error;
      
      if (isSignUp && !result.data.session) {
        errorEl.textContent = '✓ Account created! Please sign in.';
        errorEl.style.background = 'rgba(34, 197, 94, 0.1)';
        errorEl.style.borderLeftColor = '#22C55E';
        errorEl.style.color = '#86EFAC';
        errorEl.classList.remove('hidden');
        
        setTimeout(() => {
          isSignUp = false;
          $('authTitle').textContent = 'Welcome back';
          $('authSubtitle').textContent = 'Sign in to save your analysis history';
          $('authSubmitText').textContent = 'Sign In';
          $('authSwitchText').textContent = "Don't have an account?";
          $('authSwitchBtn').textContent = 'Sign Up';
          errorEl.classList.add('hidden');
          errorEl.style = '';
        }, 2500);
      } else {
        closeModal();
        showToast(isSignUp ? '✓ Account created!' : '✓ Signed in!', 'success');
      }
    } catch (err) {
      errorEl.textContent = err.message || 'Authentication failed';
      errorEl.style.background = 'rgba(239, 68, 68, 0.1)';
      errorEl.style.borderLeftColor = '#EF4444';
      errorEl.style.color = '#FCA5A5';
      errorEl.classList.remove('hidden');
    } finally {
      submitBtn.disabled = false;
      submitText.textContent = isSignUp ? 'Sign Up' : 'Sign In';
    }
  });
}

function updateAuthUI() {
  const authSection = $('authSection');
  const userSection = $('userSection');
  
  if (currentUser) {
    authSection?.classList.add('hidden');
    userSection?.classList.remove('hidden');
    
    const name = currentUser.user_metadata?.name 
              || currentUser.email?.split('@')[0] 
              || 'User';
    const email = currentUser.email || '';
    
    if ($('userName')) $('userName').textContent = name;
    if ($('userEmail')) $('userEmail').textContent = email;
    if ($('userAvatar')) $('userAvatar').textContent = name.charAt(0).toUpperCase();
  } else {
    authSection?.classList.remove('hidden');
    userSection?.classList.add('hidden');
  }
}

async function saveToCloud(idea, country, sector, budget, analysis) {
  if (!supabase || !currentUser) return false;
  
  try {
    const { error } = await supabase.from('analyses').insert({
      user_id: currentUser.id,
      idea: idea,
      country: country,
      sector: sector,
      budget: budget,
      risk_score: analysis.riskScore,
      verdict: analysis.verdict,
      report: analysis
    });
    
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Cloud save error:', err);
    return false;
  }
}

async function loadCloudHistory() {
  if (!supabase || !currentUser) return;
  
  const list = $('historyList');
  if (list) {
    list.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 40px;">Loading history…</p>';
  }
  
  try {
    const { data, error } = await supabase
      .from('analyses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) throw error;
    
    if (!list) return;
    
    if (!data || data.length === 0) {
      list.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 40px;">No analyses yet. Run your first analysis!</p>';
      return;
    }
    
    list.innerHTML = data.map((h) => {
      const date = new Date(h.created_at);
      const timeAgo = getTimeAgo(date);
      const flag = COUNTRY_DATA[h.country]?.flag || '🌐';
      return `
        <div class="history-item" data-cloud-id="${h.id}">
          <div class="idea">${h.idea.substring(0, 80)}${h.idea.length > 80 ? '...' : ''}</div>
          <div class="meta">${flag} ${h.risk_score}% · ${timeAgo}</div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Cloud history load error:', err);
    loadHistory();
  }
}

function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
  if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
  if (seconds < 604800) return Math.floor(seconds / 86400) + 'd ago';
  return date.toLocaleDateString();
}

// ============ Initialize Layer 7 ============
document.addEventListener('DOMContentLoaded', () => {
  // Wait a bit for main DOMContentLoaded to finish
  setTimeout(() => {
    setupAuth();
    initSupabase();
  }, 100);
});
