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
const bgmButton        = document.getElementById('bgmButton');

// BGM設定
const bgm = new Audio('bgm/InfiniteFocus.mp3');
bgm.loop = true;
let isBgmPlaying = false;

// BGMの再生/停止を切り替え
function toggleBgm() {
  const t = texts[langSelect.value];
  if (isBgmPlaying) {
    bgm.pause();
    bgmButton.textContent = t.bgmPlay;
    bgmButton.classList.remove('playing');
  } else {
    bgm.play();
    bgmButton.textContent = t.bgmStop;
    bgmButton.classList.add('playing');
  }
  isBgmPlaying = !isBgmPlaying;
}

// デフォルト設定
// ブラウザの言語設定を取得
function detectLanguage() {
  // サポートする言語のマッピング
  const supportedLangs = {
    'ja': 'ja',
    'ja-jp': 'ja',
    'en': 'en',
    'en-us': 'en',
    'en-gb': 'en',
    'es': 'es',
    'es-es': 'es',
    'zh': 'zh',
    'zh-cn': 'zh',
    'zh-tw': 'zh',
    'pt': 'pt',
    'pt-br': 'pt',
    'pt-pt': 'pt'
  };

  // 優先順位で言語をチェック
  const languages = [
    ...((navigator.languages || []).map(lang => lang.toLowerCase())), // ブラウザの言語リスト
    (navigator.language || '').toLowerCase(),      // メイン言語
    (navigator.browserLanguage || '').toLowerCase(),    // IEの言語
    (navigator.userLanguage || '').toLowerCase(),      // ユーザー言語
    (navigator.systemLanguage || '').toLowerCase()     // システム言語
  ];

  // サポートする言語を探す
  for (const lang of languages) {
    if (lang && supportedLangs[lang]) {
      return supportedLangs[lang];
    }
    // xx-yy 形式の場合、xx部分だけでもチェック
    const mainLang = lang.split('-')[0];
    if (mainLang && supportedLangs[mainLang]) {
      return supportedLangs[mainLang];
    }
  }

  return 'en'; // デフォルトは英語
}

const DEFAULTS = {
  size: 20,
  sensitivity: 0.5,
  range: '250',  // 250x250pxが最小範囲
  cursorColor: 'red',
  assistance: true,
  lang: detectLanguage()
};

function saveConfig(cfg) {
  localStorage.setItem('gameConfig', JSON.stringify(cfg));
}

function loadConfig() {
  const data = localStorage.getItem('gameConfig');
  const config = data ? JSON.parse(data) : null;
  
  // 設定がない場合はデフォルト設定を使用
  if (!config) {
    const defaultConfig = {
      ...DEFAULTS,
      lang: detectLanguage(),
      assistance: true
    };
    return defaultConfig;
  }
  
  // assistance が未設定の場合はデフォルトを true に
  if (config.assistance === undefined) {
    config.assistance = true;
  }
  
  return config;
}

// 初期化処理
// タブの切り替え処理
function switchTab(tabId) {
  // ボタンのアクティブ状態を切り替え
  document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');

  // コンテンツの表示を切り替え
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  document.getElementById(tabId.replace('Tab', 'Content')).classList.add('active');

  // ランキングタブの場合、ランキングを表示
  if (tabId === 'rankingTab') {
    displayRanking();
  }
}

