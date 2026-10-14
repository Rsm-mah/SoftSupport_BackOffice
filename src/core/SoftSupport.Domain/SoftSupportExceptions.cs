namespace SoftSupport.Domain;

/// <summary>Règle métier violée : renvoyée en 422 par l'API.</summary>
public class SoftSupportDomainException(string message) : Exception(message);

/// <summary>Conflit avec l'état existant (doublon, élément encore utilisé) : renvoyé en 409.</summary>
public sealed class SoftSupportConflictException(string message) : SoftSupportDomainException(message);
