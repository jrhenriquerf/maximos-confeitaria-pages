# Maximos Confeitaria — catálogo digital

Catálogo estático da Maximos Confeitaria, preparado para GitHub + Cloudflare Pages, sem domínio próprio. A integração com o sistema administrativo é uma etapa futura.

## Executar

Requer Node.js 22 ou superior. Não há dependências npm para instalar.

```powershell
# Na pasta do projeto:
npm run build
npm test
npm run dev
```

Abra http://127.0.0.1:4173. O servidor lê `dist/`; após editar dados ou código, rode novamente `npm run build` e atualize o navegador.

## Entrega

- Identidade em creme, chocolate e terracota, utilizando os dois logos enviados.
- Dez imagens de produtos fornecidas pela marca, otimizadas em WebP sem alterar a aparência dos doces. Logos com transparência real no cabeçalho, rodapé e indicação de fotografia pendente.
- Entrada direta no catálogo, com onze produtos. Brownies no Pote de Brigadeiro Branco, Kinder Bueno e Brigadeiro 50% aparecem em cards separados. Tortas de Oreo e Maracujá com Ganache possuem fotos. Somente Brownie com Recheio aguarda fotografia.
- Busca por nome, descrição e sabor; filtros; detalhes em modal com escolha de sabor e quantidade.
- Sacola persistente no navegador, remoção e quantidades de 1 a 99. Nesta versão, preços e totais ficam ocultos por decisão comercial.
- WhatsApp (14) 99844-0207 e Instagram @confeitaria.maximos configurados. A mensagem inclui produtos, sabores e quantidades e solicita os valores. Não há envio automático nem confirmação automática de pedido.
- Rotas estáticas individuais em `/produtos/<id>/`, metadados por produto, canonical e sitemap quando há URL pública.
- Nenhuma conexão com banco, endpoint administrativo ou segredo no catálogo.

## Editar preços, fotos e disponibilidade

Edite `data/catalog.json`. `settings.showPrices: false` oculta preços e totais em todos os componentes e na mensagem do WhatsApp, mesmo que existam preços cadastrados. Os valores serão combinados no atendimento. A ordem da lista determina a ordem de exibição. Campos:

| Campo | Uso |
| --- | --- |
| `id` | Identificador permanente e URL; letras minúsculas, números e hífen |
| `name`, `description`, `category` | Texto público confirmado |
| `image` | Nome do arquivo em `public/images/`, ou `null` |
| `priceCents` | Inteiro em centavos; `null` se desconhecido. Nunca usar zero para preço pendente |
| `active` | `false` exclui o produto de todas as páginas geradas |
| `availability` | `consultar`, `encomenda`, `pronta` ou `indisponivel` |
| `featured` | Selo editorial “Seleção Maximos” |
| `variants` | Lista com `id`, `name`, `image`, `priceCents`; vazia se não houver |

Cada variação tem preço próprio. Um preço nulo na variação não herda o preço base. Produtos indisponíveis não podem ser adicionados e são removidos da sacola ao carregar a nova versão. As categorias iniciais estão declaradas em `src/index.html`; novas categorias exigem acrescentar o respectivo filtro.

Os pesos, prazos e ingredientes não fornecidos foram omitidos. O texto “115g” da imagem do Brigadeirão foi preservado como parte do arquivo enviado, mas não foi convertido em atributo comercial confirmado.

## Contatos e URL

Configure no Cloudflare, em variáveis de build, ou em `settings` do JSON:

| Variável | Formato |
| --- | --- |
| `PUBLIC_WHATSAPP_NUMBER` | Código do país, DDD e número, somente dígitos. Usar o WhatsApp pessoal da confeitaria |
| `PUBLIC_INSTAGRAM_URL` | URL HTTPS do perfil real no Instagram |
| `PUBLIC_SITE_URL` | Origem pública HTTPS, sem caminho. Futuramente pode ser o domínio próprio |

Variáveis de ambiente têm precedência sobre os campos correspondentes. `CF_PAGES_URL`, fornecido pelo Cloudflare, é usado como alternativa para a URL pública. Arquivos `.env` não são carregados automaticamente pelo Node nesta implementação; use variáveis do terminal ou do Cloudflare. As configurações acima são públicas por natureza: o telefone aparece no link `wa.me`. Não coloque segredos nesses campos.

## Publicar no Cloudflare Pages

1. Use o repositório `jrhenriquerf/maximos-confeitaria-pages`. Ele é dedicado ao catálogo público. Não adicionar dados internos do sistema administrativo.
2. No Cloudflare, abra **Workers & Pages → Create application → Pages → Connect to Git**. Conecte o repositório GitHub.
3. Escolha `main` como branch de produção. Deixe o diretório raiz vazio: o catálogo ocupa a raiz do repositório.
4. Framework: **None**. Build: `npm run build`. Diretório de saída: `dist`. Variável `NODE_VERSION`: `22`.
5. Configure os contatos confirmados. Não adicionar chaves Supabase, service role ou senhas.
6. Faça o deploy. O Cloudflare atribuirá o subdomínio `<nome-disponivel>.pages.dev`. Defina essa URL estável em `PUBLIC_SITE_URL` e execute novo deploy para fixar as prévias e URLs canônicas de produção.
7. A integração Git executa novos deploys após alterações na branch configurada. No futuro, associe um domínio próprio ao mesmo projeto e atualize `PUBLIC_SITE_URL`.

Não é necessário workflow de Actions, Wrangler, Functions, Workers, banco ou assinatura adicional para esta versão. O plano gratuito fica sujeito aos limites e condições do provedor; esta entrega não contratou serviços.

Referências oficiais: [integração Git](https://developers.cloudflare.com/pages/get-started/git-integration/), [HTML estático](https://developers.cloudflare.com/pages/framework-guides/deploy-anything/), [limites](https://developers.cloudflare.com/pages/platform/limits/).

## Integração e pendências

Veja [integração futura](docs/integracao.md). A edição no JSON é a administração provisória; **não é um painel conectado**. A integração administrativa depende da identificação do repositório e banco atuais. O repositório informado estava vazio e não contém o sistema administrativo. Falta identificar sua base atual para integração. Disponibilidade, prazos, foto do brownie recheado e descrições comerciais ainda podem ser refinados. A ausência de preços é intencional, não uma pendência de publicação.

Antes de divulgar: conferir esses dados, validar uma conversa real no WhatsApp configurado, conferir o build no Cloudflare e testar a prévia do link em WhatsApp/Instagram. Não houve envio de mensagens nesta validação.
