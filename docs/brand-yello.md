# Yello — Brand Design System

> Versão 1.0 · 18/10/2026 · Diretrizes para identidade visual e produto digital

## 1. Essência da marca

**Nome:** Yello  
**Categoria:** SaaS de links e vitrines digitais para corretores de imóveis.  
**Proposta:** Reunir imóveis, fotografias, contatos, redes sociais e canais de atendimento em uma única página compartilhável e otimizada para celular.  
**Assinatura:** **Seus imóveis. Um único link.**

### Personalidade

Minimalista, confiável, contemporânea, direta e acessível. A marca deve parecer uma plataforma de tecnologia — não uma imobiliária tradicional.

### Princípios

1. **Clareza primeiro:** interfaces fáceis de compreender em segundos.
2. **Mobile-first:** experiência pública e painel do corretor priorizam telas pequenas.
3. **Imóveis em destaque:** fotografias e informações do imóvel têm prioridade visual.
4. **Amarelo com intenção:** a cor de marca enfatiza identidade e ações principais, sem sobrecarregar a interface.
5. **Consistência:** o mesmo símbolo, cores e princípios tipográficos em todos os pontos de contato.

## 2. Logotipo

### Construção aprovada

- Wordmark em minúsculas: **yello**.
- Família tipográfica: **Manrope**.
- Peso preferencial: **SemiBold (600)**; avaliar **Bold (700)** apenas em formatos de destaque.
- As letras **yell** são brancas sobre fundo preto e pretas sobre fundo claro/amarelo.
- O **“o” é substituído por um círculo amarelo `#FFD500`**, contendo o **asterisco preto** aprovado.
- Manter o desenho e as proporções do símbolo aprovado; não redesenhar o telhado ou acrescentar elos ao ícone sem nova aprovação.
- A assinatura pode acompanhar o logotipo, mas não faz parte obrigatória de sua forma reduzida.

**Importante:** as imagens aprovadas são referências visuais; a arte final vetorial deverá ser redesenhada com medidas consistentes e aprovada antes de definir geometria exata ou entregar arquivos SVG finais.

### Versões permitidas

| Contexto | Letras | Círculo | Casa |
|---|---|---|---|
| Fundo preto `#0A0A0A` | Branco | Amarelo | Preto |
| Fundo amarelo `#FFD500` | Preto | Amarelo | Preto |
| Fundo branco `#FFFFFF` | Preto | Amarelo | Preto |
| Ícone sobre amarelo | — | Campo amarelo | Preto |
| Ícone sobre preto | — | Campo preto | Amarelo |

### Peso e espaçamento

- **Primário:** Manrope SemiBold 600, tracking óptico neutro ou levemente fechado.
- **Alternativo:** Manrope Medium 500 para aplicações editoriais grandes, sujeito a teste de legibilidade.
- Evitar Thin/Light como logotipo principal em dispositivos móveis.
- Ajustar opticamente a distância entre o último `l` e o círculo para que a palavra seja lida como uma unidade.
- Reservar área de proteção de pelo menos **0,5× o diâmetro do círculo** em todos os lados (regra inicial a validar na arte vetorial).
- **Tamanho mínimo:** validar em protótipos reais; como ponto de partida, usar largura de **96 px** para o wordmark completo. Em espaços menores, usar somente o ícone.
- Não esticar, girar, aplicar sombras, gradientes, contornos extras ou alterar o amarelo.

## 3. Cores

| Token | HEX | Uso |
|---|---|---|
| `brand.yellow` | `#FFD500` | Identidade, CTA principal, seleção e acentos |
| `brand.black` | `#0A0A0A` | Fundo institucional, texto em áreas claras |
| `neutral.900` | `#1F1F1F` | Superfícies escuras e cartões |
| `neutral.0` | `#FFFFFF` | Texto em fundo escuro, superfícies claras |
| `neutral.50` | `#F8F8F8` | Fundo claro alternativo |

### Regras de aplicação

- **Branding institucional:** predomínio de preto, com amarelo de destaque e branco para leitura.
- **Painel do corretor:** preferencialmente claro, com fundos `#FFFFFF`/`#F8F8F8` e texto `#0A0A0A`.
- **Página pública do corretor:** tema escuro pode ser o padrão de demonstração, com opção futura de personalização controlada.
- **Botão primário:** fundo amarelo e texto preto.
- **Botão secundário no escuro:** superfície `#1F1F1F`, texto branco e borda discreta.
- Não usar amarelo em textos longos sobre branco; priorizar preto para leitura.
- Validar contraste de texto e controles conforme WCAG 2.2 AA antes da publicação.

## 4. Tipografia

