/** Shared GitHub mark — used anywhere a small square GitHub badge is needed
 * (hero trust bar, automation illustration) so the path data lives once. */
export default function GitHubMark({ className = "h-full w-full" }: { className?: string } = {}) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 44 44">
      <rect width="44" height="44" rx="12" fill="#24292F" />
      <path
        fill="#FFFFFF"
        d="M22 8.8c-7.4 0-13.4 6-13.4 13.4 0 5.9 3.8 10.9 9.2 12.7.7.1.9-.3.9-.6v-2.4c-3.7.8-4.5-1.6-4.5-1.6-.6-1.5-1.5-1.9-1.5-1.9-1.2-.8.1-.8.1-.8 1.3.1 2 1.4 2 1.4 1.2 2 3 1.4 3.8 1.1.1-.9.5-1.4.8-1.8-3-.3-6.1-1.5-6.1-6.6 0-1.5.5-2.6 1.4-3.6-.1-.3-.6-1.7.1-3.5 0 0 1.1-.4 3.7 1.4 1.1-.3 2.2-.4 3.4-.4s2.3.1 3.4.4c2.6-1.8 3.7-1.4 3.7-1.4.7 1.8.2 3.2.1 3.5.9 1 1.4 2.1 1.4 3.6 0 5.1-3.1 6.3-6.1 6.6.5.4.9 1.2.9 2.5v3.6c0 .4.2.8.9.6a13.4 13.4 0 0 0 9.2-12.7c0-7.5-6-13.5-13.4-13.5Z"
      />
    </svg>
  );
}
