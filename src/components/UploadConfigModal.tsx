import { useState, useEffect } from "react";
import { Modal, Button, Input, Select } from "./ui-kit";
import { HelpLabel } from "./FieldHelp";
import { socialChannelsApi, type SocialChannelListDto } from "../api/socialChannels"; 
import { Trash2, Plus } from "lucide-react";

interface UploadConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (configJson: string) => void | Promise<void>;
  initialConfig?: string;
}

type UploadTarget = {
  socialChannelId: number;
  titleTemplate: string;
  descriptionTemplate: string;
  privacyStatus: string;
  platformTags: string[];
  categoryId?: string;
  defaultLanguage?: string;
  containsSyntheticMedia?: boolean;
  selfDeclaredMadeForKids?: boolean;
  notifySubscribers?: boolean;
};

const normalizeTarget = (raw: any): UploadTarget => ({
  socialChannelId: Number(raw.socialChannelId ?? raw.SocialChannelId ?? 0),
  titleTemplate: raw.titleTemplate ?? raw.TitleTemplate ?? "{Title}",
  descriptionTemplate: raw.descriptionTemplate ?? raw.DescriptionTemplate ?? "{Description}",
  privacyStatus: raw.privacyStatus ?? raw.PrivacyStatus ?? "private",
  platformTags: raw.platformTags ?? raw.PlatformTags ?? [],
  categoryId: raw.categoryId ?? raw.CategoryId ?? "22",
  defaultLanguage: raw.defaultLanguage ?? raw.DefaultLanguage ?? "en",
  containsSyntheticMedia: Boolean(raw.containsSyntheticMedia ?? raw.ContainsSyntheticMedia ?? false),
  selfDeclaredMadeForKids: Boolean(raw.selfDeclaredMadeForKids ?? raw.SelfDeclaredMadeForKids ?? false),
  notifySubscribers: Boolean(raw.notifySubscribers ?? raw.NotifySubscribers ?? false),
});

const createTargetFromChannel = (channel: SocialChannelListDto): UploadTarget => ({
  socialChannelId: channel.id,
  titleTemplate: "{Title}",
  descriptionTemplate: "{Description}",
  privacyStatus: "private",
  platformTags: [],
  categoryId: "22",
  defaultLanguage: "en",
  containsSyntheticMedia: false,
  selfDeclaredMadeForKids: false,
  notifySubscribers: false,
});