// ランキング表示処理
function displayRanking(currentRank = -1) {
  const t = texts[langSelect.value];
  const hs = JSON.parse(localStorage.getItem('highScores') || '[]');
  const scoreTableBody = document.getElementById('scoreTableBody');
  scoreTableBody.innerHTML = '';
  detailView.innerHTML = `<p>${t.clickRow}</p>`;

  hs.forEach((e, i) => {
    const tr = document.createElement('tr');
    if (i === currentRank) {
      tr.classList.add('current-score');
    }

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
}

window.addEventListener('DOMContentLoaded', async () => {
  // ボタンの初期化
  translateUI();
  bgmButton.addEventListener('click', toggleBgm);
  // バージョン情報の読み込み
  let version = 'dev';
  try {
    const versionModule = await import('./version.js');
    version = versionModule.VERSION;
    document.title = `Aim Trainer v${version}`;
    document.getElementById('version').textContent = `v${version}`;
  } catch (e) {
    console.warn('バージョン情報の読み込みに失敗しました', e);
  }

  const cfg = loadConfig() || DEFAULTS;
  // 多言語化初期化
  langSelect.value = cfg.lang;
  populateOptions(langSelect.value);
  translateUI(langSelect.value);

  // 設定項目を初期化
  sizeSelect.value       = cfg.size;
  sensitivityInput.value = cfg.sensitivity.toFixed(2);
  rangeSelect.value      = cfg.range;
  cursorColorSelect.value= cfg.cursorColor;
  assistCheckbox.checked = cfg.assist;

  // ストレージ情報を表示
  updateStorageInfo();

  // モーダル要素の参照
  const confirmModal = document.getElementById('confirmModal');
  const alertModal = document.getElementById('alertModal');
  const confirmMessage = document.getElementById('confirmMessage');
  const alertMessage = document.getElementById('alertMessage');
  const confirmOkBtn = document.getElementById('confirmOk');
  const confirmCancelBtn = document.getElementById('confirmCancel');
  const alertOkBtn = document.getElementById('alertOk');

  // モーダルのボタンテキストを設定
  const t = texts[langSelect.value];
  confirmOkBtn.textContent = t.confirmOk;
  confirmCancelBtn.textContent = t.confirmCancel;
  alertOkBtn.textContent = t.alertOk;

  // タブの初期化
  const settingsTab = document.getElementById('settingsTab');
  const rankingTab = document.getElementById('rankingTab');
  settingsTab.textContent = texts[langSelect.value].settingsTab;
  rankingTab.textContent = texts[langSelect.value].rankingTab;

  // タブのクリックイベント
  settingsTab.addEventListener('click', () => switchTab('settingsTab'));
  rankingTab.addEventListener('click', () => switchTab('rankingTab'));

  // データ消去ボタンの処理
  document.getElementById('clearDataBtn').onclick = function() {
    confirmMessage.textContent = t.clearConfirm;
    confirmModal.style.display = 'block';
  };

  // 確認ダイアログのボタン処理
  confirmOkBtn.onclick = function() {
    confirmModal.style.display = 'none';
    localStorage.removeItem('gameConfig');
    localStorage.removeItem('highScores');
    // デフォルト設定を適用
    const defaultConfig = {
      ...DEFAULTS,
      lang: detectLanguage(),
      assistance: true
    };
    localStorage.setItem('gameConfig', JSON.stringify(defaultConfig));
    alertMessage.textContent = t.clearComplete;
    alertModal.style.display = 'block';
  };

  confirmCancelBtn.onclick = function() {
    confirmModal.style.display = 'none';
  };

  // 完了通知ダイアログのボタン処理
  alertOkBtn.onclick = function() {
    alertModal.style.display = 'none';
    location.reload();
  };

  // モーダル外クリックで閉じる
  window.onclick = function(event) {
    if (event.target === confirmModal) {
      confirmModal.style.display = 'none';
    } else if (event.target === alertModal) {
      alertModal.style.display = 'none';
      if (alertMessage.textContent === t.clearComplete) {
        location.reload();
      }
    }
  };

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

// ストレージ使用量を計算して表示
function updateStorageInfo() {
  const t = texts[langSelect.value];
  document.getElementById('labelStorageHeader').textContent = t.storageHeader;
  document.getElementById('labelStorageExplain').textContent = t.storageExplain;
  document.getElementById('labelStorageRanking').textContent = t.storageRanking;
  document.getElementById('labelStorageConfig').textContent = t.storageConfig;
  document.getElementById('labelStorageTotal').textContent = t.storageTotal;

  // ストレージ使用量を計算
  const highScores = localStorage.getItem('highScores') || '[]';
  const config = localStorage.getItem('gameConfig') || '{}';  
  const rankingSize = new Blob([highScores]).size;
  const configSize = new Blob([config]).size;
  const totalSize = rankingSize + configSize;

  // KB単位で表示
  document.getElementById('rankingSize').textContent = `${(rankingSize / 1024).toFixed(2)} KB`;
  document.getElementById('configSize').textContent = `${(configSize / 1024).toFixed(2)} KB`;
  document.getElementById('totalSize').textContent = `${(totalSize / 1024).toFixed(2)} KB`;
}

// 言語変更時にストレージ情報も更新
langSelect.addEventListener('change', () => {
  const newLang = langSelect.value;
  populateOptions(newLang);
  translateUI(newLang);
  updateStorageInfo();

  // タブ名を更新
  settingsTab.textContent = texts[newLang].settingsTab;
  rankingTab.textContent = texts[newLang].rankingTab;

  // ランキングタブがアクティブなら再表示
  if (rankingTab.classList.contains('active')) {
    displayRanking();
  }

  // 保存されている設定を再適用
  const cfg = loadConfig();
  if (cfg) {
    sizeSelect.value = cfg.size;
    sensitivityInput.value = cfg.sensitivity;
    rangeSelect.value = cfg.range;
    cursorColorSelect.value = cfg.cursorColor;
    assistCheckbox.checked = cfg.assist;
  }
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

  // 補助線の固定位置
  assistLine: {
    x: 0,
    y: 0,
    isFixed: false
  },
  // カーソル軌跡
  trail: [],
  maxTrailLength: 50,

  // 状態管理
  isActive: false,
  animationFrameId: null,

  // 定数
  timeLimit: 20, // 秒

  // 状態リセット
  reset() {
    this.isActive = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.score = 0;
    this.startTime = performance.now();
    this.stats = [];
    this.assistLine.isFixed = false;
    this.trail = [];
    this.isActive = true;
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
  const rangeValue = parseInt(gameState.spawnRange);
  // 横幅はrangeValueをそのまま使用し、縦幅は768pxを最大として比率計算
  // ただし、ウィンドウサイズより大きくならないように制限
  const rangeX = Math.min(rangeValue, width);
  const rangeY = Math.min(
    Math.min(768, Math.floor(rangeValue * (768/1024))), // 最大768pxの制限
    height // ウィンドウの高さの制限
  );

  // 画面中央を基準に、範囲内にランダムに配置
  // ただし、的が必ず画面内に収まるように調整
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const halfRangeX = rangeX / 2;
  const halfRangeY = rangeY / 2;

  // 画面内に収まるように座標を計算
  gameState.targetX = Math.random() * rangeX + (halfWidth - halfRangeX);
  gameState.targetY = Math.random() * rangeY + (halfHeight - halfRangeY);
  gameState.stats.push({ spawn: performance.now(), misses: 0 });
  // 新しい的が出現したら補助線をリセット
  gameState.assistLine.isFixed = false;
  gameState.trail = [];
}

// ゲームオーバー処理
function gameOver() {
  // ゲーム状態を終了に設定
  gameState.end();

  const t = texts[langSelect.value];
  const avgTime = gameState.stats.reduce((sum, s) => sum + ((s.hit || s.spawn) - s.spawn), 0) / 1000 / gameState.stats.length;
  const missTotal = gameState.stats.reduce((sum, s) => sum + s.misses, 0);
  const hitRate = gameState.stats.length / (gameState.stats.length + missTotal) * 100;

  // スコアを保存
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

  // ランクを確認
  const rank = hs.findIndex(e => e === entry);
  
  // 結果を表示
  settings.style.display = '';
  canvas.style.display = 'none'; // キャンバスを非表示
  document.body.style.overflow = ''; // overflow設定をリセット
  switchTab('rankingTab'); // ランキングタブをアクティブに
  displayRanking(rank); // 現在のスコアを強調表示
  gameState = null;
}

// スタート処理
startBtn.addEventListener('click', e => {
  // 現在の設定を保存
  const cfg = {
    size: parseInt(sizeSelect.value, 10),
    sensitivity: parseFloat(sensitivityInput.value),
    range: parseFloat(rangeSelect.value),
    cursorColor: cursorColorSelect.value,
    assist: assistCheckbox.checked,
    lang: langSelect.value
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

  // 現在のカーソル位置を取得
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  gameState.mouse.x = mouseX;
  gameState.mouse.y = mouseY;

  // 最初の補助線の位置をカーソル位置に設定
  if (gameState.assist) {
    gameState.assistLine.x = mouseX;
    gameState.assistLine.y = mouseY;
    gameState.assistLine.isFixed = true;
    // 最初のカーソル位置を軌跡の開始点として追加
    gameState.trail = [{ x: mouseX, y: mouseY }];
  }

  // ターゲットを生成
  spawnTarget();

  // 画面切り替え
  settingsDiv.style.display = 'none';
  canvas.style.display = 'block'; // キャンバスを表示
  gameOverDiv.style.display = 'none';
  document.body.style.overflow = 'hidden'; // ゲーム中はスクロールを無効化

  // メインループを開始
  requestAnimationFrame(loop);
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

  // 補助線と軌跡
  if (gameState.assist) {
    // 補助線の固定位置を設定
    if (!gameState.assistLine.isFixed) {
      gameState.assistLine.x = gameState.mouse.x;
      gameState.assistLine.y = gameState.mouse.y;
      gameState.assistLine.isFixed = true;
    }

    // 補助線の描画
    ctx.strokeStyle = gameState.cursorColor;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(gameState.assistLine.x, gameState.assistLine.y);
    ctx.lineTo(gameState.targetX, gameState.targetY);
    ctx.stroke();
    ctx.globalAlpha = 1.0;

    // カーソル軌跡の更新と描画
    gameState.trail.push({ x: gameState.mouse.x, y: gameState.mouse.y });
    if (gameState.trail.length > gameState.maxTrailLength) {
      gameState.trail.shift();
    }

    if (gameState.trail.length > 1) {
      ctx.strokeStyle = gameState.cursorColor;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.moveTo(gameState.trail[0].x, gameState.trail[0].y);
      for (let i = 1; i < gameState.trail.length; i++) {
        const point = gameState.trail[i];
        ctx.lineTo(point.x, point.y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }
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

  // 前回時間の計算（最後にヒットした的の情報を使用）
  const lastHitStat = gameState.stats.slice().reverse().find(s => s.hit);
  const lastTime = lastHitStat ? (lastHitStat.hit - lastHitStat.spawn) / 1000 : 0;
  const lastVal = lastTime.toFixed(3) + 's';

  // 全体のヒット率を計算
  const totalShots = gameState.stats.reduce((total, stat) => total + (stat.hit ? 1 : 0) + stat.misses, 0);
  const totalHits = gameState.stats.filter(stat => stat.hit).length;
  const hitRate = totalShots ? ((totalHits / totalShots) * 100).toFixed(1) + '%' : '0.0%';

  ctx.fillStyle = '#fff';
  ctx.font = '20px sans-serif';
  ctx.fillText(`${t.score}: ${gameState.score}`, 10, 30);
  ctx.fillText(`${t.time}: ${(gameState.timeLimit - elapsed).toFixed(1)}s`, 10, 60);
  ctx.fillText(`${t.last}: ${lastVal}`, 10, 90);
  ctx.fillText(`${t.hitRate}: ${hitRate}`, 10, 120);

  // 次のフレームをリクエスト
  if (gameState.isActive) {
    gameState.animationFrameId = requestAnimationFrame(loop);
  }
}

// -- End of scripts.js --
