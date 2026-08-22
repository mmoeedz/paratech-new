export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="flex min-h-[60vh] items-center justify-center bg-obsidian"
    >
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-copper motion-reduce:animate-none" />
    </div>
  );
}
