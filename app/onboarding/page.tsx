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
  status: "connected" | "available" | "coming-soon";
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

const InstagramLogo = () => (
  <Image
    src="/landing/insta.png"
    alt=""
    width={44}
    height={44}
    className="h-11 w-11 object-contain"
  />
);

const GitHubLogo = () => (
  <Image src="/landing/github.svg" alt="" width={44} height={44} className="h-11 w-11 object-contain" />
);

const WhatsAppLogo = () => (
  <Image
    src="/landing/whatsapps.png"
    alt=""
    width={44}
    height={44}
    className="h-11 w-11 object-contain"
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
    name: "WhatsApp",
    status: "coming-soon",
    Logo: WhatsAppLogo,
  },
];

const instagramPrerequisites = [
  {
    title: "Creator or Business account",
    description:
      "Instagram requires a Creator or Business account to allow third-party apps like AutoPilot to publish posts. Personal accounts are not supported by Instagram's API.",
  },
  {
    title: "Meta account setup",
    description:
      'Switch your Instagram account to a Professional account in Settings > Account type and tools, then select "Business."',
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
    <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4">
      {platforms.map(({ name, status, Logo }) => {
        const isConnected = status === "connected";
        const isComingSoon = status === "coming-soon";

        return (
          <PressableButton
            key={name}
            type="button"
            onClick={() => onPlatformClick(name)}
            disabled={isConnected || isComingSoon}
            className={`relative flex min-h-28 flex-col items-center justify-center rounded-card border px-3 py-3 text-center transition disabled:cursor-default sm:px-4 sm:py-4 ${
              isConnected || isComingSoon
                ? "border-slate-200 bg-slate-50 opacity-60 shadow-card"
                : "border-slate-200 bg-white hover:cursor-pointer hover:border-primary hover:bg-primary-tint/40"
            }`}
          >
            <span className="grid h-12 w-12 place-items-center rounded-control bg-slate-50 sm:h-14 sm:w-14">
              <Logo />
            </span>
            <span className="mt-4 text-sm font-semibold text-slate-950">{name}</span>
            <span
              className={`mt-2 inline-flex items-center gap-1 text-xs font-bold ${
                isConnected ? "text-emerald-600" : isComingSoon ? "text-amber-600" : "text-primary"
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

        <div className="mt-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">
            AutoPilot Platform Terms
          </p>
          <h2 className="mt-2 font-serif text-lg font-bold tracking-tight text-slate-900">
            Instagram Connection Agreement
          </h2>
          <div className="mx-auto mt-3 h-px w-16 bg-slate-300" />
        </div>

        <p className="mx-auto mt-4 max-w-sm text-xs leading-5 text-slate-500">
          Review these requirements before allowing AutoPilot to connect and publish with Instagram.
        </p>
      </div>

      <article className="min-h-0 flex-1 overflow-y-auto border-y border-slate-200/80 bg-[#fbfaf6] px-7 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
        <div className="text-center">
          <p className="font-serif text-xs font-bold uppercase tracking-wide text-primary">Required by Meta</p>
          <h3 className="mt-2 font-serif text-base font-bold text-slate-900">
            Instagram Publishing Prerequisites
          </h3>
        </div>

        <div className="mt-5 space-y-5 font-serif text-[13px] leading-8 text-slate-700">
          <p className="text-justify">
            To connect an Instagram account to AutoPilot, the account owner must confirm that the Instagram account
            satisfies Meta platform requirements for third-party publishing access.
          </p>

          {instagramPrerequisites.map((item, index) => (
            <section key={item.title} className="border-t border-dashed border-slate-300 pt-4">
              <h4 className="text-sm font-bold text-slate-950">
                {index + 1}. {item.title}
              </h4>
              <p className="mt-2 text-justify">{item.description}</p>
            </section>
          ))}

          <section className="border-t border-dashed border-slate-300 pt-4">
            <h4 className="text-sm font-bold text-slate-950">
              {instagramPrerequisites.length + 1}. Acknowledgement
            </h4>
            <p className="mt-2 text-justify">
              By continuing, you acknowledge that your Instagram account is eligible for Meta API access and that
              AutoPilot can only connect accounts that meet these requirements.
            </p>
          </section>
        </div>

        <div className="mt-6 border-t-2 border-dashed border-slate-300 pt-5">
          <p className="font-serif text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
            Signature
          </p>
          <label className="mt-3 flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(event) => onAgreeChange(event.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-400 accent-primary"
            />
            <span className="font-serif text-[13px] leading-6 text-slate-800">
              I have read and agree. My Instagram account is a Creator or Business account.
            </span>
          </label>
          <p className="mt-3 font-serif text-[10px] italic text-slate-400">
            Checking this box constitutes your electronic signature and acceptance of these terms.
          </p>
        </div>
      </article>

      <div className="flex items-center justify-center gap-4 px-7 py-5">
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

      await Promise.all(
        platformsToLoad.map(async (platform) => {
          try {
            const response = await fetch(platform.endpoint, { cache: "no-store" });

            if (!response.ok) {
              return;
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
        }),
      );

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
