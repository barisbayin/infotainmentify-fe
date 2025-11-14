import { useEffect, useState } from "react";
import {
  Page,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Toolbar,
  Table,
  THead,
  TR,
  TH,
  TD,
  Button,
  Field,
  Input,
} from "../components/ui-kit";

import toast from "react-hot-toast";
import { useConfirm } from "../components/confirm";

import { autoVideoAssetsApi } from "../api/autoVideoAssets";
import type {
  AutoVideoAssetListDto,
  AutoVideoAssetDetailDto,
} from "../api/autoVideoAssets";

// CJS import → TypeScript hata vermez
import SyntaxHighlighter from "react-syntax-highlighter/dist/cjs/light";
import { atomOneDark } from "react-syntax-highlighter/dist/cjs/styles/hljs";

// --------------------------------------------------
// Status Badge
// --------------------------------------------------
function StatusBadge({ status }: { status: number }) {
  const map: Record<number, { text: string; color: string }> = {
    0: { text: "Pending", color: "bg-gray-500" },
    1: { text: "Generating Topic", color: "bg-blue-500" },
    2: { text: "Generating Script", color: "bg-indigo-500" },
    3: { text: "Generating Assets", color: "bg-purple-500" },
    4: { text: "Rendering", color: "bg-yellow-500" },
    5: { text: "Completed", color: "bg-green-600" },
    6: { text: "Uploading", color: "bg-orange-500" },
    7: { text: "Uploaded", color: "bg-emerald-600" },
    99: { text: "Failed", color: "bg-red-600" },
  };

  const info = map[status] ?? { text: "Unknown", color: "bg-gray-400" };

  return (
    <span className={`text-white px-2 py-1 rounded text-xs ${info.color}`}>
      {info.text}
    </span>
  );
}

