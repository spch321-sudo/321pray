# 321禱告服事 v1.0.202610071722

## v1.3（2026-10-20）新增「美圖工作室」（與創世記至彼得後書同一套）
- **哪裡進去**：原有的「做成美圖」入口，現在開的就是完整的美圖工作室。「我的作品」在美圖工作室裡的「我的作品」按鈕。
- **做什麼**：9 種版型、5 種尺寸、6 種外框；相片可用內建圖庫、免費圖庫或自己的相簿；**AI 生成美圖**（寫好提示詞，可在 App 內直接生成，或複製到 Gemini／ChatGPT／豆包／Pollinations）；**AI 生成配樂**（Suno／MusicFX／Stable Audio 提示詞）；卡片字體（明體／黑體／楷體／圓體）與文字顏色；詩歌配樂、錄音、卡片影片、自拍影片。
- **自拍相機打不開**時會說清楚原因並給兩條退路；離開去第三方工具再回來，自動接回原位。
- 這一版是獨立模組（自己的作品與設定存在本機，不動本 App 原有資料）。沒有 AI 影片（已決定不做）。
- 上傳：index.html（有的有 sc.html／en.html）、sw.js、README.md 一起覆蓋。

321學神院・服事技能課程。建議 GitHub Pages 路徑：spch321-sudo.github.io/321prayer/

## 上傳
把這個資料夾裡的「全部檔案」整批上傳到 repo 根目錄（扁平，不要放子資料夾），覆蓋舊檔。
每次更新一定要包含 index.html、sw.js、version.json；c-zh.json、c-zs.json、c-en.json、lang-zh.json、lang-zs.json、lang-en.json、media.js 也要一起上傳。
上傳後約 1～10 分鐘生效，已安裝的 App 打開或切回時會自動換成新版。

## 圖示與主視覺
主耀提供的「321＋禱告的手＋聖經＋鴿子＋十字架」方圖，同時用作首頁主視覺（hero.jpg）與 App 圖示（icon-*.png、apple-touch-icon.png）。

## 詩歌庫
music.json 目前是空清單，可以沿用《321互動聖經》的 music.json 與 music/ 資料夾。
