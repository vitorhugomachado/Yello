import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de privacidade",
  description: "Como o Yello cuida dos seus dados e dos contatos recebidos.",
};

export default function Page() {
  return (
    <main className="wrap narrow legal">
      <Link className="btn quiet" href="/">
        Voltar ao início
      </Link>
      <span className="eyebrow">Yello</span>
      <h1>Política de privacidade</h1>
      <p className="muted">Última atualização: outubro de 2026.</p>
      <p>
        Esta política explica quais dados o Yello guarda, por quê e como você
        pode acessar ou excluir tudo. Ela vale para corretores com conta e para
        quem visita uma página pública.
      </p>
      <h2>O que guardamos</h2>
      <ul>
        <li>
          <strong>Conta:</strong> e-mail, senha protegida por hash e data de
          criação.
        </li>
        <li>
          <strong>Perfil e imóveis:</strong> nome, bio, cidade, região, CRECI,
          WhatsApp, redes, tema, fotos e dados dos anúncios que você cadastrar.
        </li>
        <li>
          <strong>Contatos:</strong> nome, WhatsApp, mensagem e imóvel de
          interesse enviados pelo formulário público.
        </li>
        <li>
          <strong>Uso:</strong> visitas à página, visualizações de imóveis,
          cliques no WhatsApp e compartilhamentos, sem IP e sem cookie de
          publicidade.
        </li>
      </ul>
      <h2>Para que usamos</h2>
      <p>
        Usamos os dados para criar sua página, exibir seus imóveis, entregar os
        contatos recebidos, medir o interesse de forma agregada, proteger o
        serviço contra abuso e cumprir obrigações legais. Não vendemos dados
        pessoais.
      </p>
      <h2>Cookies e armazenamento local</h2>
      <p>
        Usamos um cookie essencial de sessão para manter você conectado. Os
        favoritos da página pública ficam no armazenamento local do navegador,
        não no servidor. Não usamos cookies de anúncios nem rastreadores de
        terceiros.
      </p>
      <h2>Compartilhamento</h2>
      <p>
        A infraestrutura usa Supabase (banco, autenticação e arquivos) e o
        provedor de hospedagem do site. Ao clicar em WhatsApp, você sai do Yello
        e passa a usar um serviço do Meta, com as regras dele. Podemos divulgar
        dados se formos obrigados por lei.
      </p>
      <h2>Seus direitos</h2>
      <p>
        Você pode baixar uma cópia dos seus dados e excluir a conta em{" "}
        <Link href="/painel/conta">Minha conta</Link>. A exclusão remove perfil,
        imóveis, fotos e contatos. Para corrigir algo ou tirar dúvidas, escreva
        para{" "}
        <a href="mailto:privacidade@yello.com.br">privacidade@yello.com.br</a>.
      </p>
      <h2>Segurança e retenção</h2>
      <p>
        O acesso é protegido por senha e sessão. Mantemos os dados enquanto a
        conta existir; após a exclusão, eles são removidos, ressalvados os
        registros exigidos por lei. Contatos recebidos ficam com o corretor
        responsável pela página.
      </p>
      <p>
        Veja também os <Link href="/termos">Termos de uso</Link>.
      </p>
    </main>
  );
}
