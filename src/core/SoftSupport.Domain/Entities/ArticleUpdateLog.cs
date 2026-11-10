namespace SoftSupport.Domain.Entities;

public sealed class ArticleUpdateLog
{
    public int Id { get; private set; }
    public DateTime UpdateDate { get; private set; }
    public int ArticleId { get; private set; }

    public static ArticleUpdateLog For(Article article, DateTime now) =>
        new() { ArticleId = article.Id, UpdateDate = now };

    public static ArticleUpdateLog For(int articleId, DateTime now) =>
        new() { ArticleId = articleId, UpdateDate = now };
}