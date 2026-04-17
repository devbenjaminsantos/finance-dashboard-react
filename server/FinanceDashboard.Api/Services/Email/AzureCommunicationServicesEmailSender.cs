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
                    "Azure Communication Services Email nao configurado. Defina AzureCommunicationServices:Email:ConnectionString.");
            }

            if (string.IsNullOrWhiteSpace(_options.SenderAddress))
            {
                throw new InvalidOperationException(
                    "Azure Communication Services Email nao configurado. Defina AzureCommunicationServices:Email:SenderAddress.");
            }

            _emailClient = new EmailClient(_options.ConnectionString);
        }

        public Task SendPasswordResetEmailAsync(string toEmail, string name, string resetUrl)
        {
            return SendAsync(
                toEmail,
                name,
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
                name,
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
                name,
                $"Alerta de meta mensal - {goalLabel}",
                $"""
                Ola, {name}.

                Sua meta "{goalLabel}" em {monthLabel} atingiu {progressPercent}% do limite definido.

                Valor gasto ate agora: {spentAmount:C}
                Limite planejado: {targetAmount:C}

                Acesse o Finova para revisar suas movimentacoes e ajustar o plano do mes, se necessario.
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
