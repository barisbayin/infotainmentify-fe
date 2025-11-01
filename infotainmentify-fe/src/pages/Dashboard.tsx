export default function Dashboard() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="text-sm text-gray-500">Prompts</div>
        <div className="mt-1 text-2xl font-semibold text-gray-800">—</div>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="text-sm text-gray-500">Topics</div>
        <div className="mt-1 text-2xl font-semibold text-gray-800">—</div>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="text-sm text-gray-500">Jobs</div>
        <div className="mt-1 text-2xl font-semibold text-gray-800">—</div>
      </div>

      <div className="md:col-span-2 rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-gray-800">Recent Activity</h2>
        <ul className="mt-3 space-y-2">
          <li className="text-sm text-gray-600">No recent items.</li>
        </ul>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-gray-800">Quick Actions</h2>
        <div className="mt-3 flex flex-col gap-2">
          <a
            href="/prompts"
            className="inline-flex items-center justify-center rounded-md bg-blue-600 text-white px-3 py-2 text-sm hover:bg-blue-700"
          >
            Create Prompt
          </a>
          <a
            href="/generate"
            className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Generate Topics
          </a>
        </div>
      </div>
    </div>
  );
}
