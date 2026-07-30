"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";
import { CheckCircle2, GitCommitHorizontal, GitPullRequest, Send, Sparkles, Workflow } from "lucide-react";

import { ConnectorLine, GitHubMark, ICON_STROKE, STEP_TRANSITION, useStepCycle } from "./shared";

const VIEW_W = 380;
const VIEW_H = 140;
const NODE_X = [0, 95, 190, 285, 380];
const NODE_Y = 58;

function line(i: number) {
  return `M${NODE_X[i]},${NODE_Y} L${NODE_X[i + 1]},${NODE_Y}`;
}

const TONE_CLASSES = {
  slate: "bg-slate-100 text-slate-600",
  indigo: "bg-indigo-50 text-primary",
  amber: "bg-amber-50 text-amber-600",
  emerald: "bg-emerald-50 text-emerald-600",
  primary: "bg-primary text-white",
} as const;

// Steps: 0 repo only Β· 1 commit lands Β· 2 PR opens Β· 3 workflow runs Β·
// 4 checks pass Β· 5 AI drafts the post Β· 6 post publishes Β· 7 hold, then loop.
export default function GithubAutomationIllustration() {
  const { step, ref } = useStepCycle(8, 1300);

  const showCommit = step >= 1;
  const showPR = step >= 2;
  const showWorkflow = step >= 3;
  const workflowDone = step >= 4;
  const showPost = step >= 5;
  const published = step >= 6;

  return (
    <div ref={ref} className="flex h-full w-full flex-col items-center justify-center gap-4 bg-white p-6 sm:p-10">
      <div className="relative w-full max-w-lg" style={{ aspectRatio: `${VIEW_W} / ${VIEW_H}` }}>
        <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="absolute inset-0 h-full w-full text-slate-300">
          <ConnectorLine d={line(0)} draw={showCommit} />
          <ConnectorLine d={line(1)} draw={showPR} />
          <ConnectorLine d={line(2)} draw={showWorkflow} />
          <ConnectorLine d={line(3)} draw={showPost} />
        </svg>

        <div className="absolute inset-0 flex items-center justify-between">
          <Node label="your-repo">
            <GitHubMark className="h-11 w-11 rounded-lg" />
          </Node>

          <Node label="New commit" visible={showCommit}>
            <IconBadge tone="slate">
              <GitCommitHorizontal size={18} strokeWidth={ICON_STROKE} />
            </IconBadge>
          </Node>

          <Node label="Pull request" visible={showPR}>
            <IconBadge tone="indigo">
              <GitPullRequest size={18} strokeWidth={ICON_STROKE} />
            </IconBadge>
          </Node>

          <Node label={workflowDone ? "Checks passed" : "Running…"} visible={showWorkflow}>
            <IconBadge tone={workflowDone ? "emerald" : "amber"} pulsing={showWorkflow && !workflowDone}>
              {workflowDone ? (
                <CheckCircle2 size={18} strokeWidth={ICON_STROKE} />
              ) : (
                <Workflow size={18} strokeWidth={ICON_STROKE} className="animate-spin [animation-duration:1.6s]" />
              )}
            </IconBadge>
          </Node>

          <Node label={published ? "Published" : "Generating draft…"} visible={showPost}>
            <IconBadge tone={published ? "primary" : "amber"} pulsing={showPost && !published}>
              {published ? <Send size={18} strokeWidth={ICON_STROKE} /> : <Sparkles size={18} strokeWidth={ICON_STROKE} />}
            </IconBadge>
          </Node>
        </div>
      </div>
    </div>
  );
}

function Node({ children, label, visible = true }: { children: ReactNode; label: string; visible?: boolean }) {
  return (
    <motion.div
      className="flex flex-col items-center gap-2"
      animate={{ opacity: visible ? 1 : 0, scale: visible ? 1 : 0.7 }}
      transition={STEP_TRANSITION}
    >
      {children}
      <span className="whitespace-nowrap text-xs font-medium text-slate-400">{label}</span>
    </motion.div>
  );
}

function IconBadge({ tone, children, pulsing }: { tone: keyof typeof TONE_CLASSES; children: ReactNode; pulsing?: boolean }) {
  return (
    <div className="relative">
      {pulsing && (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-amber-400"
          animate={{ opacity: [0.2, 0.6, 0.2], scale: [1, 1.3, 1] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      <div className={`flex h-11 w-11 items-center justify-center rounded-full ${TONE_CLASSES[tone]}`}>{children}</div>
    </div>
  );
}
