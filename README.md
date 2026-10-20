# Morada

MVP de vitrine imobiliária no estilo link na bio, com Next.js 16.4.2, React 19.3, TypeScript, Tailwind CSS 4, Supabase Auth/PostgreSQL/Storage e Lucide. Para desenvolvimento há um banco local em SQLite (dados, sessões e fotos em disco) que dispensa credenciais. Versões exatas no `package-lock.json`. Node 24 ou superior é necessário para o banco local (`node:sqlite`).

## Executar

```powershell
npm ci
Copy-Item .env.example .env.local
# deixe as variáveis do Supabase vazias para usar o banco local (veja abaixo)
npm run dev
```

Abra `http://localhost:3000`. `/demo` funciona sem credenciais com dados explicitamente fictícios; não salva perfis ou imóveis. A demonstração usa fotos ilustrativas remotas do Unsplash. Sem Supabase e sem banco local, as operações reais retornam uma mensagem de configuração pendente.

`/demo/editor` demonstra o cadastro em listas agrupadas, edição por campo, galeria e prévia. Nessa rota, alterações e fotos adicionadas permanecem somente na memória da visita; o botão valida a prévia sem publicar. No painel autenticado, os mesmos componentes salvam pela integração real.

## Banco local (SQLite)

Sem nenhuma variável do Supabase, o projeto usa um banco local em SQLite — `.data/yello.db`, ignorado pelo Git — com as fotos em `.data/media`. É o caminho mais rápido para exercitar cadastro, painel e vitrine de ponta a ponta:

```powershell
npm run db:init   # cria o arquivo e aplica db/schema.sql (o app também faz isso sozinho)
npm run db:seed   # opcional: corretora de exemplo em /marina-oliveira
npm run dev
```

A conta semeada entra com `marina@yello.local` / `yello1234`. `npm run db:reset` apaga banco e fotos — feche o `npm run dev` antes, porque no Windows o arquivo aberto não pode ser removido.

`db/schema.sql` espelha as migrations do Supabase — mesmas tabelas, checagens e gatilhos: endereço reservado ou repetido é recusado, publicar exige WhatsApp e ao menos uma foto, o limite é de 30 fotos por imóvel e o imóvel volta a rascunho quando perde a última foto. `YELLO_LOCAL=1` força o banco local mesmo com o Supabase preenchido; `YELLO_LOCAL=0` faz o contrário; `YELLO_DB` muda o caminho do arquivo.

Diferenças do modo local, todas por ser uma ferramenta de desenvolvimento: a conta já nasce confirmada (não há envio de e-mail), a recuperação de senha mostra o link na própria tela e as senhas ficam na tabela `users` com scrypt e sal por conta. O resto do comportamento é o mesmo: a sessão vive num cookie `yello_session` httpOnly, `/api/media` repete a política do bucket (dono, foto de imóvel publicado ou avatar/capa em uso) e as rotas validam origem, sessão e dados igual ao Supabase. Para voltar ao Supabase, preencha `.env.local` e remova `YELLO_LOCAL`.

## Conectar o Supabase

1. Crie um projeto Supabase. Em Project Settings → API, copie a URL e a chave **publishable** (ou a chave pública anon legada) para `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
2. Defina `NEXT_PUBLIC_SITE_URL=http://localhost:3000` no desenvolvimento. Em produção use a origem HTTPS definitiva, sem caminho. Ela compõe os links de interesse e os metadados sociais.
3. No SQL Editor execute, nesta ordem, `supabase/migrations/202610180001_initial.sql`, `supabase/migrations/202610180002_integrity.sql` e `supabase/migrations/202610200001_engagement.sql`. Os arquivos criam tabelas, índices, constraints, triggers, políticas RLS, o bucket **privado** `media`, reservas de link, redirecionamentos, métricas first-party e a caixa de contatos.
4. Em Authentication → Providers, habilite Email e mantenha confirmação de e-mail. Em URL Configuration configure Site URL e autorize `http://localhost:3000/auth/callback` e `http://localhost:3000/auth/callback?next=/redefinir`. Acrescente os mesmos callbacks com a origem de produção.
5. Os templates padrão que usam `{{ .ConfirmationURL }}` são compatíveis com o callback PKCE. Abra o link no mesmo navegador usado para iniciar o cadastro/recuperação. Configure SMTP próprio para entrega real de e-mails e limites de envio adequados antes de disponibilizar ao público.
6. Reinicie o Next.js após editar o ambiente. Cadastre uma conta e confirme o e-mail.

Não é necessária chave `service_role`. Não coloque chaves privilegiadas em variáveis `NEXT_PUBLIC_*`. `.env.local` é ignorado pelo Git; `.env.example` contém apenas placeholders.

Alternativa via CLI Supabase, após autenticar e vincular seu projeto:

```powershell
npx supabase init
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase db push
```

Para executar a suíte pgTAP em ambiente local descartável (requer Docker e CLI): `npx supabase start`, `npx supabase db reset`, `npx supabase test db`. Não execute resets no projeto de produção.

## Fluxo entregue

- Cadastro, login, logout, recuperação e alteração de senha; sessão em cookies e proteção do painel.
- Primeiro acesso: após criar a conta, uma pausa em `/painel/boas-vindas` mostra o endereço reservado, um resumo do que vem depois e dois caminhos — ver a página ou ir direto ao painel. A tela não é um formulário e não bloqueia nada.
- Painel `/painel`: prévia do perfil com status do link, cópia do endereço e QR quando a página está no ar, quatro sugestões de configuração com progresso real, acesso aos imóveis e contagens de publicados, rascunhos e fotos. As visitas, visualizações de imóveis, cliques no WhatsApp, compartilhamentos e os imóveis com mais interesse vêm de eventos reais dos últimos 30 dias. A caixa de entrada resume as mensagens recebidas e destaca as não lidas.
- Prévia `/painel/previa`: renderiza a mesma vitrine pública, com uma barra de contexto fora dela. Antes do primeiro perfil salvo, usa um perfil e dois imóveis de exemplo, todos marcados como exemplo, sem links nem favoritos; rascunhos nunca aparecem.
- Minha página: capa, foto/logo, nome, bio, região, cidade, CRECI, WhatsApp internacional, slug único/reservado, temas acessíveis, redes opcionais ordenáveis, prévia e cópia de link. O editor em `/painel/perfil` separa apresentação, contato e aparência. O endereço antigo vira um redirecionamento quando o slug muda.
- Imóveis: criar/editar por etapas, salvar rascunho, publicar, marcar vendido/alugado, arquivar e excluir com confirmação. Condomínio, IPTU, comodidades e link de vídeo/tour complementam o anúncio; a publicação mostra o link público e oferece compartilhamento na hora.
- Fotos: seleção múltipla, acréscimo sem substituir, progresso individual, retry, exclusão, arrastar no desktop e botões de ordenação, primeira foto como capa. Até 30 fotos de 10 MB, JPG/PNG/WebP. Sharp valida o conteúdo, corrige EXIF, reduz a 1920px, remove metadados e converte em WebP.
- Vitrine `/{slug}`: capa quando cadastrada, apenas publicados, busca por finalidade, tipo, preço, quartos, bairro/cidade e ordenação; filtros compartilháveis na URL, favoritos no dispositivo, envio da lista de favoritos pelo WhatsApp, cards com galeria por deslize, contato vCard e QR code.
- Detalhes `/{slug}/imovel/{id}`: galeria em tela cheia com zoom, contador, botões, foco e Escape; descrição, comodidades, condomínio/IPTU, localização aproximada com link para o mapa, corretor, formulário de mensagem e CTA fixo seguro para o celular. WhatsApp inclui título e URL e passa por um redirecionamento medido.
- Contatos: o formulário do imóvel guarda nome, WhatsApp e mensagem na caixa de entrada do corretor, com marcação de lida, resposta direta no WhatsApp e exclusão. A topbar mostra quantas mensagens novas existem.
- Compartilhamento nativo quando disponível, com cópia de link como alternativa; compartilhamentos são contados de forma agregada. Metadados públicos e Open Graph.
- Conta e privacidade: exportação dos dados em JSON, exclusão definitiva da conta com confirmação de senha, termos de uso e política de privacidade públicos.

## Primeiro acesso, prévia e painel

A conta nova entra por `/painel`. Enquanto não existe perfil e a metadata da conta não tem `onboarding.welcomedAt`, o painel redireciona para `/painel/boas-vindas`. A marca é gravada por uma ação explícita — **Ver minha página** ou **Agora não, ir para o painel** — em `POST /api/onboarding` com `{ "action": "welcome-seen" }`. Um GET, prefetch ou recarga nunca esconde as boas-vindas; contas que já têm perfil são tratadas como veteranas e seguem direto ao painel.

O link escolhido no cadastro fica **reservado**, não publicado: a página só passa a existir quando o primeiro perfil é salvo. Por isso o painel mostra o selo **Rascunho** e troca o botão de copiar por **Disponível ao salvar** até esse momento. Quando o perfil existe, o endereço vira um link público de verdade, com cópia e abertura em outra aba.

