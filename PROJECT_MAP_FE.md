# Infotainmentify Frontend Proje Haritasi

Son guncelleme: 2026-06-21

Bu dosya frontend tarafinda calisirken hizli yon bulmak icin tutulur. Yeni sayfalar, API modulleri veya UI akislar eklendikce guncellenmelidir.

## Amac

Frontend, YouTube/video icerik uretim otomasyonu icin operator panelidir. Backend API uzerinden:

- Login/auth ve korumali admin arayuzu saglar.
- Konsept, prompt, topic, script, preset ve asset yonetimini yapar.
- Pipeline template olusturur ve pipeline run baslatir.
- Run gecmisini, stage durumlarini, canli loglari ve video onizlemeyi gosterir.
- AI baglantilari ve sosyal kanal ayarlarini yonetir.

## Proje Koku

Proje koku:

```text
infotainmentify-FE/
  package.json
  package-lock.json
  src/
  public/
  dist/
```

Not: Daha once ic `infotainmentify-fe/` klasoru vardi; mevcut calisma agacinda uygulama dosyalari direkt repo kokunde duruyor.

## Teknoloji

- React 18
- TypeScript
- Vite 6
- React Router DOM 6
- Tailwind CSS 3
- SignalR client (`@microsoft/signalr`)
- React Flow (`@xyflow/react`)
- `react-hot-toast`
- `lucide-react`
- `clsx` + `tailwind-merge`

## Ana Klasorler

```text
infotainmentify-FE/
  src/
    api/
    components/
    config/
    context/
    hooks/
    layout/
    lib/
    pages/
    styles/
    utils/
  public/
  package.json
```

## Uygulama Girisi

- `src/main.tsx`
  - `BrowserRouter`
  - `AuthProvider`
  - `NotificationProvider`
  - `App`
- `src/App.tsx`
  - `/login` guest-only route.
  - Protected alan.
  - `Layout` shell.
  - Dynamic route listesi `src/routes.tsx`.
- `src/routes.tsx`
  - Sayfalari lazy import eder.
  - `/dashboard`, `/prompts`, `/topics`, `/scripts`, `/pipeline-runs` gibi ana route'lari tanimlar.

## Layout ve Navigasyon

- `src/layout/Layout.tsx`: ana shell, sidebar, topbar, toaster, floating job widget.
- `src/layout/Sidebar.tsx`: sol navigasyon.
- `src/layout/Topbar.tsx`: ust bar ve kullanici aksiyonlari.
- `src/config/menu.ts`: sidebar menusu ve route label/icon eslesmeleri.

Menu ana gruplari:

- Genel Bakis
- Icerik Fabrikasi
- Video Studyosu
- Sistem & Ayarlar

## Sayfalar

`src/pages/` altindaki ana sayfalar:

- `LoginPage.tsx`
- `DashboardPage.tsx`
- `ConceptsPage.tsx`
- `PromptsPage.tsx`
- `TopicsPage.tsx`
- `ScriptListPage.tsx`
- `PipelineTemplatesPage.tsx`
- `PipelineRunsPage.tsx`
- `PipelineHistoryPage.tsx`
- `AssetsPage.tsx`
- `AiConnectionsPage.tsx`
- `SocialChannelsPage.tsx`
- Preset sayfalari:
  - `TopicPresetsPage.tsx`
  - `ScriptPresetsPage.tsx`
  - `ImagePresetsPage.tsx`
  - `TtsPresetsPage.tsx`
  - `SttPresetsPage.tsx`
  - `RenderPresetsPage.tsx`
  - `VideoPresetsPage.tsx`
- `_Placeholders/`: henuz tamamlanmamis sayfa taslaklari.
- `oauth/YouTubeCallback.tsx`: YouTube OAuth donus akisi.

## API Katmani

`src/api/http.ts` merkezi HTTP wrapper'dir.

Ozellikleri:

- `VITE_API_BASE_URL` uzerinden base URL kullanir.
- `VITE_API_BASE_URL` yoksa development modunda `https://localhost:7177` fallback kullanir.
- Relative path gelirse base URL ile birlestirir.
- `auth.token` localStorage degerini `Authorization: Bearer ...` olarak ekler.
- JSON ve FormData ayrimini yapar.
- Timeout varsayilani 20 saniyedir.
- 401 gelirse `auth:unauthorized` event'i firlatir.

API modulleri:

- `auth.ts`
- `users.ts`
- `aiConnections.ts`
- `socialChannels.ts`
- `concepts.ts`
- `prompts.ts`
- `topics.ts`
- `scripts.ts`
- `topicPresets.ts`
- `scriptPresets.ts`
- `imagePresets.ts`
- `ttsPresets.ts`
- `sttPresets.ts`
- `renderPresets.ts`
- `videoPresets.ts`
- `pipelineTemplates.ts`
- `pipelineRuns.ts`
- `assets.ts`
- `files.ts`
- `jobs.ts`
- `jobExecutions.ts`
- `dashboard.ts`

Not: `src/api/index.ts` tum modulleri export etmiyor; yeni sayfalarda dogrudan ilgili API modulunu import etmek daha guvenli olabilir veya index dosyasi bilincli sekilde guncellenmelidir.

## Auth Akisi

- `src/context/AuthProvider.tsx`
  - Token key: `auth.token`
  - User key: `auth.user`
  - JWT expiry kontrolu yapar.
  - Login sonrasi token/user localStorage'a yazilir.
  - Logout client state ve localStorage'i temizler.
  - Global 401 event'i logout tetikler.
- `src/components/Protected.tsx`: korumali alan guard'i.
- `src/components/GuestOnly.tsx`: login gibi guest-only sayfalar.
- `src/hooks/useAuth.ts`: auth context tuketimi.

## Notification ve SignalR

Client genel SignalR dosyasi:

- `src/lib/signalr.ts`
  - Hub URL: `${VITE_API_BASE_URL}/hubs/notify` fallback `https://localhost:7177`.
  - JWT access token ile baglanir.
  - `JobProgress` ve `JobCompleted` eventlerini dinler.

Notification context:

- `src/context/NotificationContext.tsx`
  - Toast/bildirim state'i.
  - Aktif job listesi.
  - `startJob`, `updateJobProgress`, `finishJob`.

Canli run loglari:

- `src/components/LiveLogViewer.tsx`
  - Once `/api/pipeline-runs/{id}/logs` ile eski loglari alir.
  - Sonra `/hubs/notify` hub'ina baglanir.
  - `JoinRunGroup(runId)` cagirir.
  - `ReceiveLog` eventlerini terminal UI'da gosterir.

## Pipeline UI Akisi

Pipeline template:

- `src/pages/PipelineTemplatesPage.tsx`
- `src/api/pipelineTemplates.ts`
- Stage tipleri FE tarafinda `STAGE_TYPES` listesiyle tutulur.
- Backend `StageType` enumlari ile birebir uyumlu kalmalidir.
- `GET /api/pipeline-templates/{id}/health` FE'de `pipelineTemplatesApi.health(id)` ile kullanilir.
- `PipelineTemplatesPage` artik kullaniciya "Uretim Hatlari" olarak gorunen production-line editor mantiginda calisir:
  - Sol rail `Hatlarim` navigator olarak calisir; template teknik dili kullaniciya gosterilmez.
  - Ustte hat kimligi (`Hat Bilgisi`) ve durum rozetleri vardir; status dili `Taslak/Hazir/Uyari/Blokaj` gibi okunur etiketlere cevrilir.
  - Orta ana alan `Hazir Baslangiclar` ve buyuk `Uretim Akisi` canvas'ina ayrilir.
  - Hazir baslangic kartlari (`Shorts Hatti`, `Uzun Video Hatti`, `Podcast / Audio Hatti`) ilk bakista gorunur; kullanici sifirdan adim dizmek zorunda kalmaz.
  - Sag panel `Kurulum Rehberi` ve `Adim Sirasi` olarak iki net amaca indirildi; stage/template/workflow dili yerine hat/adim dili tercih edilir.
  - Template formunda `ProductionProfile` secimi vardir: `Generic`, `Shorts`, `LongForm`, `Podcast`.
  - Alt aksiyon bar Save/Delete/Cancel islemlerini her zaman erisilebilir tutar.
  - `Odak` aksiyonu workflow canvas'i route content alaninda tam ekran benzeri bir overlay'e acar; app sidebar/topbar kapanmaz.
  - Odak modunda `WorkflowStudio` sadece buyuk canvas ve minimal ust bilgiyi gosterir; uretime hazirlik kartlari, metrikler ve alt durum satiri gizlenir. Bu sayede workflow alani kucuk kalmaz.
- `WorkflowStudio` paneli `@xyflow/react` ile canvas tabanli node-edge workflow gosterir.
  - FE'deki canvas su an backend'in lineer `StageConfigDto.order` modelinden uretilir.
  - Kullaniciya gorunen adim isimleri `Konu`, `Senaryo`, `Gorsel`, `Seslendirme`, `Altyazi Zamanlama`, `Kurgu / Timeline`, `Final Render`, `Kapak`, `Yayin / Yukleme` seklindedir.
  - Node layout'u tek hatta kuculmek yerine 3 kolonlu okunur akisa kirilir.
  - Node pozisyonlari React Flow `onNodesChange` ile parent UI state'e yazilir; normal ve odak canvas ayni pozisyon state'ini kullanir.
  - Node pozisyonlari drag sirasinda React Flow lokal state'inde akar; mouse birakilinca final layout parent state'e yazilir ve selected template icin 500ms debounce ile `PUT /api/pipeline-templates/{id}/workflow-layout` endpoint'ine kaydedilir.
  - Node pozisyon key'i `order:stageType` formatindadir; yeni kaydedilen template reload oldugunda DB stage id'leri degisse bile layout korunur.
  - Draft template pozisyonlari henuz BE kaydi olmadigi icin sadece form state'inde tutulur; template Save edildikten sonraki hareketler BE'ye autosave olur.
  - Node icindeki preset picker native select degil; koyu tema ve rounded node tasarimina uygun custom popover kullanir.
  - React Flow MiniMap kapali tutulur; sag altta gereksiz siyah kutu olusturmaz.
  - Canvas background sol tik suruklemesi node drag ile karismasin diye kapali tutulur; pan hareketi orta/sag mouse tuslariyla calisir.
  - Canvas fitView sadece ilk acilis/stage seti degisiminde calisir; node drag sirasinda viewport yeniden hesaplanmaz.
  - Node icindeki preset secimi form state'ini gunceller; kalici olmasi icin template Save edilmelidir.
  - Normal detay ekraninda orta govde `overflow-y-auto` calisir; hazir baslangiclar, workflow canvas ve sag adim paneli kucuk ekranlarda asagi kaydirilabilir.
  - `Odak` modunda workflow canvas sabit tam ekran benzeri alana yayilir; ozet kartlari gizlenir, detaylar modal/odak aksiyonlariyla acilir.
  - Node `Ayar` aksiyonu stage preset modalini veya Upload config modalini acar.
  - Preset/executor/dependency sagligini `PipelineTemplateHealthDto` uzerinden okur; UI tarafinda bu "Uretime Hazirlik" diliyle gosterilir.
  - Health/detail modalinda teknik `Stage report / All findings / Runnable` basliklari yerine `Adim raporu / Tum uyarilar / Baslatma` basliklari kullanilir.
  - `Uretime Hazirlik` paneli mevcut health verisinden okunur readiness ozeti uretir:
    - Profile, long-form stage omurgasi, preset/AI connection, script hedef suresi, gorsel/render formati, ses/caption, upload, kapak/thumbnail ve run kapisi kontrollerini kartlar halinde gosterir.
    - Kisa versiyon workflow canvas altinda, detayli versiyon Health modalinda gorunur.
- Hazir workflow blueprint kartlari template formuna stage taslagi uygular:
  - `Shorts Factory`: Topic -> Script -> Image -> Tts -> Stt -> SceneLayout -> Render -> Upload.
  - `Long Form Video`: Topic -> Script -> Image -> Tts -> Stt -> SceneLayout -> Render -> Thumbnail. Blueprint `ProductionProfile = LongForm` set eder; BE health 16:9 render, long script sureleri, bolumlu prompt kurallari ve kapak stage varligini kontrol eder.
  - `Podcast / Audio First`: audio odakli ayni timeline/render omurgasini ve Thumbnail stage'ini kullanir.
