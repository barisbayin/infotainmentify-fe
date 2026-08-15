# Infotainmentify Frontend Proje Haritasi

Son guncelleme: 2026-07-22

Bu dosya frontend tarafinda calisirken hizli yon bulmak icin tutulur. Yeni sayfalar, API modulleri veya UI akislar eklendikce guncellenmelidir.

Long-form konsept + brief + wizard donusum plani: `../LONG_FORM_SYSTEM_CONVERSION_PLAN.md`

Master architecture alignment: `../AI_VIDEO_AUTOMATION_ARCHITECTURE_ALIGNMENT.md`

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
  - `/dashboard`, `/concept-studio`, `/production-wizard`, `/production-kits`, `/prompt-studio`, `/prompts`, `/topics`, `/scripts`, `/pipeline-runs` gibi ana route'lari tanimlar.

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
- `ConceptStudioPage.tsx`
- `ProductionBriefsPage.tsx`
- `ProductionKitsPage.tsx`
- `PromptStudioPage.tsx`
- `PromptsPage.tsx`
- `TopicsPage.tsx`
- `ScriptListPage.tsx`
- `ProductionWizardPage.tsx`
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
- `oauth/YouTubeCallback.tsx`: YouTube OAuth donus akisi. Google'dan gelen `code/state` backend complete endpoint'ine gonderilir; client secret tarayiciya verilmez. Route `/oauth/youtube/callback` olarak kayitlidir.
- `SocialChannelsPage` secili YouTube kanali icin upload scope health durumunu gosterir. `YouTube'a Yetki Ver / YouTube Yetkisini Yenile` aksiyonu backend PKCE akisini baslatir; donuste kanal otomatik secilir ve yeni scope gorunur.

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
  - Concept CRUD'a ek olarak `GET/PUT /api/concepts/{id}/profile` concept profile tiplerini ve istemci fonksiyonlarini tasir.
- `prompts.ts`
- `promptContracts.ts`
  - `/api/prompt-contracts` contract registry, trace list, override CRUD, diff ve test endpointlerini kullanir.
- `productionKits.ts`
  - `/api/production-kits` concept + workflow template + preset bundle CRUD tiplerini ve client fonksiyonlarini tasir.
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
- `productionWizard.ts`
- `pipelineRuns.ts`
- `productionBriefs.ts`
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
- Stage tipleri FE tarafinda `STAGE_TYPES` listesiyle tutulur. CreativeDirector stage'i Topic ile Script arasinda kullanilan preset'siz video stratejisi adimidir; Storyboard stage'i Script ile Image arasinda kullanilan preset'siz yonetmen plani adimidir; EditPlan stage'i STT ile SceneLayout arasinda kullanilan preset'siz kurgu karar adimidir.
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
  - Kullaniciya gorunen adim isimleri `Konu`, `Creative Director`, `Senaryo`, `Storyboard`, `Gorsel`, `Seslendirme`, `Altyazi Zamanlama`, `Edit Plan`, `Kurgu / Timeline`, `Final Render`, `Kapak`, `Yayin / Yukleme` seklindedir.
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
    - Profile, long-form stage omurgasi, preset/AI connection, script hedef suresi, storyboard varligi, edit plan varligi, gorsel/render formati, ses/caption, upload, kapak/thumbnail ve run kapisi kontrollerini kartlar halinde gosterir.
    - Kisa versiyon workflow canvas altinda, detayli versiyon Health modalinda gorunur.
  - Preset secenekleri stage tipine gore kaynak bazli cache'lenir; `Image/Thumbnail` ve `SceneLayout/Render` gibi ayni preset kaynagini kullanan stage'ler tekrar tekrar API cagirmamalidir.
  - Template detay acilirken health cagrisi formun acilmasini bloklamaz; health sonucu geldikce panel guncellenir.
- Hazir workflow blueprint kartlari template formuna stage taslagi uygular:
  - `Shorts Factory`: Topic -> Script -> Image -> Tts -> Stt -> SceneLayout -> Render -> Upload.
  - `Long Form Video`: Topic -> CreativeDirector -> Script -> Storyboard -> Image -> Tts -> Stt -> EditPlan -> SceneLayout -> Thumbnail -> Render. Blueprint `ProductionProfile = LongForm` set eder; BE health 16:9 render, long script sureleri, bolumlu prompt kurallari, creative director/storyboard/edit plan ve kapak stage varligini kontrol eder.
  - `Podcast / Audio First`: Topic -> CreativeDirector -> Script -> Image -> Tts -> Stt -> EditPlan -> SceneLayout -> Thumbnail -> Render omurgasini kullanir.
