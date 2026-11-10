namespace SoftSupport.Domain.Entities;

public sealed class ArticleVote
{
    public int Id { get; private set; }
    public bool IsLike { get; private set; }
    public int ArticleId { get; private set; }
    public int CustomerId { get; private set; }
}