// BCswap - script.js
const $ = id => document.getElementById(id);

const fmt = {
  price(n) {
    if (!n && n !== 0) return '—';
    n = parseFloat(n);
    if (n < 0.000001) return '$' + n.toExponential(2);
    if (n < 0.01) return '$' + n.toFixed(6);
    if (n < 1) return '$' + n.toFixed(4);
    if (n < 1000) return '$' + n.toFixed(3);
    return '$' + n.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
  },
  large(n) {
    if (!n) return '—';
    if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
    return '$' + parseFloat(n).toFixed(2);
  },
  pct(n) {
    if (n === undefined || n === null) return '—';
    const v = parseFloat(n);
    return (v > 0 ? '+' : '') + v.toFixed(1) + '%';
  },
  addr(a) { return a ? a.slice(0, 6) + '…' + a.slice(-4) : '—'; }
};

const LOGO_COLORS = ['#9945ff', '#f7c600', '#1a6bff', '#16c784', '#ea3943', '#ff6b2b'];

// Toast
function toast(msg, type = 'info') {
  const container = $('toasts');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 400);
  }, 2800);
}

// Load Coins from API
let allCoins = [];

async function loadCoins() {
  const grid = $('coin-grid');
  grid.innerHTML = Array(12).fill('<div class="skel"></div>').join('');

  try {
    const res = await fetch('https://coinhat.onrender.com/api/coins');
    const data = await res.json();

    if (data.ok && Array.isArray(data.coins)) {
      allCoins = data.coins.map(c => ({
        pairAddress: c.pairAddress,
        baseToken: {
          name: c.name || 'Unknown',
          symbol: c.symbol || '???',
          address: c.address
        },
        priceUsd: c.priceUsd,
        priceChange: { h24: c.change24h },
        marketCap: c.marketCap,
        volume: { h24: c.volume24h },
        liquidity: { usd: c.liquidity },
        info: {
          imageUrl: c.imageUrl
        }
      }));

      renderCoins(allCoins);
      buildTicker(allCoins);
    } else {
      throw new Error();
    }
  } catch (e) {
    toast('Erro na API. Usando modo demo...', 'error');
    // Mock data
    allCoins = [];
    renderCoins([]);
  }
}

function renderCoins(coins) {
  const grid = $('coin-grid');
  grid.innerHTML = '';

  coins.slice(0, 18).forEach((p, i) => {
    const price = parseFloat(p.priceUsd || 0);
    const chg = parseFloat(p.priceChange?.h24 || 0);
    const up = chg >= 0;
    const col = LOGO_COLORS[i % LOGO_COLORS.length];
    const hasImg = p.info?.imageUrl;

    const card = document.createElement('div');
    card.className = 'coin-card';
    card.innerHTML = `
      <div class="card-top">
        <div class="card-logo-wrap">
          \( {hasImg ? `<img class="card-logo" src=" \){p.info.imageUrl}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">` : ''}
          <div class="card-logo-fb" style="background:\( {col};display: \){hasImg ? 'none' : 'flex'}">${(p.baseToken.symbol || '?').slice(0, 2)}</div>
          <div class="card-live-dot"></div>
        </div>
        <div class="card-chg-badge ${up ? 'up' : 'dn'}">
          ${up ? '▲' : '▼'} ${Math.abs(chg).toFixed(1)}%
        </div>
      </div>
      <div class="card-body">
        <div class="c-name">${p.baseToken.name}</div>
        <div class="c-sym">${p.baseToken.symbol}</div>
        <div class="c-price">${fmt.price(price)}</div>
        <div class="card-stats">
          <div class="cs-item"><div class="cs-lbl">Mkt Cap</div><div class="cs-val">${fmt.large(p.marketCap)}</div></div>
          <div class="cs-item"><div class="cs-lbl">Vol 24h</div><div class="cs-val">${fmt.large(p.volume?.h24)}</div></div>
        </div>
      </div>
    `;
    card.addEventListener('click', () => openModal(p));
    grid.appendChild(card);
  });
}

