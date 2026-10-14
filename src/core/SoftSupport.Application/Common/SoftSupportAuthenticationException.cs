namespace SoftSupport.Application.Common;

/// <summary>Identifiants refusés à la connexion : renvoyé en 401 par l'API.</summary>
public sealed class SoftSupportAuthenticationException(string message) : Exception(message);
