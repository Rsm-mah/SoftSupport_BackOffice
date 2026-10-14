using SoftSupport.Domain;
using SoftSupport.Domain.Entities;
using SoftSupport.Domain.Rules;

namespace SoftSupport.Domain.Tests;

public sealed class ArticleCodeTests
{
    [Theory]
    [InlineData("SAGCPT", "SAGCPT|")]
    [InlineData("tmtpro", "TMTPRO|")]
    [InlineData(null, "KB|")]
    [InlineData("  ", "KB|")]
    public void PrefixFor_uses_category_code_or_KB(string? categoryCode, string expected) =>
        Assert.Equal(expected, ArticleCode.PrefixFor(categoryCode));

    [Theory]
    [InlineData("SAGCPT|", null, "SAGCPT|00000001")]
    [InlineData("SAGCPT|", "SAGCPT|00000041", "SAGCPT|00000042")]
    [InlineData("TMTPRO|", "TMTPRO|00000057", "TMTPRO|00000058")]
    [InlineData("KB|", "KB|abc", "KB|00000001")]
    public void Next_increments_the_last_number(string prefix, string? last, string expected) =>
        Assert.Equal(expected, ArticleCode.Next(prefix, last));

    [Fact]
    public void Designation_combines_product_version_and_title()
    {
        Assert.Equal("Sage 100 Comptabilité v12 - Clôture", ArticleCode.Designation("Sage 100 Comptabilité", "v12", " Clôture "));
        Assert.Equal("Clôture", ArticleCode.Designation(null, null, "Clôture"));
    }
}

public sealed class ArticleOptionsTests
{
    [Theory]
    [InlineData("1,2,", "1,2")]
    [InlineData("2,", "1,2")]
    [InlineData("1,", "1")]
    [InlineData("", null)]
    [InlineData(null, null)]
    public void Normalize_keeps_client_articles_internal(string? stored, string? expected) =>
        Assert.Equal(expected, ArticleOptions.Normalize(stored));

    [Fact]
    public void From_builds_the_stored_value()
    {
        Assert.Equal("1,2", ArticleOptions.From(interne: false, client: true));
        Assert.Equal("1", ArticleOptions.From(interne: true, client: false));
        Assert.Null(ArticleOptions.From(interne: false, client: false));
    }
}

public sealed class ValidatorDepartementsTests
{
    [Fact]
    public void Parse_ignores_empty_and_invalid_entries() =>
        Assert.Equal([2, 3], ValidatorDepartements.Parse("2,3,,x,"));

    [Fact]
    public void Format_keeps_the_BDC_trailing_comma()
    {
        Assert.Equal("2,3,", ValidatorDepartements.Format([3, 2, 3]));
        Assert.Equal(string.Empty, ValidatorDepartements.Format([]));
    }
}

public sealed class ArticleTests
{
    private static ArticleContent Content(string title = "Titre") =>
        new(title, "<p>Problème</p>", "<p>Solution</p>", "Produit - " + title, 1, null, null, null, null);

    [Fact]
    public void A_new_article_waits_for_validation()
    {
        var article = Article.Create("KB|00000001", Content(), "user", DateTime.Now);
        Assert.True(article.IsEnabled);
        Assert.False(article.IsValidated);
    }

    [Fact]
    public void A_denied_article_returns_to_its_author_and_comes_back_once_corrected()
    {
        var article = Article.Create("KB|00000001", Content(), "user", DateTime.Now);
        article.Deny("Compléter la solution");
        Assert.False(article.IsEnabled);
        Assert.Throws<SoftSupportDomainException>(() => article.Validate(null, "1"));

        article.UpdateByAuthor(Content("Titre corrigé"));
        Assert.True(article.IsEnabled);
    }

    [Fact]
    public void Deny_requires_a_comment()
    {
        var article = Article.Create("KB|00000001", Content(), "user", DateTime.Now);
        Assert.Throws<SoftSupportDomainException>(() => article.Deny("  "));
    }

    [Fact]
    public void Validation_sets_the_diffusion_and_sending_back_clears_it()
    {
        var article = Article.Create("KB|00000001", Content(), "user", DateTime.Now);
        article.Validate(null, "2,");
        Assert.True(article.IsValidated);
        Assert.Equal("1,2", article.Options);

        article.SendBackToValidation();
        Assert.False(article.IsValidated);
        Assert.Null(article.Options);
    }
}

public sealed class ProductCatalogTests
{
    [Theory]
    [InlineData(57, true)]
    [InlineData(80, false)]
    [InlineData(96, false)]
    [InlineData(102, true)]
    [InlineData(103, false)]
    [InlineData(128, false)]
    [InlineData(null, false)]
    public void IsListedCode_matches_the_BDC_ranges(int? code, bool expected) =>
        Assert.Equal(expected, ProductCatalog.IsListedCode(code));

    [Theory]
    [InlineData(57)]
    [InlineData(80)]
    [InlineData(102)]
    [InlineData(128)]
    public void Listed_expression_agrees_with_IsListedCode(int code)
    {
        var product = Product.ImportFromCrm("Produit", 1, null, code);
        Assert.Equal(ProductCatalog.IsListedCode(code), ProductCatalog.Listed.Compile()(product));
    }
}
