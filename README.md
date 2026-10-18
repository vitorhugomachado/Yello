# Morada

MVP de vitrine imobiliária no estilo link na bio, com Next.js 16.4.2, React 19.3, TypeScript, Tailwind CSS 4, Supabase Auth/PostgreSQL/Storage e Lucide. Para desenvolvimento há um banco local em SQLite (dados, sessões e fotos em disco) que dispensa credenciais. Versões exatas no `package-lock.json`. Node 24 recomendado.

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
3. No SQL Editor execute, nesta ordem, `supabase/migrations/202610180001_initial.sql` e `supabase/migrations/202610180002_integrity.sql`. Os arquivos criam tabelas, índices, constraints, triggers, políticas RLS e o bucket **privado** `media`.
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
- Minha página: foto/logo, capa, nome, bio, região, cidade, CRECI, WhatsApp internacional, slug único/reservado, temas acessíveis, redes opcionais ordenáveis, prévia e cópia de link.
- Imóveis: criar/editar por etapas, salvar rascunho, publicar, marcar vendido/alugado, arquivar e excluir com confirmação.
- Fotos: seleção múltipla, acréscimo sem substituir, progresso individual, retry, exclusão, arrastar no desktop e botões de ordenação, primeira foto como capa. Até 30 fotos de 10 MB, JPG/PNG/WebP. Sharp valida o conteúdo, corrige EXIF, reduz a 1920px, remove metadados e converte em WebP.
- Vitrine `/{slug}`: apenas publicados, filtros por finalidade/tipo, favoritos no dispositivo, cards com galeria por deslize.
- Detalhes `/{slug}/imovel/{id}`: galeria em tela cheia com zoom, contador, botões, foco e Escape; descrição, localização aproximada, corretor e CTA fixo seguro para o celular. WhatsApp inclui título e URL.
- Compartilhamento nativo quando disponível, com cópia de link como alternativa; metadados públicos e Open Graph.

## Segurança e dados

`profiles` contém exclusivamente dados públicos profissionais. E-mail e credenciais ficam no Supabase Auth; no banco local, somente o hash scrypt e o sal ficam em `users`. `properties` e `images` possuem dono explícito e FK composta para impedir associar fotos a imóveis de outro usuário. RLS protege leitura e mutações no Supabase; no modo local, cada consulta filtra pelo dono na própria camada de dados (`src/lib/store/local.ts`) e as mesmas restrições vivem no esquema SQLite. A aplicação nunca usa chave privilegiada.

O bucket é privado. A leitura das fotos verifica RLS a cada acesso em `/api/media`, sem cache compartilhado. Visitantes leem fotos vinculadas a imóveis publicados ou à foto/capa atual do perfil; upload e exclusão exigem a pasta do próprio usuário. Arquivar revoga a leitura pública futura. Arquivos já baixados por visitantes não podem ser revogados.

Publicação exige foto e WhatsApp, inclusive por trigger SQL. Excluir a última foto retorna o imóvel a rascunho. Reordenação é transacional e recusa listas incompletas/IDs de terceiros. URLs externas aceitam HTTPS sem credenciais e abrem com `noopener noreferrer`. Mutações HTTP conferem origem, sessão e dados no servidor. `localStorage` contém somente IDs de favoritos.

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

Testes unitários: slugs, telefone, links e dados; banco local (esquema SQLite, contas, sessões, tokens, imóveis, fotos e visibilidade em disco); imagens reais com EXIF e arquivos disfarçados. Testes de isolamento executam as migrations em PostgreSQL via PGlite, com schemas mínimos de Auth/Storage: visitantes, dois proprietários, alterações/exclusão cruzadas, uploads em pasta alheia, publicação, arquivamento e ordenação. O motor executa RLS real, mas esses testes **não simulam o serviço de Auth nem o servidor de Storage do Supabase**. A suíte pgTAP foi preparada separadamente para esse ambiente.

Playwright cobre celular e desktop: filtros, persistência de favoritos, galeria/tela cheia, ausência de overflow em 360px, formulários e recusa de mutações anônimas. Screenshots ficam em `test-results/` (ignorado pelo Git).

Validação desta entrega: build, TypeScript, lint, 13 testes unitários/SQL e 6 testes de navegador passaram antes da revisão final. Consulte a resposta de entrega para o resultado final. Auditoria de produção: zero vulnerabilidades. A auditoria completa aponta 5 alertas altos na cadeia de desenvolvimento do ESLint (`braces`/`micromatch`/`fast-glob`); a correção automática proposta faz downgrade incompatível do eslint-config-next, portanto não foi aplicada.

Sem credenciais fornecidas e sem Docker/CLI local, não foram executados cadastro com e-mail real, upload no Storage real nem pgTAP no Supabase. Após conectar, valide em 360–430px: cadastrar/confirmar → configurar perfil e redes → salvar imóvel → selecionar várias fotos → ordenar/capa → publicar → abrir link em janela anônima → galeria → compartilhar/WhatsApp. Repita com duas contas e confirme que uma não edita os imóveis/arquivos da outra.

## Produção

Use `npm run build` e `npm start` em runtime Node compatível com Sharp (não é exportação estática). O proxy da hospedagem deve aceitar pelo menos 11 MB de corpo por requisição; plataformas com limite menor exigem ajustar o fluxo de upload antes do deploy. Configure as mesmas variáveis e callbacks HTTPS. Sem cobrança, CRM, portais, equipes, chat ou automações.

## Referências consultadas

- Next.js: documentação incluída em `node_modules/next/dist/docs/`, [Route Handlers](https://nextjs.org/docs/app/api-reference/file-conventions/route), [Proxy](https://nextjs.org/docs/app/api-reference/file-conventions/proxy).
- [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [Auth com senha](https://supabase.com/docs/guides/auth/passwords), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Storage](https://supabase.com/docs/guides/storage/security/access-control).
- [Tailwind/Next.js](https://tailwindcss.com/docs/installation/framework-guides/nextjs), [Lucide React](https://lucide.dev/guide/react), [Sharp](https://sharp.pixelplumbing.com/api-operation/).

O protótipo fornecido não ficou acessível pela ferramenta de consulta. A implementação seguiu o briefing, sem alegar correspondência visual com o protótipo. Padrões visuais em `design-system.md`.

## Identidade e landing atuais

O nome público passou a **Yello**, conforme o branding em `docs/brand-yello.md`. A landing `/` concentra os CTAs Criar meu link, que abrem `/cadastro`. A vitrine e seus detalhes não fazem chamadas de cadastro. O wordmark usa o círculo amarelo com asterisco preto enviado nas referências; o mesmo símbolo aparece no ícone da aba. Tipografia Manrope é servida localmente pelo bundle. O projeto/diretório mantém o nome técnico morada; a integração Supabase continua exigindo a configuração descrita acima.

O cadastro abre em duas etapas dentro da mesma casca das telas de conta, com um botão de fechar que volta para a landing, e evita o ritmo de formulário: **Garanta seu link** é uma pílula grande que confere o endereço ao vivo em `GET /api/link?slug=` (formato, nomes reservados e endereços já usados), sugere alternativas livres quando o escolhido já tem dono e mostra uma prévia da página com o nome derivado do endereço; **Crie sua conta** guarda o endereço num selo com o atalho editar e pede só e-mail e senha. Com o banco local a consulta responde de verdade (`free`/`taken`/`reserved` à luz das linhas existentes); sem banco nenhum ela responde `unchecked` e o cadastro segue, já que a unicidade é garantida pela coluna `profiles.slug` (`unique`) no banco escolhido.
