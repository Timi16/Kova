import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <p className="text-sm text-muted-foreground">
        The page you requested does not exist.
      </p>
      <Link
        href="/"
        className="rounded-md border border-border px-4 py-2 text-sm transition hover:bg-muted"
      >
        Return home
      </Link>
    </main>
  );
}
