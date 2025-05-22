// scripts.js

/*
  ゲーム設定とロジック
  多言語化部分は i18n.js で定義された populateOptions と translateUI を利用
  index.html にて <script src="i18n.js"></script> の後に読み込むこと
*/

// DOM 要素参照
const sizeSelect       = document.getElementById('sizeSelect');
const sensitivityInput = document.getElementById('sensitivityInput');
const rangeSelect      = document.getElementById('rangeSelect');
const cursorColorSelect= document.getElementById('cursorColorSelect');
const assistCheckbox   = document.getElementById('assistCheckbox');
const langSelect       = document.getElementById('langSelect');
const loadPrevEl       = document.getElementById('loadPrev');
const startBtn         = document.getElementById('startBtn');
const settingsDiv      = document.getElementById('settings');
const canvas           = document.getElementById('gameCanvas');
const ctx              = canvas.getContext('2d');
const gameOverDiv      = document.getElementById('gameOver');
const scoreTableBody   = document.querySelector('#scoreTable tbody');
const detailView       = document.getElementById('detailView');
const backBtn          = document.getElementById('backBtn');

// デフォルト設定
const DEFAULTS = {
  size: 20,
  sensitivity: 1.00,
  range: 0.6,
  cursorColor: 'red',
  assist: false,
  lang: 'ja'
};

function saveConfig(cfg) {
  localStorage.setItem('gameConfig', JSON.stringify(cfg));
}

function loadConfig() {
  const data = localStorage.getItem('gameConfig');
  return data ? JSON.parse(data) : null;
}

// 初期化処理
window.addEventListener('DOMContentLoaded', () => {
  const cfg = loadConfig() || DEFAULTS;
  // 多言語化初期化
  langSelect.value = cfg.lang;
  populateOptions(cfg.lang);
  translateUI(cfg.lang);

  // 設定項目を初期化
  sizeSelect.value       = cfg.size;
  sensitivityInput.value = cfg.sensitivity.toFixed(2);
  rangeSelect.value      = cfg.range;
  cursorColorSelect.value= cfg.cursorColor;
  assistCheckbox.checked = cfg.assist;

  // 画面切替
  settingsDiv.style.display   = 'block';
  canvas.style.display        = 'none';
  gameOverDiv.style.display   = 'none';
});

// 言語変更時の再描画
langSelect.addEventListener('change', () => {
  const newLang = langSelect.value;
  populateOptions(newLang);
  translateUI(newLang);
});