A prévia (`/painel/previa`) usa o mesmo componente `Storefront` da página pública, para que espaçamento, tipografia e cards sejam os do cliente. Sem perfil, entram o perfil de exemplo e dois cards de exemplo: avatar com o símbolo da Yello, redes apenas decorativas, bio identificada como texto de exemplo e selos **Exemplo** em cada card. Esses cards não têm link nem favorito. Com perfil, a prévia lista somente imóveis publicados; rascunhos não entram e uma faixa avisa quantos ficaram de fora. Nenhum número de visitas ou contatos é exibido.

O progresso do painel tem quatro passos de 25%: nome e bio, WhatsApp, ao menos um imóvel e identidade (foto, capa ou tema diferente do padrão). Tudo é derivado dos dados salvos, e cada sugestão leva à seção correspondente do editor; nenhum passo bloqueia a navegação. No celular, a navegação inferior é **Início / Imóveis / Página**, e a conta fica no topo.

## Segurança e dados

`profiles` contém exclusivamente dados públicos profissionais. E-mail e credenciais ficam no Supabase Auth; no banco local, somente o hash scrypt e o sal ficam em `users`. `properties` e `images` possuem dono explícito e FK composta para impedir associar fotos a imóveis de outro usuário. RLS protege leitura e mutações no Supabase; no modo local, cada consulta filtra pelo dono na própria camada de dados (`src/lib/store/local.ts`) e as mesmas restrições vivem no esquema SQLite. A aplicação nunca usa chave privilegiada.

O endereço escolhido no cadastro é reservado numa tabela própria. Trocar o slug guarda o endereço anterior em `slug_redirects`; a página antiga redireciona para a atual em vez de virar um 404. As consultas públicas de disponibilidade consideram perfis, reservas e redirecionamentos.

A medição é first-party e agregada: só guardamos o tipo de evento, o perfil, o imóvel e a origem normalizada (`utm_source`/`ref`). Não guardamos IP, cookie de analytics nem dado pessoal do visitante. Bots, prévias de redes sociais e o próprio dono não contam visita. Contatos têm nome, WhatsApp e mensagem por serem necessários para a resposta do corretor; ficam visíveis apenas para o dono do perfil e podem ser exportados ou excluídos com a conta.

O bucket é privado. A leitura das fotos verifica RLS a cada acesso em `/api/media`, sem cache compartilhado. Visitantes leem fotos vinculadas a imóveis publicados ou à foto/capa atual do perfil; upload e exclusão exigem a pasta do próprio usuário. Arquivar revoga a leitura pública futura. Arquivos já baixados por visitantes não podem ser revogados.

