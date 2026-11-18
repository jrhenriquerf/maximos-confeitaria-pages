# Coleta de feedbacks

Nova página pública em `/avaliar/`, integrada ao backend de feedbacks do sistema administrativo. O formulário permite avaliação sem autorização de divulgação; nenhum comentário é publicado automaticamente.

Configure `PUBLIC_FEEDBACK_URL` no build do Cloudflare com `https://PROJETO_ATUAL.supabase.co/functions/v1/feedback`. Também é possível definir `settings.feedbackEndpoint` em `data/catalog.json`. O backend deve estar implantado e sua origem exata autorizada em `FEEDBACK_ALLOWED_ORIGINS` antes de divulgar o link.

Sem configuração, a página informa que o formulário está sendo preparado, desabilita o envio e oferece o atendimento existente. O build inclui a origem do endpoint na CSP sem liberar conexões arbitrárias. Nunca colocar service role, token administrativo ou senha no catálogo.

Links com `?origem=embalagem`, `?origem=whatsapp` ou `?origem=instagram` identificam a origem no painel. Esses parâmetros não comprovam uma compra.

Executar `npm test` e `npm run build`. O sistema administrativo contém a migration `202611170001_feedback.sql`, a Edge Function `feedback`, o painel e o gerador de artes. Consulte `docs/feedbacks.md` no repositório `jrhenriquerf/gestao-confeitaria` para ativação e operação.

O backend desta entrega foi ativado no projeto `qpoogxydwbcwufnhewyt` (GestaoDeConfeitaria, Jair Projects), com teste real de recebimento e repetição sem duplicação. O endereço está configurado em `settings.feedbackEndpoint`.
