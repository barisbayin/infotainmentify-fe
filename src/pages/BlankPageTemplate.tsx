import { Page, PageHeader, Card } from "../components/ui-kit";

// "export default" OLMALI
export default function BlankPageTemplate() {
  return (
    <Page>
      <PageHeader
        title="Yapım Aşamasında"
        subtitle="Bu modül henüz geliştirilme aşamasındadır."
      />
      <div className="flex flex-1 items-center justify-center min-h-[400px]">
        <Card className="p-8 text-center border-dashed border-2 border-zinc-800 bg-transparent">
          <h3 className="text-xl font-semibold text-zinc-400">
            🚧 Çalışma Var
          </h3>
          <p className="text-zinc-500 mt-2">Bu sayfa yakında eklenecek.</p>
        </Card>
      </div>
    </Page>
  );
}
