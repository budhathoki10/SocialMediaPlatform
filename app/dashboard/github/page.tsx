import {
  ArrowLeft,
  ExternalLink,
  GitBranch,
  GitFork,
  Globe2,
  Lock,
  Star,
} from "lucide-react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { ConnectedAccount, User } from "@/lib/models";

type GithubRepository = {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  private: boolean;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  default_branch: string;
};

type SessionUser = {
  id?: string;
  email?: string | null;
};

async function getCurrentUser(sessionUser: SessionUser | undefined) {
  if (!sessionUser?.id && !sessionUser?.email) {
    return null;
  }

  await connectDB();

  if (sessionUser.id) {
    const user = await User.findById(sessionUser.id).select("_id").lean();

    if (user) {
      return user;
    }
  }

  if (sessionUser.email) {
    return User.findOne({ email: sessionUser.email }).select("_id").lean();
  }

  return null;
}

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default async function GithubAutomationPage() {
  const session = await getServerSession(authOptions);
  const currentUser = await getCurrentUser(session?.user as SessionUser | undefined);

  if (!currentUser) {
    redirect("/login?callbackUrl=/dashboard/github");
  }

  const githubAccount = await ConnectedAccount.findOne({
    user_id: currentUser._id,
    platform: "github",
    status: "active",
  })
    .select("+access_token platform_username")
    .lean<{ access_token?: string; platform_username?: string }>();

  if (!githubAccount?.access_token) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950">
        <section className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-950">
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
          <div className="mt-10">
            <GitBranch className="h-9 w-9 text-[#4338ca]" />
            <h1 className="mt-5 text-2xl font-bold">Connect GitHub to view repositories</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Connect your GitHub account first, then AutoPilot can show repositories and use repository events for automation.
            </p>
            <Link href="/onboarding" className="mt-6 inline-flex h-10 items-center rounded-md bg-[#4338ca] px-5 text-sm font-bold text-white hover:bg-[#3730a3]">
              Connect GitHub
            </Link>
          </div>
        </section>
      </main>
    );
  }

  let repositories: GithubRepository[] = [];
  let loadError: string | null = null;

  try {
    const response = await fetch("https://api.github.com/user/repos?per_page=100&sort=updated&direction=desc", {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${githubAccount.access_token}`,
        "User-Agent": "AutoPilot",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      loadError = `GitHub returned ${response.status}. Reconnect GitHub and try again.`;
    } else {
      repositories = (await response.json()) as GithubRepository[];
    }
  } catch {
    loadError = "Unable to reach GitHub right now. Try again shortly.";
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-950">
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>

        <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#4338ca]">GitHub Automation</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Your repositories</h1>
            <p className="mt-2 text-sm text-slate-500">
              Connected as <span className="font-semibold text-slate-700">{githubAccount.platform_username}</span>
            </p>
          </div>
          <span className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
            {repositories.length} repositories
          </span>
        </div>

        {loadError ? (
          <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">{loadError}</div>
        ) : repositories.length === 0 ? (
          <div className="mt-8 rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            No repositories were returned by GitHub for this account.
          </div>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {repositories.map((repository) => (
              <article key={repository.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-bold text-slate-950">{repository.name}</h2>
                    <p className="mt-1 truncate text-xs text-slate-500">{repository.full_name}</p>
                  </div>
                  <a 
                    href={repository.html_url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Open ${repository.name} on GitHub`}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-950"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>

                <p className="mt-4 min-h-10 text-sm leading-5 text-slate-600">{repository.description || "No repository description."}</p>

                <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    {repository.private ? <Lock className="h-3.5 w-3.5" /> : <Globe2 className="h-3.5 w-3.5" />}
                    {repository.private ? "Private" : "Public"}
                  </span>
                  {repository.language && <span>{repository.language}</span>}
                  <span className="inline-flex items-center gap-1.5"><Star className="h-3.5 w-3.5" />{repository.stargazers_count}</span>
                  <span className="inline-flex items-center gap-1.5"><GitFork className="h-3.5 w-3.5" />{repository.forks_count}</span>
                  <span>Updated {formatUpdatedAt(repository.updated_at)}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}