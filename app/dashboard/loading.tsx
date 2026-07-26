export default function DashboardLoading() {
  return (
    <main className="h-screen overflow-hidden bg-[#f6f8fb]">
      <div className="flex h-screen animate-pulse">
        <aside className="hidden h-screen w-[248px] shrink-0 flex-col gap-2 border-r border-slate-200 bg-white px-5 py-6 lg:flex">
          <div className="h-8 w-28 rounded-control bg-slate-100" />
          <div className="mt-6 space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-9 rounded-control bg-slate-100" />
            ))}
          </div>
        </aside>

        <section className="flex h-screen min-w-0 flex-1 flex-col">
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
      </div>
    </main>
  );
}
