"use client";

import { Suspense, useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";

type OnboardingPlatform = {
  name: string;
  status: "connected" | "available";
  Logo: () => ReactNode;
};

type OnboardingStep = {
  id: string;
  title: string;
  description: string;
};

type PlatformConnection = {
  connected: boolean;
  username?: string | null;
  connected_at?: string | null;
};

type ConnectedAccounts = {
  github?: PlatformConnection | null;
  linkedin?: PlatformConnection | null;
};

type AppSession = {
  connected_accounts?: ConnectedAccounts;
};

const currentStepIndex = 0;

const onboardingSteps: OnboardingStep[] = [
  {
    id: "connect-platforms",
    title: "Connect Platforms",
    description: "Link your accounts to start automating your presence.",
  },
  {
    id: "choose-goals",
    title: "Choose Goals",
    description: "Tell AutoPilot what you want to optimize.",
  },
  {
    id: "setup-schedule",
    title: "Set Schedule",
    description: "Pick when your content should go live.",
  },
  {
    id: "review-launch",
    title: "Review & Launch",
    description: "Confirm your settings before automation starts.",
  },
];

const LinkedInLogo = () => (
  <Image
    src="/landing/linkedin.png"
    alt=""
    width={44}
    height={44}
    className="h-11 w-11 object-contain"
  />
);

const TwitterLogo = () => (
  <svg aria-hidden="true" className="h-11 w-11" viewBox="0 0 44 44">
    <rect width="44" height="44" rx="12" fill="#1DA1F2" />
    <path
      fill="#FFFFFF"
      d="M33.9 16.1c0 .3 0 .5-.1.8.1 7.8-5.8 16.7-16.6 16.7-3.3 0-6.4-1-9-2.7.5.1.9.1 1.4.1 2.7 0 5.2-.9 7.2-2.5a5.8 5.8 0 0 1-5.4-4c.4.1.8.1 1.2.1.6 0 1.1-.1 1.6-.2a5.8 5.8 0 0 1-4.7-5.7v-.1c.8.5 1.7.8 2.7.8a5.8 5.8 0 0 1-1.8-7.8 16.5 16.5 0 0 0 12 6.1 5.8 5.8 0 0 1 9.9-5.3 11.2 11.2 0 0 0 3.7-1.4 5.8 5.8 0 0 1-2.6 3.2 11.8 11.8 0 0 0 3.3-.9 12.6 12.6 0 0 1-2.8 2.8Z"
    />
  </svg>
);

const InstagramLogo = () => (
  <Image
    src="/landing/instagram.png"
    alt=""
    width={44}
    height={44}
    className="h-11 w-11 scale-150 object-contain"
  />
);

const GitHubLogo = () => (
  <svg aria-hidden="true" className="h-11 w-11" viewBox="0 0 44 44">
    <rect width="44" height="44" rx="12" fill="#24292F" />
    <path
      fill="#FFFFFF"
      d="M22 8.8c-7.4 0-13.4 6-13.4 13.4 0 5.9 3.8 10.9 9.2 12.7.7.1.9-.3.9-.6v-2.4c-3.7.8-4.5-1.6-4.5-1.6-.6-1.5-1.5-1.9-1.5-1.9-1.2-.8.1-.8.1-.8 1.3.1 2 1.4 2 1.4 1.2 2 3 1.4 3.8 1.1.1-.9.5-1.4.8-1.8-3-.3-6.1-1.5-6.1-6.6 0-1.5.5-2.6 1.4-3.6-.1-.3-.6-1.7.1-3.5 0 0 1.1-.4 3.7 1.4 1.1-.3 2.2-.4 3.4-.4s2.3.1 3.4.4c2.6-1.8 3.7-1.4 3.7-1.4.7 1.8.2 3.2.1 3.5.9 1 1.4 2.1 1.4 3.6 0 5.1-3.1 6.3-6.1 6.6.5.4.9 1.2.9 2.5v3.6c0 .4.2.8.9.6a13.4 13.4 0 0 0 9.2-12.7c0-7.5-6-13.5-13.4-13.5Z"
    />
  </svg>
);

const FacebookLogo = () => (
  <Image
    src="/landing/facebook.png"
    alt=""
    width={44}
    height={44}
    className="h-11 w-11 scale-150 object-contain"
  />
);

const GmailLogo = () => (
  <Image
    src="/landing/gmail.png"
    alt=""
    width={44}
    height={44}
    className="h-11 w-11 scale-150 object-contain"
  />
);

const clickedLinkedin=()=>{
  window.location.assign("/api/auth/linkedin/connect");
}
const clickedInstagram=()=>{
  alert("Instagram clicked");
}


const clickedGitHub = () => {
  window.location.assign("/api/auth/github/connect");
}

const clickedFacebook = () => {
  alert("Facebook clicked");
}

const clickedGmail = () => {
  alert("Gmail clicked");
}

const clickedTwitter=()=>{
  alert("Twitter clicked");
}


const handlePlatformClick = async (SocialMedia: string) => {
  switch (SocialMedia) {
    case "LinkedIn":
      clickedLinkedin();
      break;
    case "Instagram":
      clickedInstagram();
      break;
    case "GitHub":
      await clickedGitHub();
      break;
    case "Facebook":
      clickedFacebook();
      break;
    case "Gmail":
      clickedGmail();
      break;
    case "Twitter":
      clickedTwitter();
      break;
    default:
      alert(`${SocialMedia} clicked`);
  }
} 


const onboardingPlatforms: OnboardingPlatform[] = [
  {
    name: "LinkedIn",
    status: "available",
    Logo: LinkedInLogo,
  },
  {
    name: "Twitter",
    status: "available",
    Logo: TwitterLogo,
  },
  {
    name: "Instagram",
    status: "available",
    Logo: InstagramLogo,
  },
  {
    name: "GitHub",
    status: "available",
    Logo: GitHubLogo,
  },
  {
    name: "Facebook",
    status: "available",
    Logo: FacebookLogo,
  },
  {
    name: "Gmail",
    status: "available",
    Logo: GmailLogo,
  },
];

const PlatformGrid = ({ platforms }: { platforms: OnboardingPlatform[] }) => {
  return (
    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      {platforms.map(({ name, status, Logo }) => {
        const isConnected = status === "connected";

        return (
          <button
            key={name}
            type="button"
            onClick={() => void handlePlatformClick(name)}
            disabled={isConnected}
            className={`flex min-h-28 flex-col items-center justify-center rounded-lg border px-4 py-4 text-center hover:cursor-pointer transition disabled:cursor-default ${
              isConnected
                ? "border-slate-200 bg-slate-50 opacity-60 shadow-sm"
                : "border-slate-200 bg-white hover:border-indigo-600 hover:bg-indigo-50/20"
            }`}
          >
            <span className="grid h-12 w-12 place-items-center">
              <Logo />
            </span>
            <span className="mt-4 text-sm font-semibold text-slate-950">{name}</span>
            <span
              className={`mt-2 inline-flex items-center gap-1 text-xs font-bold ${
                isConnected ? "text-emerald-600" : "text-[#4338ca]"
              }`}
            >
              {isConnected && <CheckCircle2 className="h-3.5 w-3.5" />}
              {isConnected ? "Connected" : "Connect"}
            </span>
          </button>
        );
      })}
    </div>
  );
};

const OnboardingContent = () => {
  const searchParams = useSearchParams();
  const { data: session, update } = useSession();
  const appSession = session as AppSession | null;
  const sessionConnections = appSession?.connected_accounts;
  const sessionGithub = sessionConnections?.github;
  const sessionLinkedin = sessionConnections?.linkedin;
  const sessionGithubConnected = Boolean(sessionGithub?.connected);
  const sessionLinkedinConnected = Boolean(sessionLinkedin?.connected);
  const [savedConnections, setSavedConnections] = useState<ConnectedAccounts>({});
  const isGithubConnected =
    searchParams.get("github") === "connected" || sessionGithubConnected || Boolean(savedConnections.github?.connected);
  const isLinkedinConnected =
    searchParams.get("linkedin") === "connected" || sessionLinkedinConnected || Boolean(savedConnections.linkedin?.connected);
  const currentStep = onboardingSteps[currentStepIndex];
  const platforms = onboardingPlatforms.map((platform) => ({
    ...platform,
    status:
      (platform.name === "GitHub" && isGithubConnected) ||
      (platform.name === "LinkedIn" && isLinkedinConnected)
        ? "connected"
        : platform.status,
  }));

  useEffect(() => {
    const platformsToLoad = [
      { key: "github", endpoint: "/api/auth/github/status", connected: sessionGithubConnected },
      { key: "linkedin", endpoint: "/api/auth/linkedin/status", connected: sessionLinkedinConnected },
    ].filter((platform) => !platform.connected);

    if (platformsToLoad.length === 0) {
      return;
    }

    let isMounted = true;

    async function loadConnectionStatuses() {
      const nextConnections: ConnectedAccounts = {
        github: sessionGithub || null,
        linkedin: sessionLinkedin || null,
      };
      let foundDatabaseConnection = false;

      for (const platform of platformsToLoad) {
        try {
          const response = await fetch(platform.endpoint, { cache: "no-store" });

          if (!response.ok) {
            continue;
          }

          const data = (await response.json()) as PlatformConnection;

          if (data.connected) {
            nextConnections[platform.key as keyof ConnectedAccounts] = {
              connected: true,
              username: data.username || null,
              connected_at: data.connected_at || null,
            };
            foundDatabaseConnection = true;
          }
        } catch (error) {
          console.error(`Unable to load ${platform.key} connection status:`, error);
        }
      }

      if (!isMounted || !foundDatabaseConnection) {
        return;
      }

      setSavedConnections(nextConnections);
      await update({ connected_accounts: nextConnections });
    }

    void loadConnectionStatuses();

    return () => {
      isMounted = false;
    };
  }, [sessionGithub, sessionGithubConnected, sessionLinkedin, sessionLinkedinConnected, update]);

  return (
    <main className="min-h-screen bg-[#f8fafc] px-6 py-8 text-slate-950">
      <div className="mx-auto min-h-[calc(100vh-4rem)] max-w-7xl rounded-xl border border-slate-200 bg-white/80 shadow-sm">
        <div className="mx-auto flex w-full max-w-[680px] flex-col items-center px-6 py-6 sm:py-8">
          <h1 className="text-xl font-bold tracking-tight">AutoPilot Onboarding</h1>
          <section className="mt-6 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="px-6 py-8">
              <div className="text-center">
                <h2 className="text-base font-bold">{currentStep.title}</h2>
                <p className="mt-2 text-sm text-slate-500">{currentStep.description}</p>
              </div>

              <PlatformGrid platforms={platforms} />
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-5">
              <button
                type="button"
                disabled
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>




              <Link
        href={`/dashboard`}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-[#4338ca] px-7 text-sm font-bold text-white transition hover:bg-[#3730a3]"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>

          <p className="mt-6 text-xs text-slate-500">
            Need help setting up?{" "}
            <a href="mailto:budhathokikushal170@gmail.com" className="font-medium text-[#4338ca] hover:text-[#3730a3]">
              Contact our support team
            </a>
          </p>
        </div>
      </div>
    </main>
  );
};

const OnboardingPage = () => (
  <Suspense fallback={null}>
    <OnboardingContent />
  </Suspense>
);

export default OnboardingPage;
