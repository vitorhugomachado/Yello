# Yello · Padrões de interface

A identidade atual é **Yello**, conforme `docs/brand-yello.md`, fornecido pelo usuário. Morada foi o nome provisório. O nome interno do projeto e a chave de favoritos existentes foram preservados para evitar perder preferências.

## Marca e tokens

- Amarelo `#FFD500`, preto `#0A0A0A`, superfície escura `#1F1F1F`, branco e fundo claro `#F8F8F8`.
- Fonte Manrope variável, hospedada no próprio bundle via `@fontsource-variable/manrope`, com fallback Inter/system-ui.
- Tokens globais em `src/app/globals.css`: `--brand-yellow`, `--brand-black`, `--neutral-900`, `--neutral-white`, `--neutral-50`, `--font-body` e escala de espaços.
- Ações principais institucionais e do painel: amarelo com texto preto. A vitrine mantém os temas pessoais existentes.
- Marca atualizada pelas imagens fornecidas: letras yell e círculo amarelo com asterisco preto substituindo o o. Símbolo vetorial adaptado das referências raster.

## Landing institucional

Rota `/`: apresentação da Yello e criação de conta/link. Composição editorial inspirada na imagem enviada: tipografia grande, prévia do produto no centro, seções claras e fechamento amarelo com fotografia. A prévia é um link para a demonstração, não um formulário simulado. Benefícios e passos descrevem recursos existentes, sem métricas comerciais inventadas.

Os botões **Criar meu link** encaminham a `/cadastro`. A vitrine pública não contém chamadas de cadastro; o rodapé mantém apenas a assinatura discreta com acesso ao início. Detalhes demonstrativos retornam à vitrine, sem usar um contato fictício.

## Vitrine pública

Perfil compacto sem capa, avatar de 88px, nome e região. Redes em botões de pelo menos 44px. Apresentação e identificação profissional ficam em Sobre. Filtros em faixa horizontal e fotos em destaque, com cards sem borda externa. A capa armazenada não é exibida por este layout minimalista.

## Cadastro de imóveis

Listas agrupadas em cartões brancos de 24px, linhas de pelo menos 60px, divisórias sutis. Um campo por diálogo: tela inteira no celular, modal central no desktop. Concluir aplica o valor à edição; voltar/Escape cancela somente a mudança atual. Descrição usa texto simples, contador e validação.

Galeria com seleção múltipla, câmera, arrastar e botões acessíveis para ordenar, definir capa e excluir. Até 30 imagens de 10 MB; JPG, PNG e WebP. Prévia antes da publicação. Contato vem do perfil. `/demo/editor` mantém alterações em memória, sem publicar.

## Acessibilidade e comportamento

Foco visível com contraste, alvos de 44px ou maiores, labels persistentes, `role=status` em confirmações e `role=alert` em erros. Diálogos nativos contêm o foco e aceitam Escape. Galerias oferecem gestos e botões. Transições curtas respeitam movimento reduzido.

Landing verificada em 360/390px e desktop de 1440px. O CTA inicial aparece na primeira tela do celular. Fotos são ilustrativas; os dados da demonstração são identificados como fictícios. Uploads reais são otimizados em WebP, com orientação EXIF corrigida.

As referências externas são inspirações de composição, não uma alegação de reprodução fiel: imoveis.link não ficou acessível pela ferramenta de consulta nesta revisão.

## Atualização do símbolo

As referências Screenshot_10.png e Screenshot_11.png fornecidas depois do branding substituem o wordmark provisório: letras `yell` e círculo amarelo com asterisco preto no lugar do `o`. O componente Brand usa a fonte local e `public/brand/yello-symbol.svg`; o mesmo desenho aparece em `src/app/icon.svg`. Geometria vetorial adaptada das referências raster, com amarelo sólido #FFD500 e letras herdando a cor do contexto.

As imagens de marca enviadas na última revisão mantêm o wordmark e trocam o símbolo interno: o círculo amarelo passa a levar um asterisco preto de três hastes arredondadas (0°, 60° e 120°), com as pontas a 73% do raio. O mesmo vetor serve de logo e de favicon.

## Entrar e criar conta

