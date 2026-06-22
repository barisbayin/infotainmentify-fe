import { useEffect, useState } from "react";
import { Input, Textarea } from "./ui-kit";

export interface KeyValueItem {
  key: string;
  value: string;
}

export interface KeyValueEditorProps {
  value?: Record<string, string>;
  onChange?: (v: Record<string, string>) => void;
}

export default function KeyValueEditor({
  value = {},
  onChange,
}: KeyValueEditorProps) {
  const [items, setItems] = useState<KeyValueItem[]>([]);

  // INITIAL LOAD - sadece ilk kez doldur
  useEffect(() => {
    setItems(
      Object.entries(value).map(([k, v]) => ({
        key: k,
        value: v,
      }))
    );
  }, []); // <---- DİKKAT! value dependency yok

  const sync = (list: KeyValueItem[]) => {
    const out: Record<string, string> = {};
    list.forEach((x) => {
      if (x.key.trim()) out[x.key] = x.value;
    });
    onChange?.(out);
  };

  const addItem = () => {
    const updated = [...items, { key: "", value: "" }];
    setItems(updated);
    sync(updated);
  };

  const removeItem = (i: number) => {
    const updated = items.filter((_, idx) => idx !== i);
    setItems(updated);
    sync(updated);
  };

  const updateItem = (i: number, field: "key" | "value", val: string) => {
    const updated = [...items];
    updated[i] = { ...updated[i], [field]: val };
    setItems(updated);
    sync(updated);
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* JSON PREVIEW */}
      <pre className="bg-neutral-900 text-green-400 p-3 rounded-lg text-xs overflow-auto">
        {JSON.stringify(
          items.reduce((o, x) => {
            if (x.key.trim()) o[x.key] = x.value;
            return o;
          }, {} as Record<string, string>),
          null,
          2
        )}
      </pre>

      {items.map((item, i) => (
        <div
          key={i}
          className="grid grid-cols-2 gap-2 border border-neutral-300 p-3 rounded-xl bg-neutral-50"
        >
          <Input
            placeholder="key"
            value={item.key}
            onChange={(e) => updateItem(i, "key", e.target.value)}
          />

          <Textarea
            placeholder="value (JSON yazılabilir)"
            value={item.value}
            rows={2}
            onChange={(e) => updateItem(i, "value", e.target.value)}
            className="font-mono"
          />

          <div className="col-span-2 flex justify-end">
            <button
              onClick={() => removeItem(i)}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg"
            >
              Sil
            </button>
          </div>
        </div>
      ))}

      <button
        onClick={addItem}
        className="bg-neutral-800 hover:bg-neutral-900 text-white px-4 py-2 rounded-xl"
      >
        + Satır Ekle
      </button>
    </div>
  );
}
