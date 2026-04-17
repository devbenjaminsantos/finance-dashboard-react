using Azure;
using Azure.Communication.Email;
using FinanceDashboard.Api.Configuration;
using Microsoft.Extensions.Options;

namespace FinanceDashboard.Api.Services.Email
{
    public class AzureCommunicationServicesEmailSender : IEmailSender
    {
        private readonly AzureCommunicationServicesEmailOptions _options;
        private readonly EmailClient _emailClient;

        public AzureCommunicationServicesEmailSender(
            IOptions<AzureCommunicationServicesEmailOptions> options)
        {
            _options = options.Value;

            if (string.IsNullOrWhiteSpace(_options.ConnectionString))
            {
                throw new InvalidOperationException(
                    "Azure Communication Services Email não configurado. Defina AzureCommunicationServices:Email:ConnectionString.");
            }

            if (string.IsNullOrWhiteSpace(_options.SenderAddress))
            {
                throw new InvalidOperationException(
                    "Azure Communication Services Email não configurado. Defina AzureCommunicationServices:Email:SenderAddress.");
            }

            _emailClient = new EmailClient(_options.ConnectionString);
        }

        public Task SendPasswordResetEmailAsync(string toEmail, string name, string resetUrl)
        {
            return SendAsync(
                toEmail,
                name,
                "Redefinição de senha - Finova",
                $"""
                Olá, {name}.

                Recebemos uma solicitação para redefinir sua senha no Finova.

                Acesse o link abaixo para criar uma nova senha:
                {resetUrl}

                Se você não solicitou essa alteração, ignore este e-mail.
                """);
        }

        public Task SendEmailVerificationAsync(string toEmail, string name, string verificationUrl)
        {
            return SendAsync(
                toEmail,
                name,
                "Confirmação de e-mail - Finova",
                $"""
                Olá, {name}.

                Confirme seu e-mail para ativar sua conta no Finova.

                Acesse o link abaixo para concluir a confirmacao:
                {verificationUrl}

                Se você não criou esta conta, ignore este e-mail.
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
                name,
                $"Alerta de meta mensal - {goalLabel}",
                $"""
                Olá, {name}.

                Sua meta "{goalLabel}" em {monthLabel} atingiu {progressPercent}% do limite definido.

                Valor gasto atá agora: {spentAmount:C}
                Limite planejado: {targetAmount:C}

                Acesse o Finova para revisar suas movimentações e ajustar o plano do mês, se necessário.
                """);
        }

        private async Task SendAsync(string toEmail, string name, string subject, string plainText)
        {
            var emailContent = new EmailContent(subject)
            {
                PlainText = plainText
            };

            var recipients = new EmailRecipients(
                new[]
                {
                    new EmailAddress(toEmail, name)
                });

            var message = new EmailMessage(_options.SenderAddress, recipients, emailContent);

            await _emailClient.SendAsync(WaitUntil.Completed, message);
        }
    }
}