Publicação exige foto e WhatsApp, inclusive por trigger SQL. Excluir a última foto retorna o imóvel a rascunho. Reordenação é transacional e recusa listas incompletas/IDs de terceiros. URLs externas aceitam HTTPS sem credenciais e abrem com `noopener noreferrer`. Mutações HTTP conferem origem, sessão e dados no servidor. Cadastro, disponibilidade de slug, eventos, contatos, saída para WhatsApp e exclusão de conta têm limite de tentativas em memória por instância; para várias instâncias, complemente com o limite da hospedagem ou Redis. Cabeçalhos de segurança básicos (`nosniff`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy` e HSTS em produção) são aplicados em todas as respostas. `localStorage` contém somente IDs de favoritos.

Uploads de foto/capa ainda não vinculados ao perfil ficam privados. Se o usuário abandonar a edição ou trocar a imagem, arquivos antigos podem permanecer privados no bucket; não há rotina automática de coleta de órfãos neste MVP. Exclusão de imóvel remove os arquivos antes dos registros; em falha de rede, a interface informa erro e permite repetir.

## Verificar

```powershell
npm run typecheck
npm run lint
npm test
npx playwright install chromium
npm run test:e2e
npm run build
npm audit --omit=dev
```

Testes unitários: slugs, telefone, links e dados; banco local (esquema SQLite, contas, sessões, tokens, imóveis, fotos, reserva/redirect de slug, eventos agregados e contatos); imagens reais com EXIF e arquivos disfarçados; regras de primeiro acesso (metadata válida, perfil existente, quatro passos e saudação). Testes de isolamento executam as migrations em PostgreSQL via PGlite, com schemas mínimos de Auth/Storage: visitantes, dois proprietários, alterações/exclusão cruzadas, uploads em pasta alheia, publicação, arquivamento e ordenação. O motor executa RLS real, mas esses testes **não simulam o serviço de Auth nem o servidor de Storage do Supabase**. A suíte pgTAP foi preparada separadamente para esse ambiente.

Playwright cobre celular e desktop: cadastro → boas-vindas → prévia com exemplos → editor → painel → recarga, filtros na URL, persistência de favoritos, galeria/tela cheia, ausência de overflow em 360px, formulários e recusa de mutações anônimas. A cobertura de engajamento abre a vitrine com capa, confere QR/vCard/termos/privacidade, mede visita, clique e contato com um visitante anônimo, exercita a caixa de entrada e exporta/exclui uma conta descartável. Screenshots ficam em `test-results/` (ignorado pelo Git).

A validação desta entrega cobre build, TypeScript, lint, testes unitários/SQL e Playwright nos dois tamanhos. Consulte a resposta de entrega para o resultado final. Auditoria de produção: zero vulnerabilidades. A auditoria completa aponta 5 alertas altos na cadeia de desenvolvimento do ESLint (`braces`/`micromatch`/`fast-glob`); a correção automática proposta faz downgrade incompatível do eslint-config-next, portanto não foi aplicada.

Sem credenciais fornecidas e sem Docker/CLI local, não foram executados cadastro com e-mail real, upload no Storage real nem pgTAP no Supabase. Após conectar, valide em 360–430px: cadastrar/confirmar → configurar perfil e redes → salvar imóvel → selecionar várias fotos → ordenar/capa → publicar → abrir link em janela anônima → galeria → compartilhar/WhatsApp. Repita com duas contas e confirme que uma não edita os imóveis/arquivos da outra.

## Produção

Use `npm run build` e `npm start` em runtime Node compatível com Sharp (não é exportação estática). O proxy da hospedagem deve aceitar pelo menos 11 MB de corpo por requisição; plataformas com limite menor exigem ajustar o fluxo de upload antes do deploy. Configure as mesmas variáveis e callbacks HTTPS. Sem cobrança, CRM, portais, equipes, chat ou automações.

## Referências consultadas

- Next.js: documentação incluída em `node_modules/next/dist/docs/`, [Route Handlers](https://nextjs.org/docs/app/api-reference/file-conventions/route), [Proxy](https://nextjs.org/docs/app/api-reference/file-conventions/proxy).
- [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [Auth com senha](https://supabase.com/docs/guides/auth/passwords), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Storage](https://supabase.com/docs/guides/storage/security/access-control).
- [Tailwind/Next.js](https://tailwindcss.com/docs/installation/framework-guides/nextjs), [Lucide React](https://lucide.dev/guide/react), [Sharp](https://sharp.pixelplumbing.com/api-operation/).
- [Login13 (react-components)](https://github.com/frontend-joe/react-components): referência de composição do cartão de acesso, adaptada à identidade da Yello; as ondas em WebGL usam [ogl](https://github.com/oframe/ogl).

O protótipo fornecido não ficou acessível pela ferramenta de consulta. A implementação seguiu o briefing, sem alegar correspondência visual com o protótipo. Padrões visuais em `design-system.md`.

## Identidade e landing atuais

O nome público passou a **Yello**, conforme o branding em `docs/brand-yello.md`. A landing `/` concentra os CTAs Criar meu link, que abrem `/cadastro`. A vitrine e seus detalhes não fazem chamadas de cadastro. O wordmark usa o círculo amarelo com asterisco preto enviado nas referências; o mesmo símbolo aparece no ícone da aba. Tipografia Manrope é servida localmente pelo bundle. O projeto/diretório mantém o nome técnico morada; a integração Supabase continua exigindo a configuração descrita acima.

O cadastro evita o ritmo de formulário: **Garanta seu link** é uma pílula grande que confere o endereço ao vivo em `GET /api/link?slug=` (formato, nomes reservados e endereços já usados), sugere alternativas livres quando o escolhido já tem dono e mostra uma prévia da página com o nome derivado do endereço; **Crie sua conta** guarda o endereço num selo com o atalho editar e pede só e-mail e senha. Com o banco local a consulta responde de verdade (`free`/`taken`/`reserved` à luz das linhas existentes); sem banco nenhum ela responde `unchecked` e o cadastro segue, já que a unicidade é garantida pela coluna `profiles.slug` (`unique`) no banco escolhido.

As telas de acesso (`/login`, `/cadastro`, `/recuperar`, `/redefinir`) usam um cartão flutuante com fundo de ondas discretas e um painel preto de ondas amarelas animadas em WebGL (`ogl`); sem WebGL ou com movimento reduzido fica um degradê estático. Entrar, recuperar e redefinir ficam com o painel à direita; o cadastro, à esquerda, com as duas etapas descritas acima. Os campos são preenchidos, com ícone e botão de mostrar senha, e o painel sempre traz o atalho para a outra tela.