export default function UploadConfigModal({ isOpen, onClose, onSave, initialConfig }: UploadConfigModalProps) {
  const [channels, setChannels] = useState<SocialChannelListDto[]>([]);
  const [targets, setTargets] = useState<UploadTarget[]>([]);
  
  // Yeni Ekleme State'i
  const [selectedChannelId, setSelectedChannelId] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      // Kanalları çek
      socialChannelsApi.list().then(setChannels);
      
      // Varsa eski ayarları yükle
      if (initialConfig) {
        try {
          const parsed = JSON.parse(initialConfig);
          const parsedTargets = parsed.Targets ?? parsed.targets;
          setTargets(Array.isArray(parsedTargets) ? parsedTargets.map(normalizeTarget) : []);
        } catch (e) { console.error("JSON Parse Error", e); }
      } else {
        setTargets([]);
      }
    }
  }, [isOpen, initialConfig]);

  const addTarget = () => {
    if (!selectedChannelId) return;
    const channel = channels.find(c => c.id.toString() === selectedChannelId);
    if (!channel) return;
    if (targets.some(t => t.socialChannelId === channel.id)) {
      setSelectedChannelId("");
      return;
    }

    // Varsayılan şablonlar
    const newTarget: UploadTarget = {
      socialChannelId: channel.id,
      titleTemplate: "{Title}",
      descriptionTemplate: "{Description}", 
      privacyStatus: "private",
      platformTags: [],
      categoryId: "22",
      defaultLanguage: "en",
      containsSyntheticMedia: false,
      selfDeclaredMadeForKids: false,
      notifySubscribers: false,
    };

    setTargets([...targets, newTarget]);
    setSelectedChannelId("");
  };

  const removeTarget = (idx: number) => {
    setTargets(targets.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    const pendingChannel = selectedChannelId
      ? channels.find(c => c.id.toString() === selectedChannelId)
      : null;
    const finalTargets = pendingChannel && !targets.some(t => t.socialChannelId === pendingChannel.id)
      ? [...targets, createTargetFromChannel(pendingChannel)]
      : targets;

    const config = {
      DefaultPrivacy: "private",
      DefaultCategoryId: "22",
      DefaultLanguage: "en",
      DefaultSelfDeclaredMadeForKids: false,
      DefaultContainsSyntheticMedia: false,
      DefaultNotifySubscribers: false,
      Targets: finalTargets
    };
    await onSave(JSON.stringify(config));
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Ayarları (Hedef Kanallar)" maxWidth="2xl">
      <div className="space-y-4 min-h-[400px]">
        {/* Kanal Ekleme */}
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <HelpLabel help="Render sonrasi videonun yuklenecegi sosyal kanal. Kanal baglantisi Social Channels ekranindan tanimli olmalidir.">
              Kanal Ekle
            </HelpLabel>
            <Select 
              value={selectedChannelId} 
              onChange={(value) => {
                setSelectedChannelId(value);
                const channel = channels.find(c => c.id.toString() === value);
                if (!channel || targets.some(t => t.socialChannelId === channel.id)) return;
                setTargets(prev => [...prev, createTargetFromChannel(channel)]);
                setSelectedChannelId("");
              }}
              options={channels.map(c => ({ label: `${c.platform} - ${c.channelName}`, value: c.id.toString() }))}
              placeholder="Kanal Seç..."
            />
          </div>
          <Button onClick={addTarget} size="sm" variant="primary" className="mb-px"><Plus size={16}/></Button>
        </div>

        {/* Liste */}
        <div className="space-y-2 pr-1">
          {targets.map((t, idx) => {
            const ch = channels.find(c => c.id === t.socialChannelId);
            return (
              <div key={idx} className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg text-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-zinc-200">{ch?.platform} - {ch?.channelName}</span>
                  <button onClick={() => removeTarget(idx)} className="text-red-400 hover:text-red-300"><Trash2 size={14}/></button>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <HelpLabel className="text-[10px]" help="{Title} gibi render/script metadata alanlarini kullanarak platform basligi olusturur.">
                      Başlık Şablonu
                    </HelpLabel>
                    <Input 
                      value={t.titleTemplate} 
                      onChange={e => {
                        const newTargets = [...targets];
                        newTargets[idx].titleTemplate = e.target.value;
                        setTargets(newTargets);
                      }}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div>
                    <HelpLabel className="text-[10px]" help="{Description} kullanirsan script stage'in urettigi aciklama final upload aciklamasina tasinir.">
                      Açıklama Şablonu
                    </HelpLabel>
                    <Input 
                      value={t.descriptionTemplate || ""} 
                      onChange={e => {
                        const newTargets = [...targets];
                        newTargets[idx].descriptionTemplate = e.target.value;
                        setTargets(newTargets);
                      }}
                      className="h-7 text-xs"
                      placeholder="{Description}"
                    />
                  </div>
                  <div className="col-span-2">
                    <HelpLabel className="text-[10px]" help="Virgulle ayrilmis platform tag listesi. Shorts icin #Shorts gibi tagler, long-form icin konu/seri tagleri eklenebilir.">
                      Platform Etiketleri (Virgülle)
                    </HelpLabel>
                    <Input 
                      value={t.platformTags?.join(", ") || ""} 
                      onChange={e => {
                        const newTargets = [...targets];
                        newTargets[idx].platformTags = e.target.value.split(",").map(s => s.trim()).filter(Boolean);
                        setTargets(newTargets);
                      }}
                      className="h-7 text-xs"
                      placeholder="#shorts, #reels vb."
                    />
                  </div>
                  <div>
                    <HelpLabel className="text-[10px]" help="Upload sonrasi video gorunurlugu. Test uretimlerinde private/unlisted, hazir akislerde public kullan.">
                      Gizlilik
                    </HelpLabel>
                    <Select 
                       value={t.privacyStatus}
                       onChange={val => {
                        const newTargets = [...targets];
                        newTargets[idx].privacyStatus = val;
                        setTargets(newTargets);
                       }}
                       options={[{label:"Private", value:"private"}, {label:"Public", value:"public"}, {label:"Unlisted", value:"unlisted"}]}
                       className="h-7 text-xs"
                    />
                  </div>
                  <div>
                    <HelpLabel className="text-[10px]" help="YouTube kategori ID. 22 = People & Blogs. Egitim icin 27, bilim/teknoloji icin 28 dusunulebilir.">
                      Kategori ID
                    </HelpLabel>
                    <Input
                      value={t.categoryId || "22"}
                      onChange={e => {
                        const newTargets = [...targets];
                        newTargets[idx].categoryId = e.target.value;
                        setTargets(newTargets);
                      }}
                      className="h-7 text-xs"
                      placeholder="22"
                    />
                  </div>
                  <div>
                    <HelpLabel className="text-[10px]" help="YouTube metadata dili. Ingilizce long-form icin en, Turkce icin tr kullan.">
                      Dil
                    </HelpLabel>
                    <Input
                      value={t.defaultLanguage || "en"}
                      onChange={e => {
                        const newTargets = [...targets];
                        newTargets[idx].defaultLanguage = e.target.value;
                        setTargets(newTargets);
                      }}
                      className="h-7 text-xs"
                      placeholder="en"
                    />
                  </div>
                  <div>
                    <HelpLabel className="text-[10px]" help="Gercekci sekilde degistirilmis/sentetik insan, olay veya mekan icerigi varsa YouTube'a bildir. Doodle/stick figure icin genelde kapali kalabilir.">
                      Synthetic Media
                    </HelpLabel>
                    <Select
                      value={String(Boolean(t.containsSyntheticMedia))}
                      onChange={val => {
                        const newTargets = [...targets];
                        newTargets[idx].containsSyntheticMedia = val === "true";
                        setTargets(newTargets);
                      }}
                      options={[{ label: "Hayir", value: "false" }, { label: "Evet", value: "true" }]}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div>
                    <HelpLabel className="text-[10px]" help="Video cocuklara ozel uretilmediyse kapali kalmali. Yanlis acmak yorum/reklam/onerim davranisini etkileyebilir.">
                      Made for Kids
                    </HelpLabel>
                    <Select
                      value={String(Boolean(t.selfDeclaredMadeForKids))}
                      onChange={val => {
                        const newTargets = [...targets];
                        newTargets[idx].selfDeclaredMadeForKids = val === "true";
                        setTargets(newTargets);
                      }}
                      options={[{ label: "Hayir", value: "false" }, { label: "Evet", value: "true" }]}
                      className="h-7 text-xs"
                    />
                  </div>
                  <div>
                    <HelpLabel className="text-[10px]" help="Public uploadlarda abonelere bildirim gitsin mi? Test/deneme uretimlerinde kapali tutmak daha guvenli.">
                      Abone Bildirimi
                    </HelpLabel>
                    <Select
                      value={String(Boolean(t.notifySubscribers))}
                      onChange={val => {
                        const newTargets = [...targets];
                        newTargets[idx].notifySubscribers = val === "true";
                        setTargets(newTargets);
                      }}
                      options={[{ label: "Kapali", value: "false" }, { label: "Acik", value: "true" }]}
                      className="h-7 text-xs"
                    />
                  </div>
                </div>
              </div>
            );
          })}
          {targets.length === 0 && (
             <div className="text-center text-zinc-500 text-xs py-4">Kanal eklenmedi.</div>
          )}
        </div>

        <div className="flex justify-end pt-2">
           <Button onClick={handleSave} variant="primary">Ayarları Kaydet</Button>
        </div>
      </div>
    </Modal>
  );
}
