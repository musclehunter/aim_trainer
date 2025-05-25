# CSSスタイリングルール

## 1. 命名規則

### BEMベース
```css
/* Block */
.block {}

/* Element */
.block__element {}

/* Modifier */
.block--modifier {}
.block__element--modifier {}
```

### コンポーネント固有のクラス
- コンポーネント名をプレフィックスとして使用
  ```css
  .settings-container {}
  .settings-header {}
  .settings-form {}
  ```

## 2. レイアウト構造

### ヘッダー部分
```css
.header-right {
  display: flex;
  align-items: center;
  gap: 15px;  /* 一貫性のために15pxを使用 */
}

/* ヘッダー内のボタンコンテナ */
.header-button-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

/* ラベルテキスト */
.header-button-container span {
  font-size: 0.8em;
  color: #aaa;
}
```

### フォーム要素
```css
.settings-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.settings-item {
  display: flex;
  align-items: center;
  gap: 8px;
}
```

## 3. ボタンスタイル

### 基本ボタン
```css
.button {
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 0.9em;
  min-width: 80px;
  cursor: pointer;
  transition: all 0.3s;
}
```

### 状態変化
```css
.button:hover {
  opacity: 0.8;
}

.button.active,
.button.playing {
  background: rgba(76, 175, 80, 0.4);
}
```

## 4. レスポンシブデザイン

### ブレークポイント
```css
/* モバイル: 320px以上 */
@media (min-width: 320px) {}

/* タブレット: 768px以上 */
@media (min-width: 768px) {}

/* デスクトップ: 1024px以上 */
@media (min-width: 1024px) {}
```

## 5. アニメーション

### トランジション
- 全ての状態変化には0.3秒のトランジションを適用
```css
.interactive-element {
  transition: all 0.3s;
}
```
