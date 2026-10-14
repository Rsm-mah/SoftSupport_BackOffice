namespace SoftSupport.Domain;

public class SoftSupportDomainException(string message) : Exception(message);

public sealed class SoftSupportConflictException(string message) : SoftSupportDomainException(message);