**Família principal: [Manrope](https://fonts.google.com/specimen/Manrope)**  
**Fallback CSS:** `"Manrope", Inter, system-ui, sans-serif`.

| Papel | Peso | Tamanho mobile / line-height |
|---|---:|---|
| Display | 700 | 36 px / 44 px |
| H1 | 700 | 28 px / 36 px |
| H2 | 600 | 22 px / 30 px |
| H3 | 600 | 18 px / 26 px |
| Corpo | 400 | 16 px / 24 px |
| Corpo compacto | 400 | 14 px / 21 px |
| Rótulo de botão | 600 | 14–16 px / 20–24 px |
| Legenda | 500 | 12 px / 18 px |

- Usar capitalização normal nas interfaces; evitar blocos extensos em CAIXA ALTA.
- Valores monetários devem ser fáceis de escanear e, se necessário, usar algarismos tabulares.
- O slogan pode aparecer em caixa alta com tracking amplo **somente em peças institucionais**.

## 5. Elementos gráficos

### Símbolo

Casa geométrica de traço simples, sem preenchimento interno, com terminações e ângulos coerentes com a referência aprovada. Usar a mesma silhueta em favicon, avatar, ícone de aplicativo e marca reduzida.

### Ícones de interface

- Estilo: linear, geometria limpa, espessura consistente (referência: Lucide).
- Base: 20 ou 24 px.
- Ícones úteis: link, casa, imagens, WhatsApp, Instagram, telefone, localização, compartilhar, calendário e configurações.
- Amarelo para ícones ativos ou relevantes; cinza/branco/preto para os demais.

### Formas e acabamento

- Cantos: `8 px` (campos), `12 px` (cards), `16 px` (cards de destaque), `999 px` (botões pill).
- Espaçamentos: escala de 4 px (`4, 8, 12, 16, 24, 32, 48, 64`).
- Bordas discretas; evitar brilho, texturas fortes, gradientes chamativos e sombras pesadas.
- Fotografias de imóveis devem manter cores naturais e boa resolução.

## 6. Componentes mobile

### Página pública do corretor

1. Logo Yello discreto, sem competir com a identidade do corretor.
2. Foto, nome, CRECI quando aplicável e descrição breve.
3. CTA principal: **Falar no WhatsApp**.
4. Links sociais e contatos com ícones reconhecíveis.
5. Imóveis em destaque com **múltiplas fotos por imóvel**, preço, localização e atributos essenciais.
6. Filtros simples: Todos, Venda, Aluguel.
7. Compartilhamento de link e de imóvel individual.

### Painel do corretor

- Gerenciamento de perfil, redes sociais e links.
- Cadastro e edição de imóveis, galeria de fotos e ordenação das imagens.
- Pré-visualização mobile da página pública.
- Botão claro para **Copiar meu link**.
- Indicadores básicos de visualizações e cliques, quando houver implementação de analytics.

### Interações

- Áreas de toque de aproximadamente **44 × 44 px** ou maiores.
- Feedback visível em carregamento, sucesso, erro e estados vazios.
- Galeria de fotos com swipe, indicadores e alternativa acessível para navegação.
- Botões com rótulos claros; evitar depender exclusivamente de ícones.
- Respeitar redução de movimento e navegação por teclado quando aplicável.

## 7. Tokens de implementação

```css
:root {
  --brand-yellow: #FFD500;
  --brand-black: #0A0A0A;
  --neutral-900: #1F1F1F;
  --neutral-white: #FFFFFF;
  --neutral-50: #F8F8F8;

  --font-brand: "Manrope", Inter, system-ui, sans-serif;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-pill: 999px;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;

  --color-bg: var(--neutral-white);
  --color-surface: var(--neutral-50);
  --color-text: var(--brand-black);
  --color-primary: var(--brand-yellow);
  --color-on-primary: var(--brand-black);
}
```

## 8. Voz e mensagens

**Tom:** objetivo, amigável, confiante e sem jargão imobiliário desnecessário.

- Institucional: **Seus imóveis. Um único link.**
- Benefício: **Sua vitrine imobiliária pronta para compartilhar.**
- Ação: **Crie sua página**, **Adicione um imóvel**, **Copie seu link**.
- Evitar promessas absolutas de aumento de vendas sem comprovação.

## 9. Checklist de consistência

- [ ] Logotipo com Manrope e símbolo aprovado, sem deformações.
- [ ] Amarelo `#FFD500` e preto `#0A0A0A` consistentes.
- [ ] Versões para fundo preto, amarelo e branco.
- [ ] Legibilidade em 320–390 px de largura.
- [ ] CTA principal com alto contraste e área de toque adequada.
- [ ] Galeria com múltiplas imagens e controles acessíveis.
- [ ] Interface limpa, com hierarquia e respiro.
- [ ] Ícone reduzido reconhecível em tamanhos pequenos.
- [ ] Exportações finais em SVG, PNG e favicon **após aprovação da arte vetorial**.

---

**Status:** identidade visual e paleta aprovadas; Manrope selecionada. Proporções exatas do logotipo, arquivos vetoriais e testes finais de acessibilidade ainda dependem de validação.
