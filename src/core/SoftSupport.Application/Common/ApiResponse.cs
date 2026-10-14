namespace SoftSupport.Application.Common;

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public IReadOnlyDictionary<string, object?>? MessageArguments { get; set; }
    public T? Data { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public static ApiResponse<T> Ok(T data, string message = "") =>
        new() { Success = true, Data = data, Message = message };

    public static ApiResponse<T> Fail(
        string message,
        IReadOnlyDictionary<string, object?>? messageArguments = null) =>
        new() { Success = false, Message = message, MessageArguments = messageArguments };
}

public class ApiResponse : ApiResponse<object?>
{
    public new static ApiResponse Ok(object? data = null, string message = "") =>
        new() { Success = true, Data = data, Message = message };

    public new static ApiResponse Fail(
        string message,
        IReadOnlyDictionary<string, object?>? messageArguments = null) =>
        new() { Success = false, Message = message, MessageArguments = messageArguments };
}