export default function AutoVideoAssetsPage() {
  const confirm = useConfirm();

  const [items, setItems] = useState<AutoVideoAssetListDto[]>([]);
  const [filtered, setFiltered] = useState<AutoVideoAssetListDto[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<AutoVideoAssetDetailDto | null>(null);
  const [log, setLog] = useState<any[]>([]);

  const [q, setQ] = useState("");

  // ---------------- LOAD LIST ----------------
  async function load() {
    setLoading(true);
    try {
      const data = await autoVideoAssetsApi.list();
      setItems(data);
      setFiltered(data);
    } catch {
      toast.error("Liste yüklenemedi.");
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  // ---------------- FILTER ----------------
  useEffect(() => {
    const f = items.filter((x) => {
      const value =
        x.profileId.toString() +
        " " +
        (x.videoPath ?? "") +
        " " +
        (x.thumbnailPath ?? "");

      return !q || value.toLowerCase().includes(q.toLowerCase());
    });

    setFiltered(f);
  }, [q, items]);

  // ---------------- SELECT ROW ----------------
  async function onRowClick(item: AutoVideoAssetListDto) {
    setSelectedId(item.id);
    setDetailLoading(true);

    try {
      const d = await autoVideoAssetsApi.get(item.id);
      setDetail(d);

      const lg = await autoVideoAssetsApi.getLog(item.id);
      setLog(lg);
    } catch {
      toast.error("Detay yüklenemedi.");
    }

    setDetailLoading(false);
  }

  // ---------------- DELETE ----------------
  async function onDelete() {
    if (!selectedId) return;

    const ok = await confirm({
      title: "Silinsin mi?",
      message: `#${selectedId} kalıcı olarak silinecek.`,
      confirmText: "Sil",
      cancelText: "İptal",
      tone: "danger",
    });

    if (!ok) return;

    try {
      await autoVideoAssetsApi.delete(selectedId);
      toast.success("Silindi.");

      setSelectedId(null);
      setDetail(null);
      setLog([]);
      load();
    } catch {
      toast.error("Silme başarısız.");
    }
  }

  // Build upload view link
  function buildUploadLink(
    platform?: string | null,
    id?: string | null
  ): string | null {
    if (!platform || !id) return null;

    const p = platform.toLowerCase();

    if (p === "youtube") return `https://www.youtube.com/watch?v=${id}`;
    if (p === "tiktok") return `https://www.tiktok.com/@user/video/${id}`;
    if (p === "instagram") return `https://www.instagram.com/reel/${id}`;

    return null;
  }

  // =====================================================
  // RENDER
  // =====================================================
  return (
    <Page>
      <div className="grid grid-cols-12 gap-4 h-full">
        {/* LEFT LIST */}
        <section className="col-span-12 xl:col-span-7 flex flex-col min-h-0">
          <Toolbar className="flex gap-2">
            <Input
              placeholder="Ara…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />

            <Button onClick={load} disabled={loading}>
              {loading ? "Yükleniyor…" : "Yenile"}
            </Button>
          </Toolbar>

          <Card className="mt-3 min-h-0 flex-1 overflow-auto">
            <Table>
              <THead>
                <TR>
                  <TH>ID</TH>
                  <TH>Profil</TH>
                  <TH>Status</TH>
                  <TH>Video</TH>
                  <TH>Oluşturma</TH>
                </TR>
              </THead>

              <tbody>
                {filtered.map((x) => (
                  <TR
                    key={x.id}
                    onClick={() => onRowClick(x)}
                    className={[
                      "cursor-pointer border-b hover:bg-neutral-50",
                      selectedId === x.id ? "bg-neutral-100" : "",
                    ].join(" ")}
                  >
                    <TD>#{x.id}</TD>
                    <TD>{x.profileId}</TD>
                    <TD>
                      <StatusBadge status={x.status} />
                    </TD>
                    <TD>{x.videoPath ? "Var" : "—"}</TD>
                    <TD>{new Date(x.createdAt).toLocaleString("tr-TR")}</TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </Card>
        </section>

        {/* RIGHT DETAIL / LOG */}
        <section className="col-span-12 xl:col-span-5 flex flex-col min-h-0">
          <Card className="flex-1 flex flex-col">
            <CardHeader>
              <div className="text-lg font-semibold">
                {selectedId ? `Detay #${selectedId}` : "Kayıt seçiniz"}
              </div>
            </CardHeader>

            <CardBody className="flex-1 overflow-auto space-y-3">
              {detailLoading ? (
                <div className="p-3 text-sm text-neutral-500">Yükleniyor…</div>
              ) : detail ? (
                <>
                  <Field label="Status">
                    <StatusBadge status={detail.status} />
                  </Field>

                  <Field label="Profile ID">{detail.profileId}</Field>
                  <Field label="Topic ID">{detail.topicId ?? "—"}</Field>
                  <Field label="Script ID">{detail.scriptId ?? "—"}</Field>

                  <Field label="Video Path">{detail.videoPath ?? "—"}</Field>
                  <Field label="Thumbnail Path">
                    {detail.thumbnailPath ?? "—"}
                  </Field>

                  <Field label="Uploaded">
                    {detail.uploaded ? "Evet" : "Hayır"}
                  </Field>

                  <Field label="Upload Platform">
                    {detail.uploadPlatform ?? "—"}
                  </Field>
                  <Field label="Upload Video ID">
                    {detail.uploadVideoId ?? "—"}
                  </Field>

                  {buildUploadLink(
                    detail.uploadPlatform,
                    detail.uploadVideoId
                  ) && (
                    <Field label="Video Link">
                      <a
                        href={
                          buildUploadLink(
                            detail.uploadPlatform,
                            detail.uploadVideoId
                          )!
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        İzle
                      </a>
                    </Field>
                  )}

                  {/* JSON LOG */}
                  <Field label="Log">
                    {log.length === 0 ? (
                      <div className="text-sm text-neutral-500">Log yok.</div>
                    ) : (
                      <SyntaxHighlighter
                        language="json"
                        style={atomOneDark}
                        customStyle={{
                          maxHeight: "300px",
                          borderRadius: "8px",
                        }}
                      >
                        {JSON.stringify(log, null, 2)}
                      </SyntaxHighlighter>
                    )}
                  </Field>
                </>
              ) : (
                <div className="text-neutral-500 p-2 text-sm">
                  Kayıt seçiniz.
                </div>
              )}
            </CardBody>

            <CardFooter>
              <div className="flex justify-end gap-2">
                <Button
                  variant="danger"
                  onClick={onDelete}
                  disabled={!selectedId}
                >
                  Sil
                </Button>
              </div>
            </CardFooter>
          </Card>
        </section>
      </div>
    </Page>
  );
}
