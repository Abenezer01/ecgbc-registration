import Link from "next/link";
import { Button } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-center px-6">
      {/* Large number */}
      <p className="text-[120px] font-black leading-none text-zinc-200 dark:text-zinc-800 select-none">
        404
      </p>
      <h1 className="mt-2 text-xl font-semibold text-zinc-900 dark:text-white">
        Page not found
      </h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 max-w-xs">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="mt-6">
        <Button asChild>
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
