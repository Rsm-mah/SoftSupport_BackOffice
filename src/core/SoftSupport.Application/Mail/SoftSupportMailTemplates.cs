using System.Net;
using SoftSupport.Application.Abstractions;

namespace SoftSupport.Application.Mail;

/// <summary>Gabarits HTML des e-mails envoyés par SoftSupport. Toute valeur injectée est encodée.</summary>
public static class SoftSupportMailTemplates
{
    private const string Signature = "L'équipe Softwell — SoftSupport";

    public static EmailMessage ArticleRefused(string to, string? code, string title, string comment) =>
        new(to, "Notification Base de Connaissance", Layout(
            "Article refusé",
            "<p>Bonjour,</p><p>L'un de vos articles de la base de connaissances a été refusé, avec le commentaire suivant :</p>"
            + Quote(comment),
            Table(("Identifiant", code ?? "—"), ("Titre", title)),
            "Vous le retrouverez dans « Non validés » : corrigez-le puis enregistrez-le pour le soumettre à nouveau."));

    public static EmailMessage ArticleDeleted(string to, string? code, string title, string comment) =>
        new(to, "Notification Base de Connaissance", Layout(
            "Article supprimé",
            "<p>Bonjour,</p><p>L'un de vos articles de la base de connaissances a été supprimé, avec le commentaire suivant :</p>"
            + Quote(comment),
            Table(("Identifiant", code ?? "—"), ("Titre", title)),
            null));

    public static EmailMessage CustomerCredentials(string to, string? firstName, string password, string portalUrl) =>
        new(to, "Login et Mot de passe SOFTSUPPORT", Layout(
            "Vos accès à SOFTSUPPORT",
            $"<p>Bonjour {Encode(firstName)},</p><p>Votre société a désormais accès à la plateforme SOFTSUPPORT : "
            + $"<a href=\"{Encode(portalUrl)}\">{Encode(portalUrl)}</a>.</p><p>Voici vos identifiants :</p>",
            Table(("Login", to), ("Mot de passe", password)),
            "Pour des raisons de sécurité, nous vous recommandons de modifier ce mot de passe dès votre première connexion."));

    public static EmailMessage ContractExpiring(
        IReadOnlyList<string> to,
        string subject,
        string? productName,
        DateTime endDate) =>
        new(to, subject, Layout(
            subject,
            "<p>Bonjour,</p><p>Merci de nous avoir accompagnés jusqu'à présent. Nous vous informons que votre contrat "
            + $"arrive à expiration le <strong>{endDate:dd/MM/yyyy}</strong>.</p>",
            Table(("Produit", productName ?? "—"), ("Échéance", endDate.ToString("dd/MM/yyyy"))),
            "Si vous avez des questions ou besoin de précisions, n'hésitez pas à nous contacter. "
            + "Ceci est un message automatique, merci de ne pas y répondre directement."));

    private static string Layout(string title, string intro, string content, string? outro) =>
        $"""
        <html>
        <body style="font-family: Arial, sans-serif; font-size: 14px; color: #333;">
          <h2 style="color: #0f3d6e;">&#10148; {Encode(title)}</h2>
          {intro}
          {content}
          {(outro is null ? string.Empty : $"<p style=\"margin-top: 15px;\">{Encode(outro)}</p>")}
          <p style="margin-top: 25px;">Cordialement,<br/><strong>{Signature}</strong></p>
        </body>
        </html>
        """;

    private static string Quote(string text) =>
        $"<blockquote style=\"margin: 10px 0; padding: 8px 12px; border-left: 3px solid #0e7490; background: #f0f9ff;\">{Encode(text)}</blockquote>";

    private static string Table(params (string Label, string Value)[] rows) =>
        "<table style=\"border-collapse: collapse; margin-top: 10px;\">"
        + string.Concat(rows.Select(row =>
            $"<tr><td style=\"padding: 6px 10px; font-weight: bold;\">{Encode(row.Label)} :</td>"
            + $"<td style=\"padding: 6px 10px;\">{Encode(row.Value)}</td></tr>"))
        + "</table>";

    private static string Encode(string? value) => WebUtility.HtmlEncode(value ?? string.Empty);
}
