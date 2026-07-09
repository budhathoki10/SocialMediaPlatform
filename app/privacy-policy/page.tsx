import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | AutoPilot",
  description: "AutoPilot privacy policy for Instagram and social media automation.",
};

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-12 text-slate-900">
      <article className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-10">
        <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.24em] text-indigo-600">AutoPilot</p>
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Privacy Policy</h1>
        <p className="mt-3 text-sm font-semibold text-slate-500">Last updated: July 2026</p>

        <div className="mt-8 space-y-7 text-base leading-8 text-slate-600">
          <p>
            AutoPilot is a social media automation platform that helps users manage Instagram messages, comments,
            drafts, and social media automation workflows.
          </p>

          <section>
            <h2 className="text-xl font-black text-slate-950">Information We Collect</h2>
            <p className="mt-2">
              When users connect their Instagram account, we may collect Instagram account information such as
              username, profile picture, biography, follower count, following count, post count, messages, comments,
              and draft replies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-slate-950">How We Use Information</h2>
            <p className="mt-2">
              We use this information to display Instagram account details, receive webhook events, generate reply
              drafts, manage pending replies, and allow users to approve or send responses.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-slate-950">Data Storage</h2>
            <p className="mt-2">
              We may store connected account details, messages, comments, draft replies, and sent reply history in our
              database for app functionality.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-slate-950">Data Sharing</h2>
            <p className="mt-2">
              We do not sell user data. We only use data to provide the automation features requested by the user.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-slate-950">User Control</h2>
            <p className="mt-2">
              Users can disconnect their Instagram account or request deletion of their stored data by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-slate-950">Contact</h2>
            <p className="mt-2">For privacy questions, contact us at: budhathokikushal170@gmail.com</p>
          </section>
        </div>
      </article>
    </main>
  );
}
