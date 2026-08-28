/**
 * Renders a schema.org JSON-LD block. Placement doesn't matter to Google —
 * it doesn't need to be in <head> — so this drops straight into a page's
 * JSX tree wherever's convenient.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
