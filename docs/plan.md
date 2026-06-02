# Project Plan: 通用型模組化產品體驗中心 (Modular Product Experience Hub)

本文件定義了「通用型模組化產品體驗系統」的架構、流程與實作路徑。本專案依據「植酌 Fizz't WebAR 風味互動體驗提案」的核心邏輯進行設計，將原本單次使用的行銷活動網頁轉化為**可重複利用、透過設定檔（JSON）抽換產品內容的範本化系統**。

---

## 🛠️ 技術選型 (Tech Stack)

* **前端框架 (Framework)**: React 18+ + Tailwind CSS (元件化、高度解耦、動態主題色注入架構)
* **動態特效 (Animation)**: Framer Motion (負責 2D UI 滑動、翻頁等流暢轉場與問答動畫)
* **AR 引擎 (AR Engine)**: MindAR.js / A-Frame (封裝為獨立的 React Canvas 元件，支援網頁端圖像追蹤與 WebAR 影片疊加)
* **狀態管理 (State)**: Zustand (輕量化管理全域主題、設定檔載入狀態與使用者測驗得分)
* **資料驗證 (Validation)**: Zod (用於在前端 runtime 嚴格檢查 JSON 設定檔結構，防止白屏)

---

## 📊 系統架構與業務流程圖 (System Flow)

```mermaid
%%{init: {'theme':'neutral'}}%%
graph TD
    %% 樣式定義
    classDef config fill:#f5f3ff,stroke:#8b5cf6,stroke-width:2px,color:#4c1d95;
    classDef main fill:#eef2ff,stroke:#6366f1,stroke-width:2px,color:#1e40af;
    classDef module fill:#f0fdf4,stroke:#4ade80,stroke-width:1px,color:#166534;
    classDef crm fill:#fef2f2,stroke:#f87171,stroke-width:2px,color:#991b1b;

    %% 全域配置層
    JSON[productConfig.json <br/>全域自訂設定檔]:::config

    %% 總入口 Landing Page
    QR[線下 QR Code 入口] --> Landing[MainHub.jsx <br/>總入口網頁]:::main
    JSON -.->|驅動主題色與素材路徑| Landing

    %% 路由分流
    Landing -->|路徑一| AR_Btn[WebAR 體驗]
    Landing -->|路徑二| Quiz_Btn[互動測驗]
    Landing -->|路徑三| LINE_Btn[直接加入 LINE@]

    %% 模組一：WebAR 體驗（三階段影片播放）
    subgraph "模組 A：ARScanner.jsx（影像追蹤）"
        AR_Btn --> AR_Init[開啟相機 / 載入 Logo 特徵檔]
        AR_Init --> AR_Scan[提示：請對準植酌瓶身 Logo]
        AR_Scan -->|辨識成功| AR_Stage1[1. 播放品牌故事 AI 動畫]
        AR_Stage1 --> AR_Stage2[2. 播放產品介紹+五感互動影片]
        AR_Stage2 --> AR_Stage3[3. 播放調飲示範 AI 動畫]
        AR_Stage3 -->|影片播放結束| AR_CTA[顯示 2D 懸浮導流按鈕]
    end
    class AR_Init,AR_Scan,AR_Stage1,AR_Stage2,AR_Stage3,AR_CTA module;

    %% 模組二：互動測驗
    subgraph "模組 B：QuizModule.jsx"
        Quiz_Btn --> Quiz_Load[讀取問答題目與權重]
        Quiz_Load --> Quiz_Run[問答流程 / Framer Motion 轉場]
        Quiz_Run --> Quiz_Calc[加總分數 / 判定風味人格]
        Quiz_Calc --> Quiz_Result[顯示推薦調飲結果]
        Quiz_Result --> Quiz_CTA[產品導購/領取配方按鈕]
    end
    class Quiz_Load,Quiz_Run,Quiz_Calc,Quiz_Result,Quiz_CTA module;

    %% 最終收斂：LINE CRM 中介層
    subgraph "模組 C：LINERedirect.js"
        %% 分流處理
        LINE_Btn -->|直接加入| LINE_Direct[開啟 LINE 官方帳號連結]
        AR_CTA -->|帶入 AR 觀看標籤| LINE_Param[拼接 Tracking 參數 / LIFF]
        Quiz_CTA -->|帶入測驗結果標籤| LINE_Param
        
        LINE_Param --> LINE_CRM[LINE CRM 系統]:::crm
        LINE_Direct --> LINE_CRM
        LINE_CRM --> CRM_Tags[自動綁定 B2C/B2B 分眾標籤]:::crm
    end
    class LINE_Direct,LINE_Param module;
```