# UGIB 急性上消化道出血風險分級

線上版：https://yht5582-source.github.io/UGIBleeding/

單一 HTML、無外部相依的臨床決策輔助頁面。輸入一次生命徵象與抽血，同步計算
**Glasgow-Blatchford Score (GBS)** 與 **Pre-endoscopic Rockall Score**，並對應
**ACG 2021 上消化道及潰瘍出血指引**（Laine et al., Am J Gastroenterol 2021;116:899–917）。

## 功能

- **GBS**：BUN（可切換 urea mmol/L）、Hb（依性別）、SBP、心跳、黑便、暈厥、肝病、心衰竭；附計分明細。
  - 0–1：極低風險，可出院門診追蹤（ACG #1）
  - ≥ 2：住院/留觀，24 小時內內視鏡（ACG #5）
  - ≥ 7：高風險，先復甦再於 24 小時內內視鏡（ACG 2021 不再建議常規 ≤ 12 小時）
- **Pre-endoscopic Rockall**（0–7 分）：年齡、休克、共病；附 Rockall 1996 原始世代死亡率對照。
- **輸血閾值**：Hb 7 g/dL；已知心血管疾病 8 g/dL；ACS 可考慮更高（ACG #2）。
- **內視鏡前處置**：erythromycin 250 mg IV（#3）、PPI（#4 無建議）、時機（#5）。
- **Forrest 分類 → 止血與 PPI 方案**（#6–#16）：高劑量 PPI 3 天，之後 BID 至 2 週；再出血、TAE。
- **疑靜脈曲張出血**：提示改依 Baveno VII 處置（ACG 2021 不涵蓋）。
- 空白或不合理數值**不計分**，顯示「尚缺」項目；輸入內容存於本機 localStorage。
- PWA：manifest + service worker，可加入主畫面並離線使用。

## 檔案

| 檔案 | 用途 |
|---|---|
| `index.html` | 頁面；計算引擎在 `/*ENGINE-START*/ … /*ENGINE-END*/` |
| `tests.cjs` | 引擎測試：`node tests.cjs` |
| `manifest.json`、`icon.svg`、`sw.js` | PWA |

## 聲明

僅為臨床決策輔助，不能取代臨床判斷。所有運算在瀏覽器本機完成，不傳送任何資料。
