"use client";

import type { ReactNode } from "react";
import Link from "next/link";
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
  <svg aria-hidden="true" className="h-11 w-11" viewBox="0 0 44 44">
    <rect width="44" height="44" rx="12" fill="#0A66C2" />
    <circle cx="14" cy="14" r="3.3" fill="#FFFFFF" />
    <path
      fill="#FFFFFF"
      d="M11.3 18.6h5.4v14.2h-5.4zM20.3 18.6h5.2v2c.9-1.3 2.5-2.3 5-2.3 3.7 0 6.2 2.4 6.2 7.3v7.2h-5.4v-6.7c0-2.1-.8-3.3-2.5-3.3-1.9 0-3 1.3-3 3.3v6.7h-5.5z"
    />
  </svg>
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
  <svg aria-hidden="true" className="h-11 w-11" viewBox="0 0 44 44">
    <defs>
      <linearGradient id="instagramGradient" x1="6" x2="38" y1="38" y2="6" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FEDA75" />
        <stop offset="0.32" stopColor="#FA7E1E" />
        <stop offset="0.58" stopColor="#D62976" />
        <stop offset="0.78" stopColor="#962FBF" />
        <stop offset="1" stopColor="#4F5BD5" />
      </linearGradient>
    </defs>
    <rect width="44" height="44" rx="12" fill="url(#instagramGradient)" />
    <rect x="12" y="12" width="20" height="20" rx="6" fill="none" stroke="#FFFFFF" strokeWidth="3" />
    <circle cx="22" cy="22" r="5" fill="none" stroke="#FFFFFF" strokeWidth="3" />
    <circle cx="29" cy="15.4" r="1.8" fill="#FFFFFF" />
  </svg>
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

const MediumLogo = () => (
  <svg aria-hidden="true" className="h-11 w-11" viewBox="0 0 44 44">
    <rect width="44" height="44" rx="12" fill="#00AB6C" />
    <circle cx="16.5" cy="22" r="8.5" fill="#FFFFFF" />
    <ellipse cx="28" cy="22" rx="4.5" ry="8.1" fill="#FFFFFF" opacity="0.88" />
    <ellipse cx="35" cy="22" rx="1.9" ry="7.2" fill="#FFFFFF" opacity="0.72" />
  </svg>
);

const ThreadsLogo = () => (
  <svg aria-hidden="true" className="h-11 w-11" viewBox="0 0 44 44">
    <rect width="44" height="44" rx="12" fill="#111111" />
    <path
      fill="none"
      stroke="#FFFFFF"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="3.2"
      d="M28.2 18.2c-.8-3.1-3-4.9-6.4-4.9-4.5 0-7.5 3.5-7.5 8.8 0 5.5 3.1 8.9 8 8.9 4.2 0 7.2-2.2 7.2-5.4 0-2.7-2.2-4.6-5.7-4.6h-2.3c-2.4 0-3.8 1.1-3.8 2.8s1.4 2.7 3.5 2.7c2.7 0 4.6-1.7 4.6-4.8 0-1.1-.2-2.1-.5-3"
    />
    <path
      fill="none"
      stroke="#FFFFFF"
      strokeLinecap="round"
      strokeWidth="3.2"
      d="M29.8 16.5c2.8.5 5 2.4 5.6 5.4"
    />
  </svg>
);

const clickedLinkedin=()=>{
  alert("LinkedIn clicked");
}
const clickedInstagram=()=>{
  alert("Instagram clicked");
}


const clickedGitHub=()=>{
  alert("GitHub clicked");
}

const clickedMedium=()=>{
  alert("Medium clicked");
}

const clickedThreads=()=>{
  alert("Threads clicked");
}

const clickedTwitter=()=>{
  alert("Twitter clicked");
}


const handlePlatformClick = (SocialMedia: string) => {
  switch (SocialMedia) {
    case "LinkedIn":
      clickedLinkedin();
      break;
    case "Instagram":
      clickedInstagram();
      break;
    case "GitHub":
      clickedGitHub();
      break;
    case "Medium":
      clickedMedium();
      break;
    case "Threads":
      clickedThreads();
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
    name: "Medium",
    status: "available",
    Logo: MediumLogo,
  },
  {
    name: "Threads",
    status: "available",
    Logo: ThreadsLogo,
  },
];

const ProgressBar = ({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="mt-5 h-1.5 w-full max-w-[560px] overflow-hidden rounded-full bg-slate-100">
      <div className="h-full rounded-full bg-[#4338ca]" style={{ width: `${progress}%` }} />
    </div>
  );
};

const PlatformGrid = ({ platforms }: { platforms: OnboardingPlatform[] }) => {
  return (
    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      {platforms.map(({ name, status, Logo }) => {
        const isConnected = status === "connected";

        return (
          <button
            key={name}
            type="button"
            onClick={() => handlePlatformClick(name)}
            className={`flex min-h-28 flex-col items-center justify-center rounded-lg border px-4 py-4 text-center hover:cursor-pointer  transition ${
              isConnected
                ? "border-indigo-100 bg-indigo-50/35 shadow-sm"
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

const OnboardingPage = () => {
  const currentStep = onboardingSteps[currentStepIndex];

  return (
    <main className="min-h-screen bg-[#f8fafc] px-6 py-8 text-slate-950">
      <div className="mx-auto min-h-[calc(100vh-4rem)] max-w-7xl rounded-xl border border-slate-200 bg-white/80 shadow-sm">
        <div className="mx-auto flex w-full max-w-[680px] flex-col items-center px-6 py-6 sm:py-8">
          <h1 className="text-xl font-bold tracking-tight">AutoPilot Onboarding</h1>

          <ProgressBar currentStep={currentStepIndex + 1} totalSteps={onboardingSteps.length} />

          <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
            Step {currentStepIndex + 1} of {onboardingSteps.length}
          </p>

          <section className="mt-6 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="px-6 py-8">
              <div className="text-center">
                <h2 className="text-base font-bold">{currentStep.title}</h2>
                <p className="mt-2 text-sm text-slate-500">{currentStep.description}</p>
              </div>

              <PlatformGrid platforms={onboardingPlatforms} />
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

export default OnboardingPage;
