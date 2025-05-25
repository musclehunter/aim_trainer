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

// ゲーム状態
const gameState = {
  // ゲーム変数
  score: 0,
  startTime: 0,
  mouse: { x: 0, y: 0 },
  targetX: 0,
  targetY: 0,
  stats: [],

  // 設定値
  targetSize: 20,
  sensitivity: 1.0,
  spawnRange: 0.6,
  cursorColor: 'red',
  assist: false,

  // 状態管理
  isActive: false,
  animationFrameId: null,

  // 定数
  timeLimit: 20, // 秒

  // 状態リセット
  reset() {
    this.score = 0;
    this.startTime = performance.now();
    this.mouse = { x: width/2, y: height/2 };
    this.stats = [];
    this.isActive = true;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  },

  // ゲーム終了
  end() {
    this.isActive = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
};

// ターゲット出現
function spawnTarget() {
  gameState.targetX = Math.random() * width * gameState.spawnRange + (width * (1 - gameState.spawnRange) / 2);
  gameState.targetY = Math.random() * height * gameState.spawnRange + (height * (1 - gameState.spawnRange) / 2);
  gameState.stats.push({ spawn: performance.now(), misses: 0 });
}

// ゲームオーバー処理
function gameOver() {
  // ゲーム状態を終了に設定
  gameState.end();

  // 結果計算
  const t = texts[langSelect.value];
  const missTotal    = gameState.stats.reduce((a, c) => a + c.misses, 0);
  const successCount = gameState.stats.filter(c => typeof c.hit === 'number').length;
  const totalTime    = gameState.stats.reduce((a, c) => a + (((typeof c.hit === 'number' ? c.hit : c.spawn) - c.spawn)), 0);
  const avgTime      = successCount ? totalTime / 1000 / successCount : 0;
  const hitRate      = (successCount + missTotal) ? (successCount / (successCount + missTotal) * 100) : 0;

  // 画面切り替え
  canvas.style.display = 'none';
  settingsDiv.style.display = 'none';
  gameOverDiv.style.display = 'block';

  let hs = JSON.parse(localStorage.getItem('highScores') || '[]');
  const entry = { 
    score: gameState.score, 
    avgTime, 
    misses: missTotal, 
    hitRate, 
    time: Date.now(), 
    details: gameState.stats.slice() 
  };
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

  // 画面切り替え
  canvas.style.display = 'none';
  settingsDiv.style.display = 'none';
  gameOverDiv.style.display = 'block';
}

// スタート処理
startBtn.addEventListener('click', () => {
  // 現在の設定を保存
  const cfg = {
    size:        parseInt(sizeSelect.value, 10),
    sensitivity: parseFloat(sensitivityInput.value),
    range:       parseFloat(rangeSelect.value),
    cursorColor: cursorColorSelect.value,
    assist:      assistCheckbox.checked,
    lang:        langSelect.value
  };
  saveConfig(cfg);

  // ゲーム状態を更新
  gameState.targetSize = cfg.size;
  gameState.sensitivity = cfg.sensitivity;
  gameState.spawnRange = cfg.range;
  gameState.cursorColor = cfg.cursorColor;
  gameState.assist = cfg.assist;

  // ゲーム状態をリセット
  gameState.reset();

  // ターゲットを生成
  spawnTarget();

  // 画面切り替え
  settingsDiv.style.display = 'none';
  canvas.style.display = 'block';
  gameOverDiv.style.display = 'none';

  // メインループを開始
  gameState.animationFrameId = requestAnimationFrame(loop);
});

// 設定画面に戻る
backBtn.addEventListener('click', () => {
  // ゲーム状態を終了に設定
  gameState.end();

  // 画面切り替え
  settingsDiv.style.display = 'block';
  canvas.style.display = 'none';
  gameOverDiv.style.display = 'none';
});

// マウス追従
canvas.addEventListener('mousemove', e => {
  if (!gameState.isActive) return;
  gameState.mouse.x += (e.clientX - gameState.mouse.x) * gameState.sensitivity;
  gameState.mouse.y += (e.clientY - gameState.mouse.y) * gameState.sensitivity;
});

// クリック判定
canvas.addEventListener('click', e => {
  if (!gameState.isActive || (performance.now() - gameState.startTime)/1000 >= gameState.timeLimit) return;
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  if (Math.hypot(mx - gameState.targetX, my - gameState.targetY) <= gameState.targetSize) {
    gameState.score++;
    gameState.stats[gameState.stats.length - 1].hit = performance.now();
    spawnTarget();
  } else {
    gameState.stats[gameState.stats.length - 1].misses++;
  }
});

// メインループ
function loop(now) {
  // ゲームがアクティブでない場合はループを終了
  if (!gameState.isActive) {
    return;
  }

  const elapsed = (now - gameState.startTime) / 1000;
  
  // 時間制限のチェック
  if (elapsed >= gameState.timeLimit) {
    // ゲームオーバー処理を実行してループを終了
    gameState.end();
    gameOver();
    return;
  }

  // 画面クリア
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, width, height);

  // ターゲット描画
  ctx.fillStyle = '#e63946';
  ctx.beginPath();
  ctx.arc(gameState.targetX, gameState.targetY, gameState.targetSize, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(gameState.targetX, gameState.targetY, gameState.targetSize, 0, Math.PI * 2);
  ctx.stroke();

  // 中心小円
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(gameState.targetX, gameState.targetY, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // 補助線
  if (gameState.assist) {
    ctx.strokeStyle = gameState.cursorColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(gameState.targetX, gameState.targetY);
    ctx.lineTo(gameState.mouse.x, gameState.mouse.y);
    ctx.stroke();
  }

  // カーソル描画
  ctx.strokeStyle = gameState.cursorColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(gameState.mouse.x - 10, gameState.mouse.y);
  ctx.lineTo(gameState.mouse.x + 10, gameState.mouse.y);
  ctx.moveTo(gameState.mouse.x, gameState.mouse.y - 10);
  ctx.lineTo(gameState.mouse.x, gameState.mouse.y + 10);
  ctx.stroke();

  // HUD描画
  const t = texts[langSelect.value];
  const lastStat = gameState.stats.length ? gameState.stats[gameState.stats.length - 1] : 
    { spawn: gameState.startTime, hit: gameState.startTime, misses: 0 };
  const lastTime = ((lastStat.hit || lastStat.spawn) - lastStat.spawn) / 1000;
  const lastVal = lastTime.toFixed(3) + 's';
  const currRate = (gameState.score + lastStat.misses) ? 
    ((gameState.score / (gameState.score + lastStat.misses) * 100).toFixed(1) + '%') : '0.0%';

  ctx.fillStyle = '#fff';
  ctx.font = '20px sans-serif';
  ctx.fillText(`${t.score}: ${gameState.score}`, 10, 30);
  ctx.fillText(`${t.time}: ${(gameState.timeLimit - elapsed).toFixed(1)}s`, 10, 60);
  ctx.fillText(`${t.last}: ${lastVal}`, 10, 90);
  ctx.fillText(`${t.hitRate}: ${currRate}`, 10, 120);

  // 次のフレームをリクエスト
  if (gameState.isActive) {
    gameState.animationFrameId = requestAnimationFrame(loop);
  }
}

// -- End of scripts.js --
