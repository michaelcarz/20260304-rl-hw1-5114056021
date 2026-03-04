# HW1 — MDP Grid World

> 深度強化學習 作業一：網格地圖開發 + 策略顯示與價值評估 + 價值迭代最佳策略

## 🔗 線上 Demo

👉 **[GitHub Pages Demo](https://michaelcarz.github.io/20260304-rl-hw1-5114056021/)**  


---

## 📋 功能說明

### HW1-1：網格地圖開發 (60%)

| 功能 | 說明 |
|------|------|
| 網格生成 | 支援 5×5 ~ 9×9 維度選擇 |
| 起點設定 | 第 1 次點擊，格子變為 🟩 綠色 |
| 終點設定 | 第 2 次點擊，格子變為 🟥 紅色 |
| 障礙物設定 | 後續點擊，格子變為 ⬜ 灰色（最多 n-2 個） |
| 取消設定 | 再次點擊已設定的格子可取消 |

### HW1-2：策略顯示與價值評估 (40%)

| 功能 | 說明 |
|------|------|
| 隨機策略 | 為每個非終點/非障礙格生成隨機行動（↑↓←→） |
| 策略評估 | Policy Evaluation 迭代計算 V(s)，γ=0.9 |
| 結果顯示 | 並排顯示 Value Matrix 與 Policy Matrix |

### HW1-3：價值迭代最佳策略

| 功能 | 說明 |
|------|------|
| 價值迭代 | Value Iteration 算法計算最佳價值函數 V*(s) |
| 最佳策略 | 從 V* 提取最佳行動 π*(s)，取代隨機策略 |
| 最佳路徑 | 從起點追蹤最佳路徑至終點（綠色高亮） |
| 熱力圖 | Value Matrix 以色彩梯度顯示價值高低 |

---

## 🚀 啟動方式

### 方式一：直接開啟 (推薦)

直接在瀏覽器開啟 `index.html`，所有邏輯皆在前端執行。

### 方式二：Flask 開發伺服器

```bash
pip install flask numpy
python app.py
# 開啟 http://127.0.0.1:5000
```

---

## 📂 檔案結構

```
hw1/
├── index.html          ← GitHub Pages 主頁（靜態版，所有邏輯在前端）
├── app.py              ← Flask 後端版本
├── requirements.txt    ← Python 依賴
├── README.md
├── templates/
│   └── index.html      ← Flask 模板
└── static/
    ├── style.css
    └── script.js
```

---

## ⚙️ 技術細節

### Policy Evaluation 演算法

- **折扣因子** γ = 0.9
- **獎勵設定**：
  - 到達終點：+1
  - 撞障礙物：-1
  - 每步移動：-0.04（living penalty）
- **邊界處理**：撞牆或進入障礙物時留在原地
- **收斂條件**：|ΔV| < 10⁻⁶

---

## 📝 作者資訊

深度強化學習 — HW1
