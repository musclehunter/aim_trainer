// i18n.js

/**
 * 多言語化ロジックおよび文言定義
 * index.html の <script src="i18n.js"></script> は scripts.js の前に配置してください
 */

// 言語コードと表示名のマッピング
const langNames = {
  ja: '日本語',
  en: 'English',
  es: 'Español',
  zh: '中文',
  pt: 'Português'
};

// 利用可能な言語コード一覧
const availableLangs = Object.keys(langNames);

// 各言語向けUI文言定義
const texts = {
  ja: {
    sizes: ['3','8','12','16','20'], ranges: ['狭い','やや狭い','標準','やや広い','広い'], colors: ['赤','白','青','黄色','紫','緑'],
    settings: 'ゲーム設定', size: 'ターゲットサイズ(px)', sensitivity: '感度(0.01〜1.00)',
    range: '出現範囲', cursorColor: 'カーソル色', assist: '補助: 的とカーソルを直線で結ぶ', startBtn: 'スタート',
    gameOver: 'ゲーム終了', rank: '順位', score: 'スコア', avgTime: '平均時間(s)', misses: 'ミス', hitRate: 'ヒット率(%)',
    date: '日時', clickRow: '行をクリックして詳細を表示', backToSettings: '設定に戻る', detailHeader: '詳細', target: '的', time: '残り時間(s)', last: '前回時間'
  },
  en: {
    sizes: ['3','8','12','16','20'], ranges: ['Narrow','Somewhat Narrow','Standard','Somewhat Wide','Wide'], colors: ['Red','White','Blue','Yellow','Purple','Lime'],
    settings: 'Game Settings', size: 'Target Size(px)', sensitivity: 'Sensitivity(0.01-1.00)',
    range: 'Spawn Range', cursorColor: 'Cursor Color', assist: 'Assist: Draw line to target', startBtn: 'Start',
    gameOver: 'Game Over', rank: 'Rank', score: 'Score', avgTime: 'Avg Time(s)', misses: 'Misses', hitRate: 'Hit Rate(%)',
    date: 'Date', clickRow: 'Click a row to view details', backToSettings: 'Back to Settings', detailHeader: 'Details', target: 'Target', time: 'Time(s)', last: 'Last'
  },
  es: {
    sizes: ['3','8','12','16','20'], ranges: ['Estrecho','Algo estrecho','Estándar','Algo amplio','Amplio'], colors: ['Rojo','Blanco','Azul','Amarillo','Púrpura','Verde'],
    settings: 'Configuración', size: 'Tamaño(px)', sensitivity: 'Sensibilidad(0.01-1.00)', range: 'Rango', cursorColor: 'Color del cursor', assist: 'Asistencia: línea al objetivo', startBtn: 'Comenzar',
    gameOver: 'Fin del juego', rank: 'Posición', score: 'Puntuación', avgTime: 'Tiempo promedio(s)', misses: 'Fallos', hitRate: 'Tasa de acierto(%)', date: 'Fecha', clickRow: 'Haga clic en una filaで詳細を表示', backToSettings: 'Volver a ajustes', detailHeader: 'Detalles', target: 'Objetivo', time: 'Tiempo(s)', last: 'Último'
  },
  zh: {
    sizes: ['3','8','12','16','20'], ranges: ['狭','略狭','标准','略宽','宽'], colors: ['红','白','蓝','黄','紫','绿'],
    settings: '游戏设置', size: '目标大小(px)', sensitivity: '灵敏度(0.01-1.00)', range: '出现范围', cursorColor: '光标颜色', assist: '辅助: 目标连线', startBtn: '开始',
    gameOver: '游戏结束', rank: '排名', score: '得分', avgTime: '平均时间(s)', misses: '未命中', hitRate: '命中率(%)', date: '日期', clickRow: '点击行查看详情', backToSettings: '返回设置', detailHeader: '详情', target: '目标', time: '时间(s)', last: '上次'
  },
  pt: {
    sizes: ['3','8','12','16','20'], ranges: ['Estreito','Um pouco estreito','Padrão','Um pouco amplo','Amplo'], colors: ['Vermelho','Branco','Azul','Amarelo','Roxo','Verde'],
    settings: 'Configurações', size: 'Tamanho(px)', sensitivity: 'Sensibilidade(0.01-1.00)', range: 'Alcance', cursorColor: 'Cor do cursor', assist: 'Assistência: linha para alvo', startBtn: 'Iniciar',
    gameOver: 'Fim de jogo', rank: 'Ranking', score: 'Pontuação', avgTime: 'Tempo médio(s)', misses: 'Erros', hitRate: 'Taxa de acerto(%)', date: 'Data', clickRow: 'Clique na linha para detalhes', backToSettings: 'Voltar às Configurações', detailHeader: 'Detalhes', target: 'Alvo', time: 'Tempo(s)', last: 'Último'
  }
};

/**
 * 設定画面のプルダウンを生成（langSelect 表示名は langNames を利用）
 * @param {string} lang 言語コード
 */
function populateOptions(lang) {
  const t = texts[lang];
  document.getElementById('sizeSelect').innerHTML = t.sizes.map(v => `<option value="${v}">${v}</option>`).join('');
  document.getElementById('rangeSelect').innerHTML = t.ranges.map((label,i) => `<option value="${[0.2,0.4,0.6,0.8,1.0][i]}">${label}</option>`).join('');
  document.getElementById('cursorColorSelect').innerHTML = t.colors.map((label,i) => `<option value="${['red','white','blue','yellow','purple','lime'][i]}">${label}</option>`).join('');
  // 言語選択プルダウン
  document.getElementById('langSelect').innerHTML = availableLangs.map(code => `<option value="${code}">${langNames[code]}</option>`).join('');
  // 選択中の言語を保持
  document.getElementById('langSelect').value = lang;
}

/**
 * UIラベルを翻訳（言語ラベルは固定英語）
 * @param {string} lang 言語コード
 */
function translateUI(lang) {
  const t = texts[lang];
  document.getElementById('labelSettings').textContent    = t.settings;
  document.getElementById('labelSize').textContent        = t.size;
  document.getElementById('labelSensitivity').textContent = t.sensitivity;
  document.getElementById('labelRange').textContent       = t.range;
  document.getElementById('labelCursorColor').textContent = t.cursorColor;
  document.getElementById('labelAssist').textContent      = t.assist;
  // labelLangLabel は固定英語
  document.getElementById('startBtn').textContent         = t.startBtn;
  document.getElementById('labelGameOver').textContent    = t.gameOver;
  document.getElementById('labelRank').textContent        = t.rank;
  document.getElementById('labelScore').textContent       = t.score;
  document.getElementById('labelAvgTime').textContent     = t.avgTime;
  document.getElementById('labelMisses').textContent      = t.misses;
  document.getElementById('labelHitRate').textContent     = t.hitRate;
  document.getElementById('labelDate').textContent        = t.date;
  document.getElementById('labelClickRow').textContent    = t.clickRow;
  document.getElementById('backBtn').textContent          = t.backToSettings;
}

// -- End of i18n.js --
