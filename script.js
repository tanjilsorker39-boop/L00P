// ============ LOOP — Startup Failure Intelligence ============
// Pro-level demo analysis. AI-ready (OpenAI API can be plugged in).

const $ = (id) => document.getElementById(id);

// ============ Data ============
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

const SECTOR_RISKS = {
  ecommerce: [
    'Cash-intensive operation — প্রতিদিন working capital লাগবে',
    'Consumer trust damaged (Evaly/E-Orange কেলেঙ্কারির পর)',
    'Escrow regulations — customer prepayment ব্যবহার কঠিন',
    'Last-mile delivery খরচ margin খেয়ে ফেলে'
  ],
  fintech: [
    'Bangladesh Bank/RBI লাইসেন্স — ৬-১৮ মাস লাগে',
    'Fraud detection infrastructure ছাড়া চলবে না',
    'CAC বেশি — trust-building সময়সাপেক্ষ',
    'Regulatory changes প্রতি বছর'
  ],
  edtech: [
    'Payment willingness কম — সবাই ফ্রি চায়',
    'Course completion rate মাত্র ৫-১০%',
    'Content production খরচ বেশি',
    "BYJU'S-এর মতো over-expansion এড়ান"
  ],
  healthtech: [
    'Medical liability — আইনি ঝুঁকি বিশাল',
    'Doctor adoption ধীর — tech-averse',
    'Regulatory approval (DGDA) লাগবে',
    'Patient data privacy — HIPAA-সদৃশ নিয়ম'
  ],
  agritech: [
    'Farmer digital literacy কম',
    'Distribution চ্যানেল — গ্রামে পৌঁছানো কঠিন',
    'Seasonal revenue — কিছু মাসে শূন্য',
    'Weather-dependent outcomes'
  ],
  saas: [
    'Global competition — pricing pressure',
    'Churn rate > 5% হলে business model ভাঙবে',
    'Sales cycle দীর্ঘ (৩-৬ মাস)',
    'Support cost scale-এ বাড়ে'
  ],
  marketplace: [
    'Chicken-and-egg problem — supply vs demand',
    'Take rate কম হলে unit economics কাজ করে না',
    'Trust & safety infrastructure ব্যয়বহুল',
    'Disintermediation — user platform ছেড়ে চলে যায়'
  ],
  other: [
    'Product-market fit আগে যাচাই করুন — ৫০+ customer interview',
    'Cash burn কমান — minimum ১৮ মাসের রানওয়ে',
    'Competitor analysis করুন — ১০+ প্রতিদ্বন্দ্বী',
    'Clear differentiation না থাকলে মরে যাবে'
  ]
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
    
    // Re-render charts
    if (state.currentAnalysis) renderCharts(state.currentAnalysis);
  });
}

// ============ Analyze ============
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
  $('analyzeBtn').querySelector('span').textContent = 'Analyzing...';
  
  // Simulate AI delay (replace with real API call later)
  await new Promise(r => setTimeout(r, 1800));
  
  // Run analysis
  const analysis = analyzeIdea(idea, country, sector, budget);
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
}

