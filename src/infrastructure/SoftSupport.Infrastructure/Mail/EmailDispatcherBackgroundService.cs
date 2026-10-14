using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SoftSupport.Application.Abstractions;

namespace SoftSupport.Infrastructure.Mail;

public sealed class EmailDispatcherBackgroundService(
    ChannelEmailQueue queue,
    IOptions<SmtpOptions> options,
    ILogger<EmailDispatcherBackgroundService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var message in queue.Reader.ReadAllAsync(stoppingToken))
        {
            await SendAsync(message, stoppingToken);
        }
    }

    private async Task SendAsync(EmailMessage message, CancellationToken cancellationToken)
    {
        var smtp = options.Value;
        if (!smtp.IsConfigured)
        {
            logger.LogWarning("SMTP non configuré : e-mail « {Subject} » non envoyé à {To}", message.Subject, string.Join(", ", message.To));
            return;
        }

        try
        {
            using var client = new SmtpClient(smtp.Host, smtp.Port)
            {
                Credentials = new NetworkCredential(smtp.User, smtp.Password),
                EnableSsl = smtp.EnableSsl,
            };
            using var mail = new MailMessage
            {
                From = new MailAddress(smtp.User, smtp.SenderName),
                Subject = message.Subject,
                Body = message.HtmlBody,
                IsBodyHtml = true,
            };
            foreach (var recipient in message.To.Where(address => !string.IsNullOrWhiteSpace(address)))
            {
                mail.To.Add(recipient);
            }

            await client.SendMailAsync(mail, cancellationToken);
            logger.LogInformation("E-mail « {Subject} » envoyé à {To}", message.Subject, string.Join(", ", message.To));
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            logger.LogError(exception, "Échec d'envoi de l'e-mail « {Subject} » à {To}", message.Subject, string.Join(", ", message.To));
        }
    }
}