// Canvas リサイズ
let width, height;
function resize() {
  width  = canvas.width  = window.innerWidth;
  height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// ゲーム変数
let score, startTime, mouse, targetX, targetY, stats;
let targetSize, sensitivity, spawnRange, cursorColor, assist;
const timeLimit = 20; // 秒

// ターゲット出現
function spawnTarget() {
  targetX = Math.random() * width * spawnRange + (width * (1 - spawnRange) / 2);
  targetY = Math.random() * height * spawnRange + (height * (1 - spawnRange) / 2);
  stats.push({ spawn: performance.now(), misses: 0 });
}

// ゲームオーバー処理
function gameOver() {
  // ラベル再翻訳
  translateUI(langSelect.value);

  const t = texts[langSelect.value];
  const missTotal    = stats.reduce((a, c) => a + c.misses, 0);
  const successCount = stats.filter(c => typeof c.hit === 'number').length;
  const totalTime    = stats.reduce((a, c) => a + (((typeof c.hit === 'number' ? c.hit : c.spawn) - c.spawn)), 0);
  const avgTime      = successCount ? totalTime / 1000 / successCount : 0;
  const hitRate      = (successCount + missTotal) ? (successCount / (successCount + missTotal) * 100) : 0;

  let hs = JSON.parse(localStorage.getItem('highScores') || '[]');
  const entry = { score, avgTime, misses: missTotal, hitRate, time: Date.now(), details: stats.slice() };
  hs.push(entry);
  hs.sort((a,b) => b.score - a.score);
  if (hs.length > 10) hs.length = 10;
  localStorage.setItem('highScores', JSON.stringify(hs));

  const rank = hs.findIndex(e => e.time === entry.time);
  scoreTableBody.innerHTML = '';
  detailView.innerHTML = `<p>${t.clickRow}</p>`;

  hs.forEach((e, i) => {
    const tr = document.createElement('tr');
    if (i === rank) tr.style.background = '#444';
    tr.innerHTML =
      `<td>${i+1}</td><td>${e.score}</td><td>${e.avgTime.toFixed(2)}</td>` +
      `<td>${e.misses}</td><td>${e.hitRate.toFixed(1)}</td>` +
      `<td>${new Date(e.time).toLocaleString()}</td>`;
    if (e.details && e.details.length) {
      tr.style.cursor = 'pointer';
      tr.addEventListener('click', () => {
        detailView.innerHTML = `<h3>${t.detailHeader}</h3><ul>` +
          e.details.map((d, j) => {
            const dt = ((d.hit || d.spawn) - d.spawn) / 1000;
            return `<li>${t.target} ${j+1}: time=${dt.toFixed(3)}s, misses=${d.misses}</li>`;
          }).join('') + '</ul>';
      });
    }
    scoreTableBody.appendChild(tr);
  });

  settingsDiv.style.display = 'none';
  canvas.style.display      = 'none';
  gameOverDiv.style.display = 'block';
}

// スタート処理
startBtn.addEventListener('click', () => {
  const cfg = {
    size:        parseInt(sizeSelect.value, 10),
    sensitivity: parseFloat(sensitivityInput.value),
    range:       parseFloat(rangeSelect.value),
    cursorColor: cursorColorSelect.value,
    assist:      assistCheckbox.checked,
    lang:        langSelect.value
  };
  saveConfig(cfg);

  targetSize  = cfg.size;
  sensitivity = cfg.sensitivity;
  spawnRange  = cfg.range;
  cursorColor = cfg.cursorColor;
  assist      = cfg.assist;
  score       = 0;
  mouse       = { x: width/2, y: height/2 };
  stats       = [];
  startTime   = performance.now();

  spawnTarget();
  settingsDiv.style.display = 'none';
  canvas.style.display      = 'block';
  gameOverDiv.style.display = 'none';

  requestAnimationFrame(loop);
});

// 設定画面に戻る
backBtn.addEventListener('click', () => {
  settingsDiv.style.display   = 'block';
  gameOverDiv.style.display = 'none';
});

// マウス追従
canvas.addEventListener('mousemove', e => {
  mouse.x += (e.clientX - mouse.x) * sensitivity;
  mouse.y += (e.clientY - mouse.y) * sensitivity;
});

// クリック判定
canvas.addEventListener('click', e => {
  if ((performance.now() - startTime)/1000 >= timeLimit) return;
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  if (Math.hypot(mx - targetX, my - targetY) <= targetSize) {
    score++;
    stats[stats.length - 1].hit = performance.now();
    spawnTarget();
  } else {
    stats[stats.length - 1].misses++;
  }
});

// メインループ
function loop(now) {
  const elapsed = (now - startTime) / 1000;
  if (elapsed >= timeLimit) return gameOver();

  ctx.fillStyle = '#111'; ctx.fillRect(0, 0, width, height);

  // ターゲット描画
  ctx.fillStyle = '#e63946'; ctx.beginPath(); ctx.arc(targetX, targetY, targetSize, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(targetX, targetY, targetSize, 0, Math.PI * 2); ctx.stroke();

  // 中心小円
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(targetX, targetY, 1.5, 0, Math.PI * 2); ctx.fill();

  // 補助線
  if (assist) {
    ctx.strokeStyle = cursorColor; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(targetX, targetY); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
  }

  // カーソル描画
  ctx.strokeStyle = cursorColor; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(mouse.x - 10, mouse.y); ctx.lineTo(mouse.x + 10, mouse.y);
  ctx.moveTo(mouse.x, mouse.y - 10); ctx.lineTo(mouse.x, mouse.y + 10);
  ctx.stroke();

  // HUD描画
  const t = texts[langSelect.value];
  const lastStat = stats.length ? stats[stats.length - 1] : { spawn: startTime, hit: startTime, misses: 0 };
  const lastTime = ((lastStat.hit || lastStat.spawn) - lastStat.spawn) / 1000;
  const lastVal = lastTime.toFixed(3) + 's';
  const currRate = (score + lastStat.misses) ? ((score / (score + lastStat.misses) * 100).toFixed(1) + '%') : '0.0%';

  ctx.fillStyle = '#fff'; ctx.font = '20px sans-serif';
  ctx.fillText(`${t.score}: ${score}`, 10, 30);
  ctx.fillText(`${t.time}: ${(timeLimit - elapsed).toFixed(1)}s`, 10, 60);
  ctx.fillText(`${t.last}: ${lastVal}`, 10, 90);
  ctx.fillText(`${t.hitRate}: ${currRate}`, 10, 120);

  requestAnimationFrame(loop);
}

// -- End of scripts.js --