- Blueprint uygulamak yalnizca lokal form taslagini degistirir; kalici hale gelmesi icin kullanici Save aksiyonunu calistirmalidir.
- Workflow health finding'leri artik aksiyon alabilir:
  - Preset sorunlari stage preset secim modalini acar.
  - Upload sorunlari upload config modalini acar.
  - AI connection sorunlari `/ai-connections` sayfasina goturur.
  - Social channel sorunlari `/social-channels` sayfasina goturur.
- Stage satirlarinda preset badge'i tiklanabilir; mevcut stage'in preset'i silmeden/yeniden eklemeden degistirilebilir.
- `CreativeDirector`, `Storyboard` ve `EditPlan` stage'leri preset kullanmaz; stage satirinda `preset yok` olarak gorunur ve node ayari tiklaninca bilgi toast'i verir.
- `Thumbnail` stage'i workflow listesinde ayri node olarak gorunur ve Image preset seceneklerini kullanir.
- Stage listesinde eski `Video` UI degeri backend'e kaydedilirken `VideoAI` olarak map edilir; yeni workflow/node editor tasariminda direkt `VideoAI` degeri tercih edilmeli.

Script preset:

- `ScriptPresetsPage` hedef sure input'u 15-3600 sn araligindadir. Long Form presetlerinde 480-900 sn ilk test bandi olarak dusunulur.
- `TopicPresetsPage`, `ScriptPresetsPage`, `ImagePresetsPage` ve `RenderPresetsPage` icinde `Long Form Starter Uygula` aksiyonu vardir:
  - Topic starter: brief'i tek bir production-ready topic document'a cevirir; fikir listesi uretmez.
  - Script starter: 8-15 dk hedefli, backend JSON kontratina karismayan yaratici prompt kullanir; Scene Direction V2 ve Visual Variety V1 alanlarini besleyecek sahne niyeti ister.
  - Image starter: 16:9 cinematic/documentary prompt, landscape size, HD kalite ve text/watermark negative prompt ayarlar.
  - Render starter: 1920x1080, 30 FPS, 9000 kbps, daha sakin long-form caption/audio/visual effect ayarlari uygular.
  - Render starter `Auto B-roll Cut` ayarini acar: uzun sahneler otomatik visual beat'lere bolunur. Bu v1 gercek ekstra AI B-roll gorseli uretmez; ayni sahne gorselini farkli zoom/pan hareketleriyle kullanarak long-form monotonlugunu azaltir.
- `PromptContractGuard`, Topic/Script preset ekranlarinda system prompt + prompt template'i analiz eder; eski JSON shape'e kilitlenme, topic idea-list dili, sahne sayisi asiriligi, gorsel beat ile script sahnesinin karismasi ve stil celiskilerini gosterir.
- `PromptPreviewPanel`, Topic/Script/Image preset ekranlarinda concept token'lari ve ornek brief ile final prompt'un nasil gorunecegini gosterir; advanced prompt alanlari `AdvancedSection` altinda katlanir.
- `RenderPresetsPage` Efekt sekmesinde `Auto B-roll Cut`, `Min Sahne`, `Beat Suresi`, `Max Cut`, `Render Overlay Text`, `Outro Nefes Payi` ve `AI + STT Editorial Timing` alanlari bulunur. Editorial timing acikken hook/body/emphasis minimum hold, maksimum hold, anchor snap penceresi/confidence ve fast-cut cluster limiti advanced ayarlardan yonetilir. Bu alanlar backend `RenderVisualEffectsSettings` ile birebir gider. Overlay text kapaliysa render yaziyi videoya basmaz; image icindeki yazilar ise concept/image text policy tarafindan explicit izinle yonetilir.
- Preset ekranlarinda kritik form alanlari `HelpLabel` tooltipleriyle aciklanir. Tooltipler alanin workflow'a etkisini ve long-form icin pratik baslangic degerlerini hatirlatir:
  - `TopicPresetsPage`: konu stratejisi, model, temp, dil, system/user prompt ve keyword JSON alanlari.
  - `ScriptPresetsPage`: model, ton, dil, hedef sure, hook/CTA, system/user prompt alanlari.
  - `ImagePresetsPage`: model, kalite, sanat tarzi, aspect ratio, prompt ve negative prompt alanlari.
  - `TtsPresetsPage`: voice, dil, model, speaking rate, pitch ve ElevenLabs parametreleri.
  - `SttPresetsPage`: model, dil, word timestamps, diarization, prompt, temp ve profanity filter.
  - `RenderPresetsPage`: format/FPS/bitrate, caption, audio mix, visual effect ve watermark alanlari.
  - `RenderPresetsPage` Ses sekmesinde `Editor Audio Cuts` kontrolu vardir. Bu kontrol backend `EnableEditorAudioCuts`, `MaxEditorAudioOffsetSec` ve `VoiceMicroFadeSec` alanlarini besler; EditPlan aktifken J-cut/L-cut V1 ses ofsetleri preset bazinda acilip kapatilabilir.

