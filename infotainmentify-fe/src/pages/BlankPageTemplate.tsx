// ===============================
// File: src/pages/BlankPageTemplate.tsx
// ===============================
import { Page, Toolbar, Card, CardBody } from "../components/ui-kit";
export default function BlankPageTemplate() {
  return (
    <Page>
      <div className="grid grid-cols-12 gap-4 h-full">
        <section className="col-span-12 xl:col-span-7 flex flex-col min-h-0">
          <Toolbar>/* filters, actions */</Toolbar>
          <Card className="mt-3 flex-1 min-h-0 overflow-auto">
            <CardBody>Left content</CardBody>
          </Card>
        </section>
        <section className="col-span-12 xl:col-span-5 flex flex-col min-h-0">
          <Card className="flex-1 min-h-0 overflow-auto">
            <CardBody>Right content</CardBody>
          </Card>
        </section>
      </div>
    </Page>
  );
}
