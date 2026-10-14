using System.Threading.Channels;
using SoftSupport.Application.Abstractions;

namespace SoftSupport.Infrastructure.Mail;

public sealed class ChannelEmailQueue : IEmailQueue
{
    private readonly Channel<EmailMessage> channel = Channel.CreateUnbounded<EmailMessage>(
        new UnboundedChannelOptions { SingleReader = true });

    public ChannelReader<EmailMessage> Reader => channel.Reader;

    public void Enqueue(EmailMessage message) => channel.Writer.TryWrite(message);
}