Concept Studio:

- `src/pages/ConceptStudioPage.tsx`
- `src/api/concepts.ts`
- Konseptin kalici uretim profilini yonetir: production profile, default platform/dil/sure, default workflow, hedef kitle, ton, kanal vaadi, gorsel stil bible, karakter bible, metin politikasi, icerik kurallari ve review policy JSON.
- Whiteboardly starter profile butonu, stick figure doodle konsepti icin guclu varsayilanlari tek tikla forma basar.
- Profile health karti kitle, ton, kanal vaadi, gorsel stil, metin politikasi ve workflow baglantisi eksiklerini gosterir.
- Bu ekran uzun vadede preset iclerine tekrar tekrar prompt yazma ihtiyacini azaltacak merkezi konsept DNA ekranidir.
- Backend `ProductionPromptContext`, bu ekrandaki profile snapshot'ini Topic, CreativeDirector, Script, Storyboard, Image, Thumbnail ve manuel image regenerate promptlarina tasir; FE'de yazilan style bible/text policy artik uretim davranisini etkiler.
- Backend `ProductionTarget`, wizard/brief hedef suresini saniye, kelime ve sahne kontratina cevirir; FE'de kullanici normal akista konsept + brief verir, sure/sahne/kelime dagilimi stage ekranlarina manuel yazilmak zorunda kalmaz.

Production brief library:

- `src/pages/ProductionBriefsPage.tsx`
- `src/api/productionBriefs.ts`
- Uretimden once akla gelen long-form brief'lerini kaydetmek icin kullanilir. Brief adi zorunludur, konsept opsiyoneldir.
- Kayit alanlari backend `SavedProductionBrief` ile uyumludur: ana baslik, aci/tez, hedef izleyici, hedef sure, mutlaka islenecekler, kacinilacaklar, hook yonlendirmesi, thumbnail yonlendirmesi ve not/kaynak.
- Limitler `PRODUCTION_BRIEF_FIELD_LIMITS` altinda merkezidir: `Angle` 12.000, `Audience` 4.000, `MustCover` 20.000, `Avoid` 12.000, hook/thumbnail yonlendirmeleri 8.000 ve `Notes` 20.000 karakter destekler. Production Brief Library, Production Wizard ve eski run olusturma modalinda ayni HTML `maxLength`, cok satirli editor ve canli karakter sayaci kullanilir.
- Bu sayfada kaydedilen brief'ler yeni run modalinda secilebilir.

Production wizard:

- `src/pages/ProductionWizardPage.tsx`
- `src/api/productionWizard.ts`
- Long-form uretimi baslatmak icin ana akis ekranidir: konsept, kayitli/manual brief, workflow, auto-start ve render oncesi duraklama ayarlari tek yerde secilir.
- `GET /api/production-wizard/bootstrap` ile concept profile, concept workflow'lari, saved brief'ler ve template health tek payload olarak gelir.
- Form degistikce `POST /api/production-wizard/preflight` calisir; hata-warning-info kartlari sag panelde gosterilir.
- `POST /api/production-wizard/start` run olusturur; basarili olunca `/pipeline-runs` ekranina doner.
- `PipelineRunsPage` header'inda wizard'a giden ek bir buton vardir; eski yeni run modal akisi geriye donuk uyumluluk icin korunur.
- Wizard'dan baslayan run, concept profile snapshot'i ile baslar; kullanici Concept Studio'da bir kere profil tanimlayip Production Wizard'da sadece brief vererek long-form uretimi baslatabilir.
- Sag panelde `Concept Etkisi` karti bulunur; dil, sure, ton, hedef kitle, kanal vaadi, gorsel stil, style bible ve text policy'nin run prompt zincirini nasil etkileyecegini gosterir. Brief'ten gelen sure/kitle override'lari kartta not olarak gorunur.