// Ticker
function buildTicker(coins) {
  const items = coins.slice(0, 10).map(p => ({
    sym: p.baseToken.symbol,
    price: parseFloat(p.priceUsd || 0),
    chg: parseFloat(p.priceChange?.h24 || 0)
  }));

  let html = '';
  items.forEach(t => {
    html += `
      <span class="t-item">
        <span class="t-sym">${t.sym}</span>
        <span class="t-p">${fmt.price(t.price)}</span>
        <span class="t-c \( {t.chg >= 0 ? 'up' : 'dn'}"> \){t.chg >= 0 ? '+' : ''}${t.chg.toFixed(1)}%</span>
      </span>`;
  });
  $('ticker-track').innerHTML = html + html;
}

// Modal
let currentPair = null;

function openModal(pair) {
  currentPair = pair;
  const hasImg = pair.info?.imageUrl;

  // Logo
  if (hasImg) {
    $('m-logo').src = hasImg;
    $('m-logo').style.display = 'block';
    $('m-logo-fb').style.display = 'none';
  } else {
    $('m-logo').style.display = 'none';
    const fb = $('m-logo-fb');
    fb.style.display = 'flex';
    fb.style.background = LOGO_COLORS[Math.floor(Math.random() * LOGO_COLORS.length)];
    fb.textContent = (pair.baseToken.symbol || '?').slice(0, 2);
  }

  // Info
  $('m-name').textContent = pair.baseToken.name || '—';
  $('m-sym').textContent = pair.baseToken.symbol || '—';
  $('m-price').textContent = fmt.price(pair.priceUsd);
  
  const chg = parseFloat(pair.priceChange?.h24 || 0);
  const mchg = $('m-chg');
  mchg.textContent = fmt.pct(chg);
  mchg.style.color = chg >= 0 ? 'var(--green)' : 'var(--red)';

  $('m-mcap').textContent = fmt.large(pair.marketCap);
  $('m-vol').textContent = fmt.large(pair.volume?.h24);
  $('m-liq').textContent = fmt.large(pair.liquidity?.usd);

  $('m-contract').textContent = fmt.addr(pair.baseToken.address);

  // Chart
  if (pair.pairAddress) {
    \( ('m-chart').src = `https://dexscreener.com/solana/ \){pair.pairAddress}?embed=1&theme=light&info=0`;
  }

  $('token-modal').classList.add('open');
}

function closeModal() {
  $('token-modal').classList.remove('open');
  setTimeout(() => { $('m-chart').src = ''; }, 500);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  // Menu
  $('menu-btn').addEventListener('click', () => $('drawer-overlay').classList.add('open'));
  $('drawer-close').addEventListener('click', () => $('drawer-overlay').classList.remove('open'));
  $('drawer-bg').addEventListener('click', () => $('drawer-overlay').classList.remove('open'));

  // Modal close
  $('modal-close').addEventListener('click', closeModal);
  $('modal-bg').addEventListener('click', closeModal);

  // Copy CA
  $('copy-btn').addEventListener('click', () => {
    if (currentPair?.baseToken?.address) {
      navigator.clipboard.writeText(currentPair.baseToken.address).then(() => toast('CA copiado!', 'success'));
    }
  });

  // Swap button
  $('modal-swap-btn').addEventListener('click', () => {
    closeModal();
    toast('Abrindo Jupiter Swap...', 'info');
  });

  $('nav-swap-btn').addEventListener('click', () => toast('Swap em breve!', 'info'));

  // Filters
  document.querySelectorAll('.ftab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.ftab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      let filtered = [...allCoins];
      const filter = tab.dataset.filter;

      if (filter === 'gainers') filtered.sort((a, b) => (b.priceChange?.h24 || 0) - (a.priceChange?.h24 || 0));
      if (filter === 'losers') filtered.sort((a, b) => (a.priceChange?.h24 || 0) - (b.priceChange?.h24 || 0));
      if (filter === 'volume') filtered.sort((a, b) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0));

      renderCoins(filtered);
    });
  });

  // Init
  loadCoins();
  setInterval(loadCoins, 30000); // Atualiza a cada 30s
});
