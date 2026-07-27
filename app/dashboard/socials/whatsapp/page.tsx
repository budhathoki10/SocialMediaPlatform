import { MessageSquare, Reply, Send, Users } from "lucide-react";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import WhatsAppDraftInboxPreview from "@/components/dashboard/WhatsAppDraftInboxPreview";

// WhatsApp has no OAuth connect flow or API integration yet (see README
// "Not Yet Implemented") — this page is a static preview of what the
// automation panel will look like once that's built, not a working inbox.
const statCards = [
  { label: "Total Messages", Icon: MessageSquare },
  { label: "Total Chats", Icon: Users },
  { label: "Auto-Replies Sent", Icon: Reply },
  { label: "Sent Today", Icon: Send },
];

export default async function WhatsAppSocialPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard/socials/whatsapp");
  }

  return (
    <section className="h-screen min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">WhatsApp</h1>

            <section className="mt-5 rounded-card border border-slate-200 bg-white px-5 py-4 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-5">
                <div className="flex min-w-0 items-center gap-4">
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-slate-50 ring-1 ring-slate-100">
                    <Image src="/landing/whatsapp.png" alt="" width={32} height={32} className="h-8 w-8 object-contain" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900">WhatsApp Business</h2>
                      <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-amber-600">
                        Coming Soon
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Auto-reply and inbox automation for WhatsApp Business isn&apos;t built yet — this is a preview of the panel it&apos;ll land in.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-5 grid gap-4 md:grid-cols-4">
              {statCards.map(({ label, Icon }) => (
                <div key={label} className="flex items-center gap-3 rounded-card border border-slate-200 bg-white p-4 shadow-card">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-control bg-primary-tint text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-2xl font-extrabold leading-none text-slate-950">0</p>
                    <p className="mt-1 truncate text-xs font-semibold text-slate-500">{label}</p>
                  </div>
                </div>
              ))}
            </section>

        <WhatsAppDraftInboxPreview />
      </div>
    </section>
  );
}