As telas de conta (`/login`, `/cadastro`, `/recuperar`, `/redefinir`) compartilham um cartão flutuante sobre um fundo claro com ondas discretas: uma metade é o painel preto com ondas amarelas animadas, a outra recebe o conteúdo. O painel desliza para o lado do momento — à direita ao entrar, à esquerda ao criar conta — e leva a marca, a frase de boas-vindas e o atalho para a outra tela (**Criar minha conta** / **Já tenho conta**). No celular o painel vira uma faixa no topo do cartão.

O desenho das ondas é um plano em WebGL (`src/components/gradient-waves.tsx`, com `ogl`): ele para quando o painel sai da tela, a aba é escondida ou o movimento é reduzido, e sem WebGL fica um degradê estático com as mesmas cores. Os campos são preenchidos, com ícone e botão de mostrar senha, e mantêm o rótulo visível acima; o botão principal é o amarelo da casa com texto preto, em cantos de 15px. O cartão é uma adaptação do Login13 de `frontend-joe/react-components` à identidade da Yello.

## Cadastro em duas etapas

`/cadastro` abandona o ritmo de formulário: uma régua amarela fina marca o passo e cada etapa faz uma pergunta só. **Garanta seu link** é uma pílula grande com o prefixo fixo e a conferência ao vivo em `GET /api/link?slug=`: ponto amarelo pulsando enquanto confere, selo amarelo com check quando está livre e `role=alert` quando está reservado ou em uso. Se o endereço já tem dono, aparecem chips com alternativas livres (um toque escolhe), e um cartão de prévia — avatar amarelo com a inicial e o nome derivado do endereço — mostra a página nascendo, com a borda amarela quando o endereço fica livre. **Crie sua conta** guarda o endereço num selo amarelo-claro com o atalho editar e pede apenas e-mail e senha, em campos de 54px arredondados, com o botão principal em pílula amarela.

## Primeiro acesso, prévia e painel

**Boas-vindas** (`/painel/boas-vindas`): a pausa depois do cadastro não é um formulário. A tela usa o fundo claro com um halo amarelo no canto, o símbolo da Yello como marca d'água discreta (9% de opacidade) e um miolo de 560px com a saudação, a frase **Sua página já tem endereço.**, o cartão preto do endereço reservado e duas ações: o botão amarelo de 56px **Ver minha página** e o atalho silencioso **Agora não, ir para o painel**. Quatro segmentos de 26px mostram a configuração sem transformar o momento em tarefa. No desktop as ações ficam lado a lado; no celular, empilhadas.

**Prévia** (`/painel/previa`): o chrome de contexto fica fora da vitrine para o conteúdo continuar fiel ao que o cliente vê. A barra superior tem voltar, o selo preto **Prévia** com ponto amarelo, **Só você vê** e o botão amarelo de edição. Uma faixa amarela clara explica o estado: exemplos antes do primeiro perfil ou quantos rascunhos ficaram de fora. No modo de exemplo, o avatar é o símbolo da Yello, as redes aparecem sem link, a bio é identificada como **Texto de exemplo — não publicado** e cada card leva o selo **Exemplo**; esses cards não têm link nem favorito. A prévia real lista somente publicados. No celular, um botão amarelo fixo **Personalizar minha página** leva ao editor, e a barra superior mantém o aviso de que só o dono vê aquela tela. A rota é `noindex`.

**Painel** (`/painel`): cartões brancos de 22px em uma coluna de 960px, com o cartão de prévia em destaque: capa de 112px (92px no celular), avatar sobreposto, selo **No ar** ou **Rascunho**, endereço e cópia do link apenas quando a página está publicada. O progresso tem quatro passos de 25%, barra amarela, próximo passo em etiqueta e cada linha leva direto à seção do editor. O portfólio mostra os dois imóveis mais recentes e o atalho **Gerenciar**; a linha de números só conta publicados, rascunhos e fotos reais, com a nota de que visitas e contatos ainda não são medidos. No desktop, progresso e portfólio dividem duas colunas; no celular, tudo empilha. A navegação inferior é **Início / Imóveis / Página** (com `aria-current`), e a conta fica na topbar para caber em 360px. Na primeira dobra de um iPhone 13, a capa e os respiros do cartão de prévia diminuem para as duas ações caberem acima da navegação fixa.

**Regras de conteúdo**: exemplo nunca vira anúncio, rascunho nunca entra na prévia pública e nenhum número é inventado. O link só é copiável depois que o perfil é salvo; até lá, o estado é **Rascunho** e o texto **Disponível ao salvar**.
