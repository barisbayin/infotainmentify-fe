import { useEffect, useState } from "react";
import {
  Page,
  Card,
  Toolbar,
  Table,
  THead,
  TR,
  TH,
  TD,
  Button,
  Input,
  Modal,
  Textarea,
} from "../components/ui-kit";
import {
  videoAssetsApi,
  type VideoAssetListDto,
  type VideoAssetDetailDto,
} from "../api/videoAssets";
import toast from "react-hot-toast";

export default function VideoAssetsPage() {
  const [items, setItems] = useState<VideoAssetListDto[]>([]);
  const [filterScriptId, setFilterScriptId] = useState("");
  const [filterType, setFilterType] = useState("");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<VideoAssetDetailDto | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await videoAssetsApi.list({
        scriptId: filterScriptId ? Number(filterScriptId) : undefined,
        assetType: filterType || undefined,
      });
      setItems(res);
    } catch {
      toast.error("Veriler yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  async function onDelete(id: number) {
    if (!confirm("Bu kaydı silmek istediğine emin misin?")) return;
    await videoAssetsApi.delete(id);
    toast.success("Kayıt silindi.");
    load();
  }

  async function onShowDetail(id: number) {
    const res = await videoAssetsApi.get(id);
    setSelected(res);
  }

  function formatDate(date?: string | null) {
    if (!date) return "-";
    return new Date(date).toLocaleString("tr-TR");
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <Page title="🎬 Video Assets">
      <Toolbar>
        <Input
          placeholder="Script ID"
          value={filterScriptId}
          onChange={(e) => setFilterScriptId(e.target.value)}
          style={{ width: "120px" }}
        />
        <Input
          placeholder="Asset tipi (image, tts, video, final)"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{ width: "240px" }}
        />
        <Button onClick={load} disabled={loading}>
          {loading ? "Yükleniyor..." : "Filtrele"}
        </Button>
      </Toolbar>

      <Card className="overflow-auto max-h-[calc(100vh-220px)]">
        <Table>
          <THead>
            <TR>
              <TH>ID</TH>
              <TH>Script</TH>
              <TH>Tür</TH>
              <TH>Key</TH>
              <TH>Durum</TH>
              <TH>Oluşturma</TH>
              <TH>Dosya</TH>
              <TH></TH>
            </TR>
          </THead>
          <tbody>
            {items.map((x) => (
              <TR key={x.id}>
                <TD>{x.id}</TD>
                <TD>{x.scriptId}</TD>
                <TD>{x.assetType}</TD>
                <TD>{x.assetKey}</TD>
                <TD>
                  {x.isGenerated ? "✅" : "❌"} {x.isUploaded ? "☁️" : ""}
                </TD>
                <TD>{formatDate(x.generatedAt)}</TD>
                <TD>
                  <a
                    href={x.filePath}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Dosya
                  </a>
                </TD>
                <TD className="text-right">
                  <Button size="sm" onClick={() => onShowDetail(x.id)}>
                    Detay
                  </Button>
                  <Button size="sm" color="red" onClick={() => onDelete(x.id)}>
                    Sil
                  </Button>
                </TD>
              </TR>
            ))}
            {!loading && items.length === 0 && (
              <TR>
                <TD colSpan={8} className="text-center text-gray-500 py-4">
                  Kayıt bulunamadı.
                </TD>
              </TR>
            )}
          </tbody>
        </Table>
      </Card>

      {selected && (
        <Modal onClose={() => setSelected(null)}>
          <h2 className="text-xl font-semibold mb-2">
            🎞️ Asset Detayı — #{selected.id}
          </h2>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <b>Script:</b> {selected.scriptId}
            </div>
            <div>
              <b>Tür:</b> {selected.assetType}
            </div>
            <div>
              <b>Key:</b> {selected.assetKey}
            </div>
            <div>
              <b>Oluşturma:</b> {formatDate(selected.generatedAt)}
            </div>
          </div>

          <div className="mb-2">
            <b>Dosya:</b>{" "}
            <a
              href={selected.filePath}
              target="_blank"
              rel="noreferrer"
              className="text-blue-500 hover:underline break-all"
            >
              {selected.filePath}
            </a>
          </div>

          <div>
            <b>Metadata:</b>
            <Textarea
              className="mt-1 h-48"
              readOnly
              value={
                selected.metadataJson
                  ? JSON.stringify(JSON.parse(selected.metadataJson), null, 2)
                  : "—"
              }
            />
          </div>
        </Modal>
      )}
    </Page>
  );
}