- Blueprint uygulamak yalnizca lokal form taslagini degistirir; kalici hale gelmesi icin kullanici Save aksiyonunu calistirmalidir.
- Workflow health finding'leri artik aksiyon alabilir:
  - Preset sorunlari stage preset secim modalini acar.
  - Upload sorunlari upload config modalini acar.
  - AI connection sorunlari `/ai-connections` sayfasina goturur.
  - Social channel sorunlari `/social-channels` sayfasina goturur.
- Stage satirlarinda preset badge'i tiklanabilir; mevcut stage'in preset'i silmeden/yeniden eklemeden degistirilebilir.
- `Thumbnail` stage'i workflow listesinde ayri node olarak gorunur ve Image preset seceneklerini kullanir.
- Stage listesinde eski `Video` UI degeri backend'e kaydedilirken `VideoAI` olarak map edilir; yeni workflow/node editor tasariminda direkt `VideoAI` degeri tercih edilmeli.

Script preset:

- `ScriptPresetsPage` hedef sure input'u 15-3600 sn araligindadir. Long Form presetlerinde 480-900 sn ilk test bandi olarak dusunulur.
- `ScriptPresetsPage`, `ImagePresetsPage` ve `RenderPresetsPage` icinde `Long Form Starter Uygula` aksiyonu vardir:
  - Script starter: 8-15 dk hedefli, JSON object output, chapter/section/intro/outro yapisi ve `audioText`/`visualPrompt`/`durationSec` sahne alanlarini doldurur.
  - Image starter: 16:9 cinematic/documentary prompt, landscape size, HD kalite ve text/watermark negative prompt ayarlar.
  - Render starter: 1920x1080, 30 FPS, 9000 kbps, daha sakin long-form caption/audio/visual effect ayarlari uygular.
  - Render starter `Auto B-roll Cut` ayarini acar: uzun sahneler otomatik visual beat'lere bolunur. Bu v1 gercek ekstra AI B-roll gorseli uretmez; ayni sahne gorselini farkli zoom/pan hareketleriyle kullanarak long-form monotonlugunu azaltir.
- `RenderPresetsPage` Efekt sekmesinde `Auto B-roll Cut`, `Min Sahne`, `Beat Suresi`, `Max Cut` alanlari bulunur. Bu alanlar backend `RenderVisualEffectsSettings` ile birebir gider.
- Preset ekranlarinda kritik form alanlari `HelpLabel` tooltipleriyle aciklanir. Tooltipler alanin workflow'a etkisini ve long-form icin pratik baslangic degerlerini hatirlatir:
  - `TopicPresetsPage`: konu stratejisi, model, temp, dil, system/user prompt ve keyword JSON alanlari.
  - `ScriptPresetsPage`: model, ton, dil, hedef sure, hook/CTA, system/user prompt alanlari.
  - `ImagePresetsPage`: model, kalite, sanat tarzi, aspect ratio, prompt ve negative prompt alanlari.
  - `TtsPresetsPage`: voice, dil, model, speaking rate, pitch ve ElevenLabs parametreleri.
  - `SttPresetsPage`: model, dil, word timestamps, diarization, prompt, temp ve profanity filter.
  - `RenderPresetsPage`: format/FPS/bitrate, caption, audio mix, visual effect ve watermark alanlari.

Pipeline run:

- `src/pages/PipelineRunsPage.tsx`
- `src/api/pipelineRuns.ts`
- Yeni run olusturma, detay cekme, start, approve, retry stage, re-render, scene image regenerate ve log cekme aksiyonlarini kapsar.
- Run detayinda:
  - Stage timeline.
  - Canli konsol (`LiveLogViewer`).
  - Video onizleme (`VideoPlayer`): backend render metadata'sindan gelen width/height/aspect ratio ile 9:16 ve 16:9 gibi formatlari ayni componentte gosterir.
  - Manual approval (`WaitingForApproval`) aksiyonu.

## UI Bilesenleri

Ortak bilesenler `src/components/` altindadir.

Onemli dosyalar:

- `ui-kit.tsx`: Page, Card, Button, Modal, Table, form ve confirm gibi ortak UI parcalari.
- `NotificationComponents.tsx`: floating job widget ve notification UI.
- `LiveLogViewer.tsx`: SignalR log terminali.
- `TimelineViewer.tsx`: scene layout/timeline gosterimi.
- `VideoPlayer.tsx`: aspect-aware video onizleme; `videoWidth`, `videoHeight`, `aspectRatio` proplariyla Shorts ve long-form preview'i ayirir.
- `WorkflowStudio.tsx`: React Flow canvas, custom stage node, preset select, health ozeti ve health detay modalini besleyen componentler.
- `FieldHelp.tsx`: label yaninda `?` tooltip gostermek icin `FieldHelp` ve `HelpLabel`. Preset ekranlarinda ve Upload config modalinda kritik alanlarda kullanilir.
- `UploadConfigModal.tsx`, `UploadStatusCell.tsx`: upload akisi UI parcalari.
- `SelectBox.tsx`, `Switch.tsx`, `Tooltip.tsx`, `KeyValueEditor.tsx`: form yardimcilari.

## Stil

- Global stiller: `src/index.css`, `src/App.css`, `src/styles/ui.css`.
- Tailwind config: `tailwind.config.js`.
- Tema genel olarak koyu, zinc/indigo agirlikli operasyon paneli.
- Layout `h-screen` ve internal scroll modeliyle calisir; yeni sayfalarda overflow ve min-height davranisina dikkat edilmeli.

## Vite ve Lokal Calistirma

`vite.config.ts`:

- Port: `5173`
- `/api` proxy target: `https://localhost:7177`
- `/hubs` proxy target: `https://localhost:7177`
- `/UserFiles` proxy target: `https://localhost:7177`; render videolari development'ta bu static path uzerinden BE'den servis edilir.
- Proxy `secure: false` ile lokal HTTPS sertifikasina takilmadan BE'ye gider.
- `vite.config.ts` degisirse calisan FE dev server restart edilmelidir.

Komutlar:

```powershell
cd D:\Coding\Coding_Projects\Infotainmentify\infotainmentify-FE
npm install
npm run dev
npm run build
```

Env notu:

```text
VITE_API_BASE_URL=https://localhost:7177
```

Dev proxy kullaniliyorsa relative `/api/...` ve `/UserFiles/...` cagrilari da calisir. `VideoPlayer` local render URL'lerini relative kullanir; `VITE_API_BASE_URL` set edilirse video URL'i de o base URL'e baglanir.

## Yeni Ozellik Eklerken Rota

- Backend endpoint hazirsa once `src/api/{domain}.ts` icinde tipleri ve client fonksiyonlarini ekle.
- Sayfa gerekiyorsa `src/pages/{Domain}Page.tsx` olustur.
- Route gerekiyorsa `src/routes.tsx` icine lazy route ekle.
- Menu gerekiyorsa `src/config/menu.ts` icine item ekle.
- Ortak UI tekrar ediyorsa `src/components/ui-kit.tsx` veya ilgili shared component kullan.
- Auth gerekli endpointlerde `http.ts` zaten token ekler.
- Uzun calisan islerde polling, SignalR veya ikisi birlikte dusunulmeli.
- Backend enum/stringleri ile FE type union ve dropdown listeleri ayni kalmali.

## Dikkat Notlari

- Uygulama su anda repo kokunde. Dev/build scriptleri ve Vite config'i tekrar kontrol edilmeli.
- `node_modules/` repo icinde mevcut gorunuyor; dosya aramalarinda `-g '!node_modules'` kullan.
- Mevcut kod yorumlarinda bazi encoding bozulmalari var. Yeni dosyalarda tutarli UTF-8 veya gerekirse ASCII yazim kullan.
- `PipelineRunsPage.tsx` buyuk ve cok sorumluluk tasiyor; yeni pipeline UI gelistirmelerinde parcalara ayirma dusunulebilir.
- `src/api/index.ts` merkezi export icin eksik kalmis olabilir.
- SignalR icin iki ayri kullanim var: genel job eventleri `lib/signalr.ts`, run log terminali `LiveLogViewer.tsx`.
