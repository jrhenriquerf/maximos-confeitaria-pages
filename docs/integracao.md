# Integração futura com o painel

Este repositório contém exclusivamente a vitrine pública. O sistema administrativo não faz parte desta entrega. O catálogo não acessa banco, não exige login e não expõe custos, receitas, estoque ou credenciais.

O contrato público está em `data/catalog.json`. A publicação gera HTML por produto e arquivos estáticos para Cloudflare Pages. O build projeta uma lista explícita de campos públicos, sem copiar atributos adicionais do arquivo de entrada. Fotos ficam em `public/images`.

## Caminho recomendado

1. Identificar o repositório e o schema atuais do painel.
2. Reutilizar os produtos comerciais e preços existentes, mantendo receitas e custos privados.
3. Adicionar somente os metadados de vitrine ausentes: descrição pública, categoria, slug, posição, disponibilidade, fotos e variações.
4. Reaproveitar autenticação e permissões administrativas existentes, verificadas no servidor.
5. Criar uma ação autenticada de exportação que produza exclusivamente o contrato público. Revisar a exportação antes de enviar ao repositório.
6. Publicar as alterações pelo fluxo GitHub → Cloudflare Pages.

Não expor RPCs administrativas nem exportar o estado completo do sistema. Não colocar chaves de serviço em variáveis `PUBLIC_*`. O telefone de atendimento e o Instagram são informações públicas de contato.

## Operação sem preços

`settings.showPrices` está definido como `false`. Cards, detalhes, sacola e mensagem de WhatsApp não apresentam preços nem totais. O cliente escolhe itens, sabores e quantidades e solicita valores e disponibilidade pelo WhatsApp pessoal da confeitaria.

O carrinho fica apenas no navegador e não reserva estoque. A abertura do WhatsApp não envia a mensagem automaticamente. A confirmação da encomenda depende do atendimento.
