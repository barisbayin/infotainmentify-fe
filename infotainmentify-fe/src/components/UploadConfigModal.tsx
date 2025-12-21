import { useState, useEffect } from "react";
import { Modal, Button, Label, Input, Select } from "./ui-kit";
import { socialChannelsApi, type SocialChannelListDto } from "../api/socialChannels"; 
import { Trash2, Plus } from "lucide-react";

interface UploadConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (configJson: string) => void;
  initialConfig?: string;
}

type UploadTarget = {
  socialChannelId: number;
  titleTemplate: string;
  descriptionTemplate: string;
  privacyStatus: string;
  platformTags: string[];
};

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
          if (parsed.Targets) setTargets(parsed.Targets);
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

    // Varsayılan şablonlar
    const newTarget: UploadTarget = {
      socialChannelId: channel.id,
      titleTemplate: channel.platform === 'YouTube' ? "{Title} #Shorts" : "{Title}",
      descriptionTemplate: "{Description}", 
      privacyStatus: "private",
      platformTags: []
    };

    setTargets([...targets, newTarget]);
    setSelectedChannelId("");
  };

  const removeTarget = (idx: number) => {
    setTargets(targets.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    const config = {
      DefaultPrivacy: "private",
      Targets: targets
    };
    onSave(JSON.stringify(config));
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Ayarları (Hedef Kanallar)" maxWidth="2xl">
      <div className="space-y-4 min-h-[400px]">
        {/* Kanal Ekleme */}
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Label>Kanal Ekle</Label>
            <Select 
              value={selectedChannelId} 
              onChange={setSelectedChannelId}
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
                    <Label className="text-[10px]">Başlık Şablonu</Label>
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
                    <Label className="text-[10px]">Açıklama Şablonu</Label>
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
                    <Label className="text-[10px]">Platform Etiketleri (Virgülle)</Label>
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
                    <Label className="text-[10px]">Gizlilik</Label>
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