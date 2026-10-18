"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="wrap auth panel">
      <h1>Não conseguimos carregar esta página.</h1>
      <p>Verifique sua conexão e tente novamente.</p>
      <button className="btn primary" onClick={reset}>
        Tentar novamente
      </button>
    </main>
  );
}
