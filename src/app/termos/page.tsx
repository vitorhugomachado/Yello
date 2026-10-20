import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de uso",
  description: "As regras simples para usar o Yello.",
};

export default function Page() {
  return (
    <main className="wrap narrow legal">
      <Link className="btn quiet" href="/">
        Voltar ao início
      </Link>
      <span className="eyebrow">Yello</span>
      <h1>Termos de uso</h1>
      <p className="muted">Última atualização: outubro de 2026.</p>
      <p>
        O Yello é uma ferramenta para corretores de imóveis criarem uma página
        pública, cadastrarem imóveis e receberem contatos. Ao criar uma conta,
        você concorda com estes termos.
      </p>
      <h2>Sua conta</h2>
      <p>
        Você é responsável pelas informações de acesso e por tudo o que publica.
        Mantenha seus dados corretos e não compartilhe sua senha. Podemos
        suspender contas que usem o serviço para spam, fraude ou conteúdo
        ilegal.
      </p>
      <h2>Conteúdo publicado</h2>
      <p>
        O perfil, as fotos e os imóveis continuam sendo seus. Você nos autoriza
        a exibir esse conteúdo na sua página pública e nos materiais de
        compartilhamento gerados por ela. Não publique fotos ou informações de
        terceiros sem autorização.
      </p>
      <h2>Contatos e imóveis</h2>
      <p>
        O Yello não intermedeia negociações, não garante a venda ou o aluguel e
        não verifica cada anúncio. A relação comercial é entre você e o cliente.
        Os contatos recebidos devem ser usados apenas para responder ao
        interesse demonstrado.
      </p>
      <h2>Disponibilidade e planos</h2>
      <p>
        Trabalhamos para manter o serviço disponível, mas ele pode passar por
        manutenção ou instabilidades. Nesta etapa o uso é gratuito e não há
        cobrança automática. Se planos pagos forem criados, avisaremos antes e
        você poderá decidir se continua.
      </p>
      <h2>Encerramento</h2>
      <p>
        Você pode excluir sua conta a qualquer momento em Minha conta. A
        exclusão remove o perfil, os imóveis, as fotos e os contatos recebidos.
        Alguns registros podem ser mantidos pelo prazo necessário para cumprir
        obrigações legais.
      </p>
      <h2>Contato</h2>
      <p>
        Dúvidas sobre estes termos:{" "}
        <a href="mailto:contato@yello.com.br">contato@yello.com.br</a>. Veja
        também a <Link href="/privacidade">Política de privacidade</Link>.
      </p>
    </main>
  );
}
