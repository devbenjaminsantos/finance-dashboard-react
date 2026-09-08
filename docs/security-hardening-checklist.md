# Checklist de segurança e confiabilidade

Este checklist acompanha o estado ativo do Héstia. Material de Azure e
SQL Server histórico está fora deste documento; a operação atual usa Vercel,
Railway, Neon PostgreSQL e Brevo.

Um item só deve ser marcado como concluído depois de implementação, testes
adequados e validação no ambiente correspondente.

## Controles concluídos

- [x] JWT emitido em cookie `HttpOnly`, `Secure` em produção, com versão de
  sessão validada no banco; `Bearer` permanece apenas para clientes externos.
- [x] Operações mutáveis protegidas por antiforgery e CORS limitado a origens
  explícitas.
- [x] Rate limiting global, de autenticação e de conta demo com resposta `429`
  e `Retry-After`.
- [x] Dashboard público usa token aleatório de 256 bits, persistido como hash,
  com rotação e revogação.
- [x] Sessões são invalidadas após redefinição/troca de senha e tokens com
  versão antiga são rejeitados.
- [x] Key ring de Data Protection, outbox transacional e dados da aplicação
  persistidos no Neon.
- [x] Conexão de runtime do Neon separada da conexão administrativa usada para
  migrations controladas.
- [x] Brevo configurada atrás de `IEmailSender`; confirmação, recuperação,
  reenvio limitado, `Delivered` e `Seen` validados manualmente.
- [x] Conta demo isolada por acesso, expira logicamente, não compartilha dados
  entre visitantes e está fora da automação de e-mail.
- [x] Cabeçalhos de segurança, neutralização de fórmulas CSV e autorização por
  usuário cobertos pela revisão atual.

## Prioridade alta

- [x] Implementar bloqueio da senha atual e do histórico na redefinição e no perfil.
- [ ] Aplicar `AddPasswordHistory` e validar os dois fluxos em produção.
  O item e os critérios de aceite estão em
  [`HESTIA_REDESIGN_ROADMAP.md`](HESTIA_REDESIGN_ROADMAP.md#correções-e-polimentos).
- [x] Tornar proxies/redes confiáveis configuráveis, rejeitar IP/CIDR inválido e
  redes `/0`, limitar forwarded headers a um salto e desativá-los quando ambas
  as listas estiverem vazias. Auditoria e rate limit normalizam IPv4 mapeado.
- [x] Cobrir no middleware real headers falsificados de pares não confiáveis,
  cadeia com valor forjado à esquerda, limite de CIDR e ausência de confiança.
- [ ] Confirmar o peer e a cadeia Vercel -> Railway -> API em produção e reduzir
  `100.0.0.0/8` somente com evidência suportada da plataforma. Validar a identidade
  de clientes distintos e a resistência a spoofing pelo endpoint público.
- [ ] Verificar cookies, CSRF, logout, expiração e revogação no domínio
  definitivo, depois do cutover de DNS.
- [x] Limitar chamadas do frontend a 30 segundos, incluindo CSRF e corpo da
  resposta; repetir leituras uma única vez após falha de rede ou `502/503/504`.
  Gravações não são repetidas por essas falhas; a renovação de CSRF continua
  somente após `INVALID_CSRF_TOKEN` explícito. Resultado incerto tem mensagem
  própria em PT-BR/EN; timeout não apaga a sessão.
- [ ] Validar os estados de espera e medir o cold start real de Railway/Neon
  em produção; ajustar o prazo com base nas medições.

## E-mail e privacidade

- [ ] Autenticar o domínio de envio na Brevo com SPF, DKIM e DMARC; iniciar
  DMARC em observação antes de `quarantine` ou `reject`.
- [ ] Criar webhook Brevo com validação de assinatura sobre o corpo bruto,
  limite de payload e deduplicação do evento.
- [ ] Processar `delivered`, bounce, complaint e suppression sem confiar na
  ordem de chegada dos eventos.
- [ ] Definir retenção e exclusão para tokens expirados, auditoria e registros
  de entrega, sem guardar token bruto, corpo de e-mail ou dados financeiros.
- [ ] Rotacionar imediatamente qualquer chave que apareça fora de um cofre de
  secrets e nunca colocá-la em GitHub, Vercel, frontend, logs ou documentação.

## Operação e escala

- [ ] Validar os locks transacionais PostgreSQL de conta demo e notificações
  com duas instâncias concorrentes contra o Neon.
- [x] Separar liveness (`/health`, `/health/live`) de readiness (`/health/ready`),
  com consulta ao banco e histórico de migrations, prazo de 5 segundos, resposta
  genérica e sem cache. Readiness mantém rate limit e não valida sessão.
- [ ] Validar readiness contra PostgreSQL real e no deploy; histórico de migrations
  não substitui verificação de drift manual de schema nem smoke funcional.
- [x] Definir o gate de CI, o smoke pós-deploy, os sinais de monitoramento e o
  procedimento de backup/restauração. A proteção da branch, os alertas dos
  provedores e o primeiro drill completo no Neon continuam pendentes de
  configuração e execução externas; ver [`operations.md`](operations.md).
- [ ] Manter notificações financeiras desativadas até adotar worker/cron com
  outbox, coordenação idempotente e retenção definida.

## Observações de deploy atuais

- `libgssapi_krb5.so.2` ausente na imagem Railway não bloqueou a conexão atual
  por credencial; investigar apenas se GSSAPI/Kerberos ou falha de banco
  relacionada surgir.
- `Failed to determine the https port for redirect` ocorre atrás do proxy TLS
  da Railway. O healthcheck HTTPS funciona; revisar forwarded headers e redirect
  se aparecer loop, URL HTTP ou falha de cookie.
