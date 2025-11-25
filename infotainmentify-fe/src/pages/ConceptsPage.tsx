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
  Field,
  Input,
  Modal,
} from "../components/ui-kit";
import toast from "react-hot-toast";
import { useConfirm } from "../components/confirm";
import {
  conceptsApi,
  type ConceptListDto,
  type ConceptDetailDto,
} from "../api/concepts";

const EMPTY: ConceptDetailDto = {
  id: 0,
  name: "",
  description: "",
  isActive: true,
};

export default function ConceptsPage() {
  const [list, setList] = useState<ConceptListDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [item, setItem] = useState<ConceptDetailDto>(EMPTY);
  const confirm = useConfirm();

  const load = () => {
    setLoading(true);
    conceptsApi
      .list({ q })
      .then((res) => setList(res))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setItem(EMPTY);
    setModalOpen(true);
  };

  const openEdit = (id: number) => {
    conceptsApi.get(id).then((dto) => {
      setItem(dto);
      setModalOpen(true);
    });
  };

  const save = () => {
    conceptsApi.save(item).then(() => {
      toast.success("Kaydedildi");
      setModalOpen(false);
      load();
    });
  };

  const remove = (id: number) => {
    confirm("Silmek istiyor musun?", "Bu işlem geri alınamaz.").then(() => {
      conceptsApi.delete(id).then(() => {
        toast.success("Silindi");
        load();
      });
    });
  };

  return (
    <Page>
      <Toolbar>
        <div className="flex gap-3 items-center">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ara..."
          />
          <Button onClick={load}>Ara</Button>
        </div>
        <Button onClick={openNew}>Yeni Konsept</Button>
      </Toolbar>

      <Card>
        <Table loading={loading}>
          <THead>
            <TR>
              <TH>Ad</TH>
              <TH>Açıklama</TH>
              <TH>Aktif</TH>
              <TH></TH>
            </TR>
          </THead>
          <tbody>
            {list.map((x) => (
              <TR key={x.id}>
                <TD>{x.name}</TD>
                <TD>{x.description}</TD>
                <TD>{x.isActive ? "Evet" : "Hayır"}</TD>
                <TD className="text-right flex gap-2 justify-end">
                  <Button size="sm" onClick={() => openEdit(x.id)}>
                    Düzenle
                  </Button>
                  <Button size="sm" color="danger" onClick={() => remove(x.id)}>
                    Sil
                  </Button>
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Card>
          <Card.Body>
            <Field label="Ad">
              <Input
                value={item.name}
                onChange={(e) => setItem({ ...item, name: e.target.value })}
              />
            </Field>

            <Field label="Açıklama">
              <Input
                value={item.description ?? ""}
                onChange={(e) =>
                  setItem({ ...item, description: e.target.value })
                }
              />
            </Field>

            <Field label="Aktif mi?">
              <Input
                type="checkbox"
                checked={item.isActive}
                onChange={(e) =>
                  setItem({ ...item, isActive: e.target.checked })
                }
              />
            </Field>
          </Card.Body>
          <Card.Footer>
            <div className="flex justify-end gap-3">
              <Button onClick={() => setModalOpen(false)} color="secondary">
                Kapat
              </Button>
              <Button onClick={save}>Kaydet</Button>
            </div>
          </Card.Footer>
        </Card>
      </Modal>
    </Page>
  );
}