function analyzeIdea(idea, country, sector, budget) {
  const cData = COUNTRY_DATA[country];
  const sRisks = SECTOR_RISKS[sector] || SECTOR_RISKS.other;
  const bData = BUDGET_DATA[budget];
  const lower = idea.toLowerCase();
  
  // Base score
  let score = 45;
  
  // Country risk
  const countryRisk = { bangladesh: 15, india: 10, indonesia: 8, nigeria: 18, pakistan: 20, global: 5 };
  score += countryRisk[country];
  
  // Sector risk
  const sectorRisk = { ecommerce: 15, fintech: 12, edtech: 18, healthtech: 10, agritech: 15, saas: 5, marketplace: 12, other: 8 };
  score += sectorRisk[sector];
  
  // Budget
  score += bData.risk;
  
  // Idea quality signals
  if (idea.length < 50) score += 15;
  if (idea.length > 150) score -= 8;
  if (/\b(ai|machine learning|ml|llm|gpt)\b/i.test(idea)) score -= 10;
  if (/\b(blockchain|crypto|nft|web3)\b/i.test(idea)) score += 12;
  if (/\b(another|yet another|clone|copy)\b/i.test(idea)) score += 20;
  if (/\b(revolutionary|disrupt|next big)\b/i.test(idea)) score += 8;
  if (/\b(solve|problem|pain point|need)\b/i.test(idea)) score -= 8;
  if (/\b(niche|specific|target)\b/i.test(idea)) score -= 5;
  
  // Clamp
  score = Math.max(15, Math.min(95, Math.round(score)));
  
  // Verdict
  let verdict, verdictColor, verdictText;
  if (score >= 70) {
    verdict = 'HIGH RISK';
    verdictColor = '#EF4444';
    verdictText = 'এই আইডিয়াতে ঢোকার আগে আরও যাচাই করুন। ব্যর্থতার সম্ভাবনা অনেক বেশি।';
  } else if (score >= 50) {
    verdict = 'CAUTION';
    verdictColor = '#F59E0B';
    verdictText = 'আইডিয়া সম্ভাবনাময়, কিন্তু বেশ কিছু ঝুঁকি আছে যা এড়াতে হবে।';
  } else {
    verdict = 'WORTH EXPLORING';
    verdictColor = '#22C55E';
    verdictText = 'আইডিয়াটি তুলনামূলক কম ঝুঁকিপূর্ণ। তবে validation ছাড়া এগোবেন না।';
  }
  
  // Red flags
  const redFlags = [
    ...sRisks.slice(0, 3),
    `${cData.name}-এ top failure reason: ${cData.topFailure}`,
    `Funding trend: ${cData.fundingChange}% (গত ২ বছরে)`,
    `Regulatory: ${cData.regulatory}`
  ];
  
  // Similar failures
  const similarFailures = cData.examples.map(name => ({
    name,
    country: cData.flag + ' ' + cData.name,
    reason: cData.topFailure
  }));
  
  // Checklist
  const checklist = [
    '৫০+ সম্ভাব্য customer-এর সাথে কথা বলেছেন?',
    'প্রতিদ্বন্দ্বীদের pricing ও features জানেন?',
    'প্রথম ৬ মাসের খরচের হিসাব করেছেন?',
    'Product-market fit-এর signal কী হবে জানেন?',
    'কোন metric দেখলে বুঝবেন এটা কাজ করছে না?',
    'Regulatory/legal requirement জানেন?',
    'Unit economics-এ LTV > 3x CAC হবে?'
  ];
  
  // Brutal truth
  const brutalTruths = [
    `আপনি হয়তো আপনার ভিশনকে বাজারের চেয়ে বেশি ভালোবাসছেন। ${cData.name}-এ ${cData.fundingChange}% funding কমেছে — investor-রা এখন নির্বাচনী।`,
    `${cData.examples[0]}-ও একসময় আপনার মতোই আত্মবিশ্বাসী ছিল। কিন্তু cash burn, market timing, এবং customer acquisition-এ হেরে গেছে।`,
    `আপনার sector-এ unit economics শুরু থেকেই positive হতে হবে। ১৮ মাসের কম runway থাকলে শুরুই করবেন না।`,
    `৫০ জন customer interview না করে এক লাইন কোডও লিখবেন না। এটাই #1 মৃত্যুর কারণ।`
  ];
  
  // Chart data
  const categoryData = {
    labels: ['No market need', 'Ran out of cash', 'Wrong team', 'Outcompeted', 'Pricing issues'],
    values: [43, 29, 23, 19, 18]
  };
  
  const trendData = {
    labels: ['2020', '2021', '2022', '2023', '2024', '2025', '2026'],
    values: country === 'bangladesh' ? [120, 100, 60, 30, 15, 8, 6] :
           country === 'india' ? [500, 700, 900, 600, 400, 250, 200] :
           country === 'global' ? [1000, 1400, 1600, 1100, 800, 600, 500] :
           [80, 100, 90, 60, 40, 25, 20]
  };
  
  return {
    riskScore: score,
    verdict,
    verdictColor,
    verdictText,
    redFlags,
    similarFailures,
    checklist,
    brutalTruth: brutalTruths[Math.floor(Math.random() * brutalTruths.length)],
    categoryData,
    trendData
  };
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
  $('similarFailures').innerHTML = analysis.similarFailures.map(f => `
    <div class="failure-card">
      <div class="name">💀 ${f.name}</div>
      <div class="country">${f.country}</div>
      <div class="reason">${f.reason}</div>
    </div>
  `).join('');
  
  // Checklist
  $('checklist').innerHTML = analysis.checklist.map(c => `<li>${c}</li>`).join('');
  setupChecklist();
  
  // Brutal truth
  $('brutalTruth').textContent = analysis.brutalTruth;
  
  // Charts
  renderCharts(analysis);
}

function renderCharts(analysis) {
  // Destroy old charts
  if (state.charts.failure) state.charts.failure.destroy();
  if (state.charts.trend) state.charts.trend.destroy();
  
  const isDark = document.documentElement.dataset.theme === 'dark';
  const textColor = isDark ? '#94A3B8' : '#64748B';
  const gridColor = isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(15, 23, 42, 0.08)';
  
  // Failure chart
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
  
  // Trend chart
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
