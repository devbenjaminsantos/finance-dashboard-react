export const VISIBLE_AUDIT_ACTIONS = new Set([
  "auth.registered",
  "auth.login-succeeded",
  "auth.login-blocked-unconfirmed-email",
  "auth.login-locked-out",
  "auth.login-blocked-locked-out",
  "auth.email-confirmed",
  "auth.password-reset-requested",
  "auth.password-reset-completed",
  "auth.demo-login",
  "transaction.created",
  "transaction.updated",
  "transaction.deleted",
  "budget-goal.created",
  "budget-goal.updated",
  "budget-goal.deleted",
  "profile.updated",
  "profile.updated-with-password",
]);

export function formatAuditDate(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatActionLabel(action) {
  const labels = {
    "auth.registered": "Conta criada",
    "auth.login-succeeded": "Login realizado",
    "auth.login-blocked-unconfirmed-email": "Login bloqueado por e-mail nao confirmado",
    "auth.login-locked-out": "Conta bloqueada por excesso de tentativas",
    "auth.login-blocked-locked-out": "Novo acesso bloqueado temporariamente",
    "auth.demo-login": "Entrada na conta de demonstracao",
    "auth.email-confirmed": "E-mail confirmado",
    "auth.password-reset-requested": "Recuperacao de senha solicitada",
    "auth.password-reset-completed": "Senha redefinida",
    "transaction.created": "Transacao adicionada",
    "transaction.updated": "Transacao editada",
    "transaction.deleted": "Transacao removida",
    "budget-goal.created": "Meta criada",
    "budget-goal.updated": "Meta editada",
    "budget-goal.deleted": "Meta removida",
    "profile.updated": "Perfil atualizado",
    "profile.updated-with-password": "Perfil e senha atualizados",
  };

  return labels[action] || "Atividade registrada";
}

export function getActionGroup(action) {
  if (action.startsWith("transaction.")) {
    return "Transacoes";
  }

  if (action.startsWith("budget-goal.")) {
    return "Metas";
  }

  if (action.startsWith("profile.")) {
    return "Perfil";
  }

  return "Acesso e seguranca";
}

export function getActionToneClass(action) {
  if (action?.includes("deleted") || action?.includes("locked-out")) {
    return "finova-badge-danger";
  }

  if (action?.includes("updated") || action?.includes("changed")) {
    return "finova-badge-warning";
  }

  if (action?.includes("password-reset") || action?.includes("confirmed")) {
    return "finova-badge-income";
  }

  return "finova-badge-primary";
}
