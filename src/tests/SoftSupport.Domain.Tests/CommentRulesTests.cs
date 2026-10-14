using SoftSupport.Domain.Entities;
using SoftSupport.Domain.Rules;

namespace SoftSupport.Domain.Tests;

public sealed class CommentRulesTests
{
    [Fact]
    public void The_subject_carries_the_comment_number()
    {
        var subject = CommentReplies.SubjectFor(42);

        Assert.Equal("Réponse à votre commentaire n°42", subject);
        Assert.Equal(42, CommentReplies.CommentIdOf(subject));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("Notification Base de Connaissance")]
    [InlineData("Réponse à votre commentaire n°")]
    [InlineData("Réponse à votre commentaire n°12a")]
    [InlineData("Réponse à votre commentaire n°-3")]
    public void Other_mails_are_not_comment_replies(string? subject) =>
        Assert.Null(CommentReplies.CommentIdOf(subject));

    [Theory]
    [InlineData(0, CommentStatus.Pending)]
    [InlineData(1, CommentStatus.Answered)]
    [InlineData(3, CommentStatus.Answered)]
    public void A_comment_is_answered_once_a_reply_is_sent(int replies, CommentStatus expected) =>
        Assert.Equal(expected, CommentReplies.StatusOf(replies));

    [Fact]
    public void A_reply_is_trimmed_and_linked_to_its_comment()
    {
        var reply = CommentReply.Create(7, " agent@softwell.mg ", "client@societe.mg", "  Merci, c'est corrigé.  ");

        Assert.Equal(7, reply.CommentId);
        Assert.Equal("agent@softwell.mg", reply.From);
        Assert.Equal("Merci, c'est corrigé.", reply.Body);
    }

    [Theory]
    [InlineData("client@societe.mg", "   ")]
    [InlineData("", "Bonjour")]
    public void A_reply_needs_a_message_and_a_recipient(string to, string message) =>
        Assert.Throws<SoftSupportDomainException>(() => CommentReply.Create(1, "agent@softwell.mg", to, message));

    [Fact]
    public void A_reply_cannot_be_too_long() =>
        Assert.Throws<SoftSupportDomainException>(() =>
            CommentReplies.EnsureValidMessage(new string('a', CommentReplies.MaxMessageLength + 1)));
}
