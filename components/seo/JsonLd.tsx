// Renders a JSON-LD <script> tag. Inputs are always static, server-defined
// schema objects (never raw user input), so JSON.stringify output here
// carries no injection risk.
export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
