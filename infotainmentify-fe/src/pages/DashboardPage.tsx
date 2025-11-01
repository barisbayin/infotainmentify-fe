import {
  Page,
  Card,
  CardHeader,
  CardBody,
  Table,
  THead,
  TR,
  TH,
  TD,
} from "../components/ui-kit";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

const lineData = [
  { name: "Mon", views: 120 },
  { name: "Tue", views: 180 },
  { name: "Wed", views: 140 },
  { name: "Thu", views: 220 },
  { name: "Fri", views: 200 },
  { name: "Sat", views: 260 },
  { name: "Sun", views: 240 },
];

const barData = [
  { name: "Cats", count: 34 },
  { name: "Space", count: 21 },
  { name: "History", count: 17 },
  { name: "Tech", count: 26 },
];

export default function DashboardPage() {
  return (
    <Page>
      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-12 xl:col-span-7">
          <CardHeader>Weekly Views</CardHeader>
          <CardBody className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={lineData}
                margin={{ top: 10, right: 20, bottom: 0, left: -10 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="#111827"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card className="col-span-12 xl:col-span-5">
          <CardHeader>Top Categories</CardHeader>
          <CardBody className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                margin={{ top: 10, right: 20, bottom: 0, left: -10 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#111827" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card className="col-span-12">
          <CardHeader>Recent Items</CardHeader>
          <CardBody className="overflow-auto">
            <Table>
              <THead>
                <TR>
                  <TH>ID</TH>
                  <TH>Title</TH>
                  <TH>Status</TH>
                  <TH>Date</TH>
                </TR>
              </THead>
              <tbody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <TR key={i} className="border-b border-neutral-100">
                    <TD>#{i}</TD>
                    <TD>Sample row {i}</TD>
                    <TD>{i % 2 === 0 ? "Published" : "Draft"}</TD>
                    <TD>2025-10-2{i}</TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </CardBody>
        </Card>
      </div>
    </Page>
  );
}
