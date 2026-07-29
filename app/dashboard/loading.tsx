// app/dashboard/layout.tsx renders DashboardSidebar outside this Suspense
// boundary, so it stays mounted during navigation — this fallback only
// needs to cover the content pane.
export default function DashboardLoading() {
  return (
    <section className="flex h-full min-w-0 flex-1 flex-col animate-pulse">
      <div className="h-16 shrink-0 border-b border-slate-200 bg-white" />
      <div className="min-h-0 flex-1 space-y-5 px-4 py-7 sm:px-6 lg:px-8">
        <div className="h-8 w-56 rounded-control bg-slate-200/70" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-20 rounded-card border border-slate-200 bg-white" />
          ))}
        </div>
        <div className="h-64 rounded-card border border-slate-200 bg-white" />
      </div>
    </section>
  );
}
