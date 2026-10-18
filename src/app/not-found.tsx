import Link from "next/link";
export default function NotFound() {
  return (
    <main className="wrap auth panel">
      <h1>Este endereço não foi encontrado.</h1>
      <p>A página ou o imóvel pode não estar disponível.</p>
      <Link className="btn primary" href="/">
        Voltar ao início
      </Link>
    </main>
  );
}
