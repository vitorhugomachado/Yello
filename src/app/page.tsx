import Link from "next/link";
import {
  ArrowUpRight,
  ArrowDown,
  Link2,
  Images,
  MessageCircle,
  Check,
  Plus,
  MapPin,
  Heart,
  House,
} from "lucide-react";
import { SiInstagram, SiWhatsapp } from "@icons-pack/react-simple-icons";
import { Brand } from "@/components/ui";
import { StartLink } from "@/components/start-link";

export default function Home() {
  return (
    <div className="yello-landing">
      <a className="skip-link" href="#conteudo">
        Ir para o conteúdo
      </a>
      <div className="landing-shell">
        <section className="landing-hero" aria-labelledby="landing-title">
          <header className="landing-nav">
            <Brand />
            <nav aria-label="Navegação principal">
              <a href="#como-funciona">Como funciona</a>
              <a href="#sua-vitrine">Sua vitrine</a>
              <Link href="/login">
                Entrar <ArrowUpRight />
              </Link>
            </nav>
          </header>
          <main id="conteudo" className="hero-stage">
            <div className="hero-kicker">
              <span className="status-dot" /> PARA CORRETORES. PARA CONECTAR.
            </div>
            <h1 id="landing-title">
              Seus imóveis.
              <br />
              <span>Um único link.</span>
            </h1>
            <div className="hero-product">
              <span className="floating-label">
                <Link2 />
                Seu próximo endereço digital.
              </span>
              <Link
                className="phone-preview"
                href="/demo"
                aria-label="Explorar a vitrine demonstrativa da Yello"
              >
                <div aria-hidden="true">
                  <div className="phone-top">
                    <span>9:41</span>
                    <span className="phone-speaker" />
                    <span>● ▰</span>
                  </div>
                  <div className="phone-profile">
                    <img
                      className="phone-avatar"
                      src="https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=160&q=80"
                      alt=""
                    />
                    <strong>Marina Oliveira</strong>
                    <span>Florianópolis e região</span>
                    <div className="phone-socials">
                      <SiInstagram />
                      <SiWhatsapp />
                      <Link2 />
                    </div>
                  </div>
                  <div className="phone-tabs">
                    <span>Todos</span>
                    <span>Comprar</span>
                    <span>Alugar</span>
                  </div>
                  <div className="phone-property">
                    <img
                      src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=700&q=85"
                      alt=""
                    />
                    <span className="phone-tag">À venda</span>
                    <span className="phone-heart">
                      <Heart />
                    </span>
                    <div className="phone-property-copy">
                      <strong>R$ 890.000</strong>
                      <span>Um lugar para viver bem.</span>
                      <small>98 m² · 3 quartos · 2 vagas</small>
                    </div>
                  </div>
                  <div className="phone-contact">
                    <SiWhatsapp />
                    Falar no WhatsApp
                  </div>
                  <div className="phone-home" />
                </div>
              </Link>
              <div className="floating-photo" aria-hidden="true">
                <img
                  src="https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=500&q=80"
                  alt=""
                />
                <span>
                  <MapPin />
                  Seu próximo encontro.
                </span>
              </div>
              <span className="product-caption">
                Uma prévia da sua vitrine. Toque para explorar ↗
              </span>
            </div>
            <div className="hero-intro">
              <p>
                Seu portfólio merece
                <br />
                mais que um link perdido.
              </p>
              <span>
                Imóveis, fotos e seu contato.
                <br />
                Tudo junto. Do seu jeito.
              </span>
              <StartLink />
            </div>
            <div className="hero-aside">
              <span className="aside-number">
                01<span>link.</span>
              </span>
              <p>
                Na bio. No WhatsApp.
                <br />
                Na próxima conversa.
              </p>
              <Link href="/demo">
                Veja na prática <ArrowUpRight />
              </Link>
            </div>
          </main>
          <a
            href="#sua-vitrine"
            className="scroll-tab"
            aria-label="Conhecer os benefícios"
          >
            <ArrowDown />
          </a>
        </section>
        <section id="sua-vitrine" className="landing-story">
          <div className="section-overline">MENOS PASSOS. MAIS CONEXÕES.</div>
          <div className="story-heading">
            <h2>
              Você cuida dos encontros.
              <br />
              <span>A gente organiza o caminho.</span>
            </h2>
            <p>
              Uma página para apresentar seu trabalho, mostrar seus imóveis e
              começar boas conversas. Simples de atualizar. Fácil de
              compartilhar.
            </p>
          </div>
          <div className="benefit-grid">
            <article>
              <Images />
              <h3>Fotos que abrem portas.</h3>
              <p>
                Uma galeria para cada imóvel. Quem procura explora os detalhes
                no próprio ritmo.
              </p>
            </article>
            <article>
              <Link2 />
              <h3>Um link, muitas possibilidades.</h3>
              <p>
                Seu perfil, redes e imóveis no mesmo endereço. Pronto para estar
                onde você estiver.
              </p>
            </article>
            <article>
              <MessageCircle />
              <h3>A conversa continua com você.</h3>
              <p>
                O interesse chega ao seu WhatsApp com o título e o link do
                imóvel.
              </p>
            </article>
          </div>
        </section>
        <section id="como-funciona" className="landing-steps">
          <div className="steps-heading">
            <span className="section-overline">
              DO SEU JEITO, EM POUCOS PASSOS
            </span>
            <h2>
              Publicar pode
              <br />
              ser simples assim.
            </h2>
            <Link href="/cadastro" className="text-cta">
              Começar minha página <ArrowUpRight />
            </Link>
          </div>
          <ol>
            <li>
              <span>01</span>
              <div>
                <h3>Apresente-se.</h3>
                <p>Adicione sua foto, região, redes sociais e WhatsApp.</p>
              </div>
              <Plus />
            </li>
            <li>
              <span>02</span>
              <div>
                <h3>Abra sua vitrine.</h3>
                <p>Cadastre os imóveis, escolha as fotos e publique.</p>
              </div>
              <Plus />
            </li>
            <li>
              <span>03</span>
              <div>
                <h3>Coloque seu link no mundo.</h3>
                <p>Copie, compartilhe e deixe a conversa começar.</p>
              </div>
              <Check />
            </li>
          </ol>
        </section>
        <section className="landing-finale">
          <div>
            <House />
            <span className="section-overline">
              SEU TRABALHO MERECE ESSE ESPAÇO
            </span>
            <h2>
              Seu próximo
              <br />
              capítulo começa
              <br />
              com um link.
            </h2>
            <Link className="landing-cta dark" href="/cadastro">
              Criar meu link <ArrowUpRight />
            </Link>
            <p>Sem complicar o que pode ser simples.</p>
          </div>
          <img
            src="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85"
            alt="Ambiente amplo e iluminado, com jardim e mobiliário contemporâneo"
            loading="lazy"
          />
        </section>
        <section className="landing-faq" aria-labelledby="faq-title">
          <h2 id="faq-title">Antes de começar.</h2>
          <div>
            <details>
              <summary>O que é o meu link Yello?</summary>
              <p>
                É o endereço da sua página pública, com seu perfil e seus
                imóveis publicados. Você pode compartilhar esse endereço na bio
                e nas suas conversas.
              </p>
            </details>
            <details>
              <summary>Quem procura um imóvel precisa de conta?</summary>
              <p>
                Não. A vitrine é pública, e o contato vai direto para o WhatsApp
                que você configurou.
              </p>
            </details>
            <details>
              <summary>Posso atualizar os imóveis depois?</summary>
              <p>
                Sim. Pelo painel, você edita as informações e fotos, publica
                novos imóveis ou arquiva os que não estão disponíveis.
              </p>
            </details>
          </div>
        </section>
        <footer className="landing-footer">
          <Brand />
          <span>Seus imóveis. Um único link.</span>
          <Link href="/login">
            Já tenho uma conta <ArrowUpRight />
          </Link>
        </footer>
      </div>
    </div>
  );
}
