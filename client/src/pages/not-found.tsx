import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center flex-col gap-4">
      <div className="text-6xl font-bold text-muted-foreground font-mono">404</div>
      <p className="text-muted-foreground">Page not found</p>
      <Link href="/">
        <a className="text-primary hover:underline text-sm">← Back to Dashboard</a>
      </Link>
    </div>
  );
}
