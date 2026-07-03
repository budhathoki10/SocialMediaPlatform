import { Bell, Settings } from "lucide-react";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import CreatePostComposer from "@/components/dashboard/CreatePostComposer";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

type SessionUser = {
  image?: string | null;
  name?: string | null;
};

function Toolbar({ user }: { user?: SessionUser }) {
  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 sm:px-6 lg:px-8">
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Workspace</p>
        <p className="mt-0.5 truncate text-sm font-bold text-slate-800">AutoPilot Composer</p>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <button aria-label="Notifications" className="relative grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-950">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>
        <button aria-label="Settings" className="hidden h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-950 sm:grid">
          <Settings className="h-5 w-5" />
        </button>
        <div className="hidden h-8 w-px bg-slate-200 sm:block" />
        <div className="hidden text-right sm:block">
          <p className="max-w-40 truncate text-sm font-bold leading-4 text-slate-700">{user?.name || "User"}</p>
          <p className="mt-1 text-xs text-slate-500">Composer</p>
        </div>
        <Image
          src={user?.image || "/landing/testimonial-avatar.png"}
          alt={user?.name ? `${user.name} avatar` : "User avatar"}
          width={40}
          height={40}
          className="h-10 w-10 rounded-full object-cover ring-2 ring-white"
        />
      </div>
    </header>
  );
}

export default async function CreatePostPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard/create-post");
  }

  return (
    <main className="h-screen overflow-hidden bg-[#f6f8fb] text-slate-950">
      <div className="flex h-screen">
        <DashboardSidebar />

        <section className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
          <Toolbar user={session.user} />
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-7 sm:px-6 lg:px-8">
            <CreatePostComposer userName={session.user.name} />
          </div>
        </section>
      </div>
    </main>
  );
}
