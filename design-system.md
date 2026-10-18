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

## Cadastro em duas etapas

`/cadastro` mantém a casca das telas de conta (`wrap`, `topbar` com marca e botão de fechar) e abandona o ritmo de formulário: uma régua amarela fina marca o passo e cada etapa faz uma pergunta só. **Garanta seu link** é uma pílula grande com o prefixo fixo e a conferência ao vivo em `GET /api/link?slug=`: ponto amarelo pulsando enquanto confere, selo amarelo com check quando está livre e `role=alert` quando está reservado ou em uso. Se o endereço já tem dono, aparecem chips com alternativas livres (um toque escolhe), e um cartão de prévia — avatar amarelo com a inicial e o nome derivado do endereço — mostra a página nascendo, com a borda amarela quando o endereço fica livre. **Crie sua conta** guarda o endereço num selo amarelo-claro com o atalho editar e pede apenas e-mail e senha, em campos de 54px arredondados, com o botão principal em pílula amarela.