Pipeline run:

- `src/pages/PipelineRunsPage.tsx`
- `src/components/ProductionReviewCenter.tsx`, `GET /api/pipeline-runs/{id}/review` endpoint'ini kullanarak run'i yayin oncesi production cockpit gibi gosterir. Plan, Script, Images, Timeline, Package, Render ve Debug tab'lari vardir. Script kelime/sahne ozeti, gorsel yogunlugu, image QA listesi, timeline long-hold/STT timing metrikleri, readiness item'lari, stage validation issue'lari, render/audio QA, YouTube package approval ve prompt/contract trace tek yerde okunur. Thumbnail/YouTube package validator issue'lari kapak asset, 16:9/1280x720, title, description, chapters, tags ve checklist risklerini bu ekrana tasir. Review issue `actionType/actionLabel` alanlariyla stage retry, approval, timeline acma, video/audio kontrol, package approval ve scene/beat/path ile direkt image regenerate butonlarini basar. Plan tab'i Creative Director/Script/Scene Direction kararlarini `/review-decisions` ile saklar; Package tab'i title/description/chapter/tag editor, thumbnail candidate compare ve ready-to-upload gate tasir. `Etiketleri AI ile Uret` aksiyonu kapagi/paketin geri kalanini yeniden uretmeden final script + brief uzerinden tag ve hashtagleri yeniler; kullanilan model ve AI search intent sonucu ayni panelde gorunur.
- `src/components/TimelineViewer.tsx` render oncesi timeline/review panelidir. Her gorsel kartinda uc ayri revision aksiyonu vardir: ayni promptla tekrar uret (`resample`), anlatiyi koruyup farkli kadraj uret (`reframe`), text AI ile gorsel fikri yeniden planla (`replan`). Regenerate sonrasi image path, source scene/beat, prompt trace ve semantic shot metadata'si FE state'inde guncellenir.
- `src/components/ShortsStudio.tsx`: uzun video run'indan AI Shorts adaylari cikaran ve secilen adaylari ayri 9:16 child run olarak olusturan operator panelidir. Hook/angle/payoff, kaynak sahne, retention/bagimsizlik/spoiler skorlari; render oncesi durma, otomatik baslatma ve otomatik yayin secenekleri; child run render/upload durumu ile YouTube sonucu ayni panelde gorunur. Child Short ekraninda kaynak uzun videoya geri baglanti ve YouTube Studio “Ilgili video” kontrolu gosterilir.
- `TimelineViewer` prompt trace V1 alanlarini okur: `promptPartKey`, `promptHash`, `inputHash`, `generationContract`. Ust ozet panelinde prompt trace coverage, kartlarda prompt hash ve trace satiri gosterilir. Semantic Beat Planner V2 icin `timingSource`, `beatStartSec`, `beatEndSec` ve `plannedDurationSec`; Editorial Timing V1 icin `timingAdjustmentReason`, `anchorRejectedReason`, `cadenceStatus` ve gercek hold suresi rozetlerini gosterir.
- Timeline preflight ozetinde sync ve ritim ayri metriklerdir. Short/critical/long hold, rejected anchor, cadence adjustment ve cut cluster sayilari hafif scene endpoint'inden gelir; tam prompt metni kart acildiginda ayri endpoint'ten lazy yuklenir.
- `src/components/StageValidationReport.tsx`, stage `OutputJson` icindeki `Metadata.ValidationReport` / `metadata.validationReport` alanini okur. Pipeline run timeline kartlarinda contract health durumunu Ready/Review/Blocked, issue sayilari ve ilk aksiyon ipuclariyla gosterir.
- `src/api/pipelineRuns.ts`
  - Shorts contract ve endpointleri: `planShorts`, `createShorts`, `listShorts`; run DTO'larinda `sourceRunId`, `derivativeType`, `derivativeGroupId`, `derivativeLabel`.
