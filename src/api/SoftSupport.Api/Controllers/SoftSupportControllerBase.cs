using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace SoftSupport.Api.Controllers;

[ApiController]
[Authorize]
[Produces("application/json")]
public abstract class SoftSupportControllerBase : ControllerBase;
