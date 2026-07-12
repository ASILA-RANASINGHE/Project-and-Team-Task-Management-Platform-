export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl items-center px-6 py-16">
      <section className="rounded-3xl border border-white/10 bg-white/8 p-10 shadow-2xl shadow-black/30 backdrop-blur">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-sky-300">
          Project Frontend
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Next.js 14 app router with TypeScript and Tailwind CSS.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
          This frontend is ready for authenticated API calls through the shared axios client in
          lib/api.ts.
        </p>
      </section>
    </main>
  );
}
