namespace SoftSupport.Application;

public sealed class SoftSupportOptions
{
    public const string SectionName = "SoftSupport";

    public string DefaultPassword { get; set; } = "123";

    public string CustomerPortalUrl { get; set; } = "https://softwell.cloud/SoftBdc";

    public bool ContractAlertsEnabled { get; set; } = true;
}
