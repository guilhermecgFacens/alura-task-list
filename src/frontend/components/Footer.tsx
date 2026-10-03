"use client";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="px-6 py-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
      © {year} Tasks
    </footer>
  );
}
