# HTML構造とコンポーネントのルール

## 設定画面のHTML構造

### 1. ヘッダーレイアウト
```html
<div class="settings-header">
  <div class="header-left">
    <h2 id="labelXXX"></h2>
  </div>
  <div class="header-right">
    <label class="lang-select">
      <span id="labelXXX"></span>
      <select id="xxxSelect" data-list="true"></select>
    </label>
    <!-- ヘッダー内のボタンは必ずlabelで囲む -->
    <label class="header-button-container">
      <span id="labelXXX"></span>
      <button id="xxxButton" class="xxx-button" data-i18n="xxxButton"></button>
    </label>
  </div>
</div>

### 2. 基本レイアウト
```html
<div class="settings-container">
  <div class="settings-main">
    <!-- メインコンテンツ -->
  </div>
  <div class="settings-side">
    <!-- サイドコンテンツ -->
  </div>
</div>
```

### 2. フォーム要素の構造

#### 通常の入力フィールド
```html
<label>
  <span id="labelXXX"></span>
  <select id="xxxSelect" data-list="true"></select>
</label>
```

#### チェックボックス
```html
<label>
  <input type="checkbox" id="xxxCheckbox">
  <span id="labelXXX"></span>
</label>
```

#### ボタン
```html
<button id="xxxButton" class="xxx-button" data-i18n="xxxButton"></button>
```

## 多言語化対応

### 1. テキストの定義
- 全てのテキストは `i18n.js` の `texts` オブジェクトで定義
- 各言語ごとに対応するキーを必ず用意

### 2. テキストの適用方法
以下のいずれかの方法で統一する：
1. `id="labelXXX"` を使用し、JavaScriptで設定
   ```javascript
   element.textContent = texts[lang].xxx
   ```
2. `data-i18n` 属性を使用
   ```html
   <element data-i18n="xxx"></element>
   ```

## チェックリスト

新しい要素を追加する際は、以下を確認：
- [ ] ラベルの構造が既存の要素と一致しているか
- [ ] 多言語化の方法が既存の要素と一致しているか
- [ ] `texts` オブジェクトに全ての言語の翻訳が追加されているか
- [ ] `translateUI()` 関数で新しい要素の翻訳が処理されるか

## よくある問題と解決策

1. 言語切り替えが機能しない
   - 原因：構造の不一致
   - 解決：上記の構造に従う

2. テキストが表示されない
   - 原因：翻訳キーの不足
   - 解決：全ての言語の翻訳を追加

3. メンテナンス性の低下
   - 原因：異なる翻訳方法の混在
   - 解決：プロジェクト全体で一貫した方法を使用
