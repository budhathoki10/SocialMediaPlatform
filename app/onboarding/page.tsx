"use client";

import { Suspense, useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { AnimatePresence } from "motion/react";
import { ArrowLeft, ArrowRight, CheckCircle2, FileText, X } from "lucide-react";

import AuthCardEntrance from "@/components/motion/AuthCardEntrance";
import { ModalBackdrop, ModalPanel } from "@/components/motion/Modal";
import PressableButton from "@/components/motion/PressableButton";
import PressableLink from "@/components/motion/PressableLink";

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
  instagram?: PlatformConnection | null;
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
    src="/landing/insta.png"
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
    window.location.assign("/api/auth/instagram/connect");
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

const instagramPrerequisites = [
  {
    title: "Creator or Business account",
    description:
      "Instagram requires a Creator or Business account to allow third-party apps like AutoPilot to publish posts. Personal accounts are not supported by Instagram's API.",
  },
  {
    title: "Linked Facebook Page",
    description:
      "You need a Facebook Page linked to your Instagram account. The page can be empty; it just needs to exist and be connected to Instagram.",
  },
  {
    title: "Meta account setup",
    description:
      "Switch your Instagram account in Settings > Account type and tools, then link a Facebook Page from Instagram Settings > Linked Accounts > Facebook.",
  },
];

const PlatformGrid = ({
  platforms,
  onPlatformClick,
}: {
  platforms: OnboardingPlatform[];
  onPlatformClick: (name: string) => void;
}) => {
  return (
    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      {platforms.map(({ name, status, Logo }) => {
        const isConnected = status === "connected";
        const isComingSoon = name === "Twitter" || name === "Facebook" || name === "Gmail";

        return (
          <PressableButton
            key={name}
            type="button"
            onClick={() => !isComingSoon && onPlatformClick(name)}
            disabled={isConnected || isComingSoon}
            className={`relative flex min-h-28 flex-col items-center justify-center rounded-card border px-4 py-4 text-center transition disabled:cursor-default ${
              isConnected
                ? "border-slate-200 bg-slate-50 opacity-60 shadow-card"
                : isComingSoon
                  ? "border-slate-200 bg-slate-50 opacity-70"
                  : "border-slate-200 bg-white hover:cursor-pointer hover:border-primary hover:bg-primary-tint/40"
            }`}
          >
            {isComingSoon && (
              <span className="absolute right-2 top-2 rounded-full bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-600">
                Soon
              </span>
            )}
            <span className="grid h-14 w-14 place-items-center rounded-control bg-slate-50">
              <Logo />
            </span>
            <span className="mt-4 text-sm font-semibold text-slate-950">{name}</span>
            <span
              className={`mt-2 inline-flex items-center gap-1 text-xs font-bold ${
                isConnected ? "text-emerald-600" : isComingSoon ? "text-slate-400" : "text-primary"
              }`}
            >
              {isConnected && <CheckCircle2 className="h-3.5 w-3.5" />}
              {isConnected ? "Connected" : isComingSoon ? "Coming Soon" : "Connect"}
            </span>
          </PressableButton>
        );
      })}
    </div>
  );
};

const InstagramPrerequisiteDialog = ({
  agreed,
  onAgreeChange,
  onClose,
  onConnect,
}: {
  agreed: boolean;
  onAgreeChange: (checked: boolean) => void;
  onClose: () => void;
  onConnect: () => void;
}) => (
  <ModalBackdrop className="fixed inset-0 z-50 grid place-items-center bg-slate-900/10 p-4 backdrop-blur-[2px]">
    <ModalPanel className="relative flex max-h-[90vh] w-full max-w-[520px] flex-col overflow-hidden rounded-panel border border-slate-200 bg-white shadow-panel">
      <div className="px-7 pb-5 pt-7 text-center">
        <PressableButton
          type="button"
          onClick={onClose}
          aria-label="Close Instagram prerequisites"
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-4 w-4" />
        </PressableButton>

        <div className="mx-auto grid h-12 w-12 place-items-center rounded-control bg-primary-tint text-primary">
          <FileText className="h-6 w-6" />
        </div>

        <div className="mt-5 flex items-center gap-4">
          <span className="h-px flex-1 bg-slate-200" />
          <p className="text-xs font-bold text-slate-800">Instagram Terms</p>
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <p className="mx-auto mt-3 max-w-sm text-xs leading-5 text-slate-500">
          Review these requirements before allowing AutoPilot to connect and publish with Instagram.
        </p>
      </div>

      <div className="min-h-0 flex-1 px-7 pb-5">
        <article className="max-h-[44vh] overflow-y-auto px-1 py-2">
          <div className="text-center">
            <p className="text-xs font-bold text-primary">Required by Meta</p>
            <h2 className="mt-2 text-base font-bold text-slate-900">
              Instagram Publishing Prerequisites
            </h2>
          </div>

          <div className="mt-5 space-y-5 text-xs leading-6 text-slate-600">
            <p>
              To connect an Instagram account to AutoPilot, the account owner must confirm that the Instagram account
              satisfies Meta platform requirements for third-party publishing access.
            </p>

            {instagramPrerequisites.map((item, index) => (
              <section key={item.title} className="border-t border-slate-200/80 pt-4">
                <p className="text-xs font-semibold text-slate-400">Section {index + 1}</p>
                <h3 className="mt-1 text-sm font-bold text-slate-950">{item.title}</h3>
                <p className="mt-2">{item.description}</p>
              </section>
            ))}

            <section className="border-t border-slate-200/80 pt-4">
              <p className="text-xs font-semibold text-slate-400">Acknowledgement</p>
              <p className="mt-2">
                By continuing, you acknowledge that your Instagram account is eligible for Meta API access and that
                AutoPilot can only connect accounts that meet these requirements.
              </p>
            </section>
          </div>
        </article>

        <label className="mt-4 flex cursor-pointer items-start gap-3 border-t border-slate-100 pt-4">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(event) => onAgreeChange(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-primary"
          />
          <span className="text-xs font-semibold leading-5 text-slate-700">
            I have read and agree. My Instagram account is Creator or Business, and it is linked to a Facebook Page.
          </span>
        </label>
      </div>

      <div className="flex items-center justify-center gap-4 border-t border-slate-100 px-7 py-5">
        <PressableButton
          type="button"
          onClick={onClose}
          className="inline-flex h-10 min-w-32 items-center justify-center rounded-control border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
        >
          Decline
        </PressableButton>
        <PressableButton
          type="button"
          disabled={!agreed}
          onClick={onConnect}
          className="inline-flex h-10 min-w-32 items-center justify-center gap-2 rounded-control bg-slate-800 px-5 text-sm font-bold text-white shadow-card transition hover:bg-slate-950 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
        >
          Accept
        </PressableButton>
      </div>
    </ModalPanel>
  </ModalBackdrop>
);

const OnboardingContent = () => {
  const { data: session, update } = useSession();
  const appSession = session as AppSession | null;
  const sessionConnections = appSession?.connected_accounts;
  const [savedConnections, setSavedConnections] = useState<ConnectedAccounts | null>(null);
  const [showInstagramPrerequisites, setShowInstagramPrerequisites] = useState(false);
  const [instagramPrerequisitesAgreed, setInstagramPrerequisitesAgreed] = useState(false);
  const currentConnections = savedConnections || sessionConnections || {};
  const isGithubConnected = Boolean(currentConnections.github?.connected);
  const isLinkedinConnected = Boolean(currentConnections.linkedin?.connected);
  const isInstagramConnected = Boolean(currentConnections.instagram?.connected);
  const currentStep = onboardingSteps[currentStepIndex];
  const platforms = onboardingPlatforms.map((platform) => ({
    ...platform,
    status:
      (platform.name === "GitHub" && isGithubConnected) ||
      (platform.name === "LinkedIn" && isLinkedinConnected) ||
      (platform.name === "Instagram" && isInstagramConnected)
        ? "connected"
        : platform.status,
  }));
  const handleOnboardingPlatformClick = (platformName: string) => {
    if (platformName === "Instagram") {
      setInstagramPrerequisitesAgreed(false);
      setShowInstagramPrerequisites(true);
      return;
    }

    void handlePlatformClick(platformName);
  };

  useEffect(() => {
    const platformsToLoad = [
      { key: "github", endpoint: "/api/auth/github/status" },
      { key: "linkedin", endpoint: "/api/auth/linkedin/status" },
      { key: "instagram", endpoint: "/api/auth/instagram/status" },
    ];

    let isMounted = true;

    async function loadConnectionStatuses() {
      const nextConnections: ConnectedAccounts = {
        github: null,
        linkedin: null,
        instagram: null,
      };

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
          }
        } catch (error) {
          console.error(`Unable to load ${platform.key} connection status:`, error);
        }
      }

      if (!isMounted) {
        return;
      }

      setSavedConnections(nextConnections);
      await update({ connected_accounts: nextConnections });
    }

    void loadConnectionStatuses();

    return () => {
      isMounted = false;
    };
  }, [
    update,
  ]);

  return (
    <main className="min-h-screen bg-[#f6f8fb] px-6 py-8 text-slate-950">
      <AuthCardEntrance
        as="div"
        className={`mx-auto min-h-[calc(100vh-4rem)] max-w-7xl rounded-panel border border-slate-200 bg-white/80 shadow-panel transition duration-300 ${
          showInstagramPrerequisites ? "pointer-events-none select-none" : ""
        }`}
      >
        <div className="mx-auto flex w-full max-w-[680px] flex-col items-center px-6 py-6 sm:py-8">
          <h1 className="text-xl font-bold tracking-tight">AutoPilot Onboarding</h1>
          <section className="mt-6 w-full overflow-hidden rounded-card border border-slate-200 bg-white shadow-card">
            <div className="px-6 py-8">
              <div className="text-center">
                <h2 className="text-base font-bold">{currentStep.title}</h2>
                <p className="mt-2 text-sm text-slate-500">{currentStep.description}</p>
              </div>

              <PlatformGrid platforms={platforms} onPlatformClick={handleOnboardingPlatformClick} />
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




              <PressableLink
                href="/dashboard"
                className="inline-flex h-10 items-center gap-2 rounded-control bg-primary px-7 text-sm font-bold text-white transition hover:bg-primary-hover"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </PressableLink>
            </div>
          </section>

          <p className="mt-6 text-xs text-slate-500">
            Need help setting up?{" "}
            <a href="mailto:budhathokikushal170@gmail.com" className="font-medium text-primary hover:text-primary-hover">
              Contact our support team
            </a>
          </p>
        </div>
      </AuthCardEntrance>
      <AnimatePresence>
        {showInstagramPrerequisites && (
          <InstagramPrerequisiteDialog
            agreed={instagramPrerequisitesAgreed}
            onAgreeChange={setInstagramPrerequisitesAgreed}
            onClose={() => setShowInstagramPrerequisites(false)}
            onConnect={clickedInstagram}
          />
        )}
      </AnimatePresence>
    </main>
  );
};

const OnboardingPage = () => (
  <Suspense fallback={null}>
    <OnboardingContent />
  </Suspense>
);

export default OnboardingPage;
