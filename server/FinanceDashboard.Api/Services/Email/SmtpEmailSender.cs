using System.Net;
using System.Net.Mail;
using FinanceDashboard.Api.Services.Notifications;

namespace FinanceDashboard.Api.Services.Email
{
    public class SmtpEmailSender : IEmailSender
    {
        private readonly IConfiguration _configuration;

        public SmtpEmailSender(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public Task SendPasswordResetEmailAsync(string toEmail, string name, string resetUrl)
        {
            return SendAsync(
                toEmail,
                "Redefinicao de senha - Finova",
                $"""
                Ola, {name}.

                Recebemos uma solicitacao para redefinir sua senha no Finova.

                Acesse o link abaixo para criar uma nova senha:
                {resetUrl}

                Se voce nao solicitou essa alteracao, ignore este e-mail.
                """);
        }

        public Task SendEmailVerificationAsync(string toEmail, string name, string verificationUrl)
        {
            return SendAsync(
                toEmail,
                "Confirmacao de e-mail - Finova",
                $"""
                Ola, {name}.

                Confirme seu e-mail para ativar sua conta no Finova.

                Acesse o link abaixo para concluir a confirmacao:
                {verificationUrl}

                Se voce nao criou esta conta, ignore este e-mail.
                """);
        }

        public Task SendBudgetGoalAlertEmailAsync(
            string toEmail,
            string name,
            string monthLabel,
            string goalLabel,
            int progressPercent,
            decimal spentAmount,
            decimal targetAmount)
        {
            return SendAsync(
                toEmail,
                $"Alerta de meta mensal - {goalLabel}",
                $"""
                Ola, {name}.

                Sua meta "{goalLabel}" em {monthLabel} atingiu {progressPercent}% do limite definido.

                Valor gasto ate agora: {spentAmount:C}
                Limite planejado: {targetAmount:C}

                Acesse o Finova para revisar suas movimentacoes e ajustar o plano do mes, se necessario.
                """);
        }

        public Task SendMonthlySummaryEmailAsync(
            string toEmail,
            string name,
            string monthLabel,
            decimal incomeAmount,
            decimal expenseAmount,
            decimal balanceAmount,
            string? topExpenseCategory,
            decimal? topExpenseAmount,
            IReadOnlyList<MonthlyGoalSummary> goalSummaries)
        {
            var goalLines = goalSummaries.Count == 0
                ? "Nenhuma meta cadastrada para este mes."
                : string.Join(
                    Environment.NewLine,
                    goalSummaries.Select(summary =>
                        $"- {summary.GoalLabel}: gasto {summary.SpentAmount:C} de {summary.TargetAmount:C}"));

            var topCategoryLine = string.IsNullOrWhiteSpace(topExpenseCategory) || topExpenseAmount is null
                ? "Categoria com maior gasto: nao identificada."
                : $"Categoria com maior gasto: {topExpenseCategory} ({topExpenseAmount.Value:C}).";

            return SendAsync(
                toEmail,
                $"Resumo mensal - {monthLabel}",
                $"""
                Ola, {name}.

                Aqui esta o seu resumo financeiro de {monthLabel}.

                Receitas: {incomeAmount:C}
                Despesas: {expenseAmount:C}
                Saldo: {balanceAmount:C}

                {topCategoryLine}

                Metas do periodo:
                {goalLines}

                Acesse o Finova para revisar os detalhes e planejar o proximo mes.
                """);
        }

        private async Task SendAsync(string toEmail, string subject, string body)
        {
            var host = _configuration["Smtp:Host"];
            var fromEmail = _configuration["Smtp:FromEmail"];

            if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(fromEmail))
            {
                throw new InvalidOperationException("SMTP nao configurado.");
            }

            var port = _configuration.GetValue("Smtp:Port", 587);
            var username = _configuration["Smtp:Username"];
            var password = _configuration["Smtp:Password"];
            var fromName = _configuration["Smtp:FromName"] ?? "Finova";
            var enableSsl = _configuration.GetValue("Smtp:EnableSsl", true);

            using var message = new MailMessage
            {
                From = new MailAddress(fromEmail, fromName),
                Subject = subject,
                Body = body,
                IsBodyHtml = false
            };

            message.To.Add(toEmail);

            using var client = new SmtpClient(host, port)
            {
                EnableSsl = enableSsl
            };

            if (!string.IsNullOrWhiteSpace(username))
            {
                client.Credentials = new NetworkCredential(username, password);
            }

            await client.SendMailAsync(message);
        }
    }
}