- Yeni run olusturma, detay cekme, start, approve, retry stage, re-render, scene image regenerate, package approve ve log cekme aksiyonlarini kapsar.
- Yeni uretim modalinda opsiyonel `Kayitli Brief Sec` alani vardir. Secilen brief form alanlarini doldurur; kullanici isterse uretime ozel duzenleyebilir. Request `savedBriefId` ve doluysa `brief` snapshot'i ile gider.
- Yeni uretim modalinda opsiyonel `Uretim Brief'i` alanlari vardir: ana baslik, aci/tez, hedef izleyici, hedef sure, mutlaka islenecekler, kacinilacaklar, hook yonlendirmesi, thumbnail yonlendirmesi ve not/kaynak. Bu alanlar backend `CreatePipelineRunRequest.brief` ile gider ve long-form Topic/CreativeDirector/Script/Thumbnail promptlarini run seviyesinde sabitler.
- Run detay zaman cizelgesinde `CreativeDirector` stage'i tamamlandiginda girdi/cikti ozeti gosterilir: girdi `Topic + Brief`, cikti video vaadi, ana soru, hook, retention, gorsel strateji ve bolum akisidir.
- Run detay zaman cizelgesinde `Script` stage'i tamamlandiginda Scene Direction V2 ozeti gosterilir: sahne rolu, sahne amaci, izleyici sorusu, duygu ritmi, gorsel tipi, kamera plani, overlay, SFX ve gecis niyeti okunur.
- Script stage ozeti Visual Variety V1 alanlarini da gosterir: `visualVarietyRole` ve `visualVarietyReason`.
- Run detayinda:
  - Review tab'i (`ProductionReviewCenter`): run acildiginda varsayilan ilk ekrandir; uzun video icin Plan/Script/Images/Timeline/Package/Render/Debug sekmeleriyle kalite kontrolu yapilir. Issue kartlarindaki aksiyonlar uygun callback'e baglanir; calistirilamayacak aksiyon butonu gosterilmez. Direkt regenerate veya package approval sonrasi review verisi ve parent run detail sessizce yenilenir.
  - Package validation/approval: Thumbnail stage validation raporu yoksa backend review endpoint'i paketi anlik denetler; eksik/zayif yayin paketi alanlari Package tab'inda gorunur. Validation error yoksa package approval kalici olarak kaydedilir.
  - Stage timeline.
  - Canli konsol (`LiveLogViewer`).
  - Video onizleme (`VideoPlayer`): backend render metadata'sindan gelen width/height/aspect ratio ile 9:16 ve 16:9 gibi formatlari ayni componentte gosterir.
  - Kapak onizleme: backend `thumbnailUrl` alanini dondururse Video sekmesinde 16:9 kapak gorseli ayri kart olarak gorunur.
  - Manual approval (`WaitingForApproval`) aksiyonu.
  - Yeni uretim modalinda `pauseBeforeRender` anahtari vardir; acikken backend gorsel/timeline uretiminden sonra render oncesi onay bekler. Run detayinda Render stage'i `Kontrol bekliyor` olarak gorunur ve `Render'a Basla` aksiyonu `approve` endpoint'ini cagirir.
  - `Durdur` aksiyonu `POST /api/pipeline-runs/{id}/cancel` endpoint'ini cagirir; run ve aktif stage `Cancelled` olarak guncellenir, uretilmis ara dosyalar korunur.

`PipelineTemplatesPage` long-form ve podcast blueprint'lerinde `Thumbnail` stage'i `Render` oncesinde gelir; boylece render oncesi onay kapisinda kapak gorseli de kontrol edilebilir.

## UI Bilesenleri

Ortak bilesenler `src/components/` altindadir.

Onemli dosyalar:

- `ui-kit.tsx`: Page, Card, Button, Modal, Table, form ve confirm gibi ortak UI parcalari.
- `NotificationComponents.tsx`: floating job widget ve notification UI.
- `LiveLogViewer.tsx`: SignalR log terminali.
- `ProductionReviewCenter.tsx`: run review DTO'sunu tab'li kalite kontrol cockpit'ine ceviren ana panel. Plan/Script/Images/Timeline/Package/Render/Debug bolumleri, readiness listesi, manual review decisions, package editor/approval, thumbnail compare, image QA/regenerate ve prompt trace debug'u burada yasar. `PipelineRunsPage` refactor'unun ilk ayrilmis parcasidir.
- `pipeline-runs/RunStatusBadge.tsx`: run status rozetlerini merkezi tutar.
- `pipeline-runs/RunHistoryList.tsx`: run gecmis tablosunu `PipelineRunsPage` disina tasir.
- `pipeline-runs/RunRenderProgressPanel.tsx`: SignalR render progress yuzde barini ve connection state bilgisini izole eder.
- `StageValidationReport.tsx`: stage output contract validation ozet karti.
- `TimelineViewer.tsx`: scene layout/timeline gosterimi.
  - `VisualEvent` metadata'si olarak effect, role, visual type, variety role/reason, segment role, cut reason, audio transition, audio offset, shot type, chapter title, director intent, visual intent, text mode/allowed text, planned duration, beat local start/end, timing source, music energy, continuity anchor, composition ve visual QA score alanlarini okuyabilir.
  - Prompt trace V1 icin kart bazinda prompt hash/key/contract bilgisini gosterir; bu bilgi BE `SceneImageItem -> VisualEvent -> EditDecisionItem` hattindan gelir.
  - `SceneLayoutStagePayload.editDecisionList` varsa ustte Editor Decision List paneli acar; zaman araligi, sahne, mini segment rolu, audio transition/ofset, transition/effect ve cut reason bilgilerini gosterir.
  - Ust ozet panelinde visual shot / scene orani gorunur; uzun videonun slayt gibi kalip kalmadigi ilk bakista anlasilir.
  - Render oncesi kontrol akisi icin her gorsel beat kartinda director/chapter/segment/audio/variety rozetleri, QA skoru ve kisa kurgu niyeti gosterir.
  - Semantic Beat Planner ve Visual Shot Diversity Planner ciktisindan gelen `spokenAnchor`, `visualThesis`, `visualArchetype`, `forbiddenReuse`, `narrationFocus`, `visualPurpose` ve `cutReason` kartlarda gorunur; kullanici her gorselin hangi cumleyi, hangi fikirle anlattigini ve kardes shot'lardan neyi tekrar etmemesi gerektigini okuyabilir.
  - Review Center Images kartlari da ayni `Tekrar`, `Kadraj`, `Fikir` aksiyonlarini ve semantic shot kontratini gosterir.
  - Editorial Timing Solver ciktisindan gelen adjustment/rejection aciklamasi ve cadence badge kartta gorunur; kullanici AI anchor kararinin neden kaydirildigini veya reddedildigini anlayabilir.
- `VideoPlayer.tsx`: aspect-aware video onizleme; `videoWidth`, `videoHeight`, `aspectRatio` proplariyla Shorts ve long-form preview'i ayirir.
- `WorkflowStudio.tsx`: React Flow canvas, custom stage node, preset select, health ozeti ve health detay modalini besleyen componentler.
- `FieldHelp.tsx`: label yaninda `?` tooltip gostermek icin `FieldHelp` ve `HelpLabel`. Preset ekranlarinda ve Upload config modalinda kritik alanlarda kullanilir.
- `PromptContractGuard.tsx`: Topic/Script preset prompt'larinda kontrat ve yaratici niyet karismasini yakalayan yerel analiz karti.
- `PromptPreviewPanel.tsx`: Prompt preview karti ve `AdvancedSection` katlanir bolumu. Preset ekranlarini concept-aware ama daha az yorucu hale getirmek icin kullanilir.
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
- `PipelineRunsPage.tsx` hala buyuk ama refactor V1 basladi: Review Center, run status badge, history list ve render progress panel ayrildi. Kalan stage timeline/video/action modal kisimlari yeni pipeline UI gelistirmelerinde componentlestirilmeli.
- `src/api/index.ts` merkezi export icin eksik kalmis olabilir.
- SignalR icin iki ayri kullanim var: genel job eventleri `lib/signalr.ts`, run log terminali `LiveLogViewer.tsx`.
