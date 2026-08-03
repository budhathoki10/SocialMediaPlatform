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
      "Instagram requires a Creator or Business account to with AutoPilot to publish posts. Personal accounts are not supported by this application.",
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
}) => {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <ModalBackdrop className="fixed inset-0 z-50 bg-slate-900/10 backdrop-blur-[2px] sm:grid sm:place-items-center sm:p-4">
      <ModalPanel
        role="dialog"
        aria-modal="true"
        aria-labelledby="instagram-agreement-title"
        className="relative flex h-full w-full flex-col overflow-hidden bg-white sm:h-auto sm:max-h-[85vh] sm:max-w-[560px] sm:rounded-panel sm:border sm:border-slate-200 sm:shadow-panel"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-6 py-5 sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-control bg-primary-tint text-primary">
              <FileText className="h-4 w-4" />
            </span>
            <div className="min-w-0">
             
              <h2 id="instagram-agreement-title" className="text-base font-bold leading-snug text-slate-950">
                Instagram Connection Agreement
              </h2>
            </div>
          </div>
          <PressableButton
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </PressableButton>
        </div>

        <article className="min-h-0 flex-1 overflow-y-auto border-y border-slate-200/80 bg-[#fbfaf6] px-6 py-6 sm:px-8">
          <p className="text-sm leading-7 text-slate-700 text-justify">
            To publish content through AutoPilot, Instagram requires confirmation that your account meets
            Meta&apos;s publishing requirements.
          </p>

          <div className="mt-6 space-y-6 text-sm leading-7 text-slate-700">
            {instagramPrerequisites.map((item, index) => (
              <section key={item.title} className={index > 0 ? "border-t border-dashed border-slate-300 pt-6" : ""}>
                <h3 className="text-sm font-bold text-slate-950">
                  {index + 1}. {item.title}
                </h3>
                <p className="mt-2 text-justify">{item.description}</p>
              </section>
            ))}
          </div>
        </article>

        <div className="shrink-0 border-t border-slate-100 px-6 py-5 sm:px-8">
          <label className="flex cursor-pointer items-start gap-2.5">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(event) => onAgreeChange(event.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 accent-primary"
            />
            <span className="text-sm font-medium leading-5 text-slate-700">
              I have read and agree to the Instagram Connection Agreement and Meta publishing requirements.
            </span>
          </label>

          <div className="mt-4 flex justify-end">
            <PressableButton
              type="button"
              disabled={!agreed}
              onClick={onConnect}
              className="inline-flex h-10 items-center justify-center rounded-control bg-primary px-6 text-sm font-bold text-white shadow-card transition-all duration-200 hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
            >
              Accept & Continue
            </PressableButton>
          </div>
        </div>
      </ModalPanel>
    </ModalBackdrop>
  );
};

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
