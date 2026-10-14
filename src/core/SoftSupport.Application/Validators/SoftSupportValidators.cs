using FluentValidation;
using SoftSupport.Application.Common;
using SoftSupport.Application.DTOs.Articles;
using SoftSupport.Application.DTOs.Auth;
using SoftSupport.Application.DTOs.Catalog;
using SoftSupport.Application.DTOs.Customers;
using SoftSupport.Application.DTOs.Users;
using SoftSupport.Domain.Rules;

namespace SoftSupport.Application.Validators;

internal static class PagingRules
{
    public static void Apply<T>(AbstractValidator<T> validator)
        where T : PagedQuery
    {
        validator.RuleFor(query => query.Page).GreaterThanOrEqualTo(1);
        validator.RuleFor(query => query.PageSize).InclusiveBetween(1, PagedQuery.MaxPageSize);
    }
}

public sealed class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(request => request.Email).NotEmpty().WithMessage("L'adresse e-mail est obligatoire.");
        RuleFor(request => request.Password).NotEmpty().WithMessage("Le mot de passe est obligatoire.");
    }
}

public sealed class ChangePasswordRequestValidator : AbstractValidator<ChangePasswordRequest>
{
    public ChangePasswordRequestValidator()
    {
        RuleFor(request => request.CurrentPassword).NotEmpty().WithMessage("Le mot de passe actuel est obligatoire.");
        RuleFor(request => request.NewPassword)
            .NotEmpty().WithMessage("Le nouveau mot de passe est obligatoire.")
            .MinimumLength(4).WithMessage("Le nouveau mot de passe doit contenir au moins 4 caractères.")
            .MaximumLength(100);
    }
}

public sealed class CreateUserRequestValidator : AbstractValidator<CreateUserRequest>
{
    public CreateUserRequestValidator()
    {
        RuleFor(request => request.Email).NotEmpty().EmailAddress().WithMessage("Adresse e-mail invalide.").MaximumLength(150);
        RuleFor(request => request.FirstName).MaximumLength(100);
        RuleFor(request => request.LastName).MaximumLength(100);
        RuleFor(request => request.RoleId).GreaterThan(0).WithMessage("Choisir un rôle.");
        RuleFor(request => request.DepartementId).GreaterThan(0).WithMessage("Choisir un département.");
    }
}

public sealed class UpdateUserRequestValidator : AbstractValidator<UpdateUserRequest>
{
    public UpdateUserRequestValidator()
    {
        RuleFor(request => request.FirstName).MaximumLength(100);
        RuleFor(request => request.LastName).MaximumLength(100);
        RuleFor(request => request.RoleId).GreaterThan(0).WithMessage("Choisir un rôle.");
        RuleFor(request => request.DepartementId).GreaterThan(0).WithMessage("Choisir un département.");
    }
}

public sealed class ArticlesQueryValidator : AbstractValidator<ArticlesQuery>
{
    public ArticlesQueryValidator()
    {
        PagingRules.Apply(this);
        RuleFor(query => query.Search).MaximumLength(150);
        RuleFor(query => query.Option)
            .Must(option => option is ArticleOptions.Interne or ArticleOptions.Client)
            .When(query => !string.IsNullOrEmpty(query.Option))
            .WithMessage("Option de diffusion inconnue.");
    }
}

public sealed class SaveArticleRequestValidator : AbstractValidator<SaveArticleRequest>
{
    public SaveArticleRequestValidator()
    {
        RuleFor(request => request.Title).NotEmpty().WithMessage("Le titre est obligatoire.").MaximumLength(500);
        RuleFor(request => request.ProductId).NotNull().WithMessage("Choisir un produit.");
        RuleFor(request => request.Problem).NotEmpty().WithMessage("Décrire le problème.");
        RuleFor(request => request.Solution).NotEmpty().WithMessage("Décrire la solution.");
        RuleFor(request => request.TicketNumber).MaximumLength(100);
        RuleFor(request => request.RequestNumber).MaximumLength(100);
    }
}

public sealed class ValidateArticleRequestValidator : AbstractValidator<ValidateArticleRequest>
{
    public ValidateArticleRequestValidator()
    {
        RuleFor(request => request.Title).NotEmpty().WithMessage("Le titre est obligatoire.").MaximumLength(500);
        RuleFor(request => request.Problem).NotEmpty().WithMessage("Décrire le problème.");
        RuleFor(request => request.Solution).NotEmpty().WithMessage("Décrire la solution.");
        RuleFor(request => request.TicketNumber).MaximumLength(100);
        RuleFor(request => request.RequestNumber).MaximumLength(100);
    }
}

public sealed class ArticleCommentRequestValidator : AbstractValidator<ArticleCommentRequest>
{
    public ArticleCommentRequestValidator()
    {
        RuleFor(request => request.Comment).NotEmpty().WithMessage("Le commentaire est obligatoire.").MaximumLength(2000);
    }
}

public sealed class SaveProductRequestValidator : AbstractValidator<SaveProductRequest>
{
    public SaveProductRequestValidator()
    {
        RuleFor(request => request.Name).NotEmpty().WithMessage("Le nom du produit est obligatoire.").MaximumLength(200);
    }
}

public sealed class SaveNameRequestValidator : AbstractValidator<SaveNameRequest>
{
    public SaveNameRequestValidator()
    {
        RuleFor(request => request.Name).NotEmpty().WithMessage("Le nom est obligatoire.").MaximumLength(200);
    }
}

public sealed class SavePackRequestValidator : AbstractValidator<SavePackRequest>
{
    public SavePackRequestValidator()
    {
        RuleFor(request => request.IncludedProductIds).NotEmpty().WithMessage("Sélectionner au moins un produit inclus.");
    }
}

public sealed class SaveCategoryRequestValidator : AbstractValidator<SaveCategoryRequest>
{
    public SaveCategoryRequestValidator()
    {
        RuleFor(request => request.Name).NotEmpty().WithMessage("Le nom de la catégorie est obligatoire.").MaximumLength(200);
        RuleFor(request => request.Code).NotEmpty().WithMessage("Le code de la catégorie est obligatoire.")
            .MaximumLength(20)
            .Must(code => !code.Contains(ArticleCode.Separator, StringComparison.Ordinal))
            .WithMessage("Le code ne peut pas contenir « | ».");
    }
}

public sealed class ContractInputValidator : AbstractValidator<ContractInput>
{
    public ContractInputValidator()
    {
        RuleFor(contract => contract.ProductId).GreaterThan(0);
        RuleFor(contract => contract.EndDate).GreaterThan(contract => contract.StartDate)
            .WithMessage("La date de fin doit être postérieure à la date de début.");
    }
}

public sealed class AdminCustomerInputValidator : AbstractValidator<AdminCustomerInput>
{
    public AdminCustomerInputValidator()
    {
        RuleFor(admin => admin.Email).EmailAddress().WithMessage("Adresse e-mail de l'administrateur invalide.")
            .When(admin => !string.IsNullOrWhiteSpace(admin.Email));
        RuleFor(admin => admin.FirstName).MaximumLength(100);
        RuleFor(admin => admin.LastName).MaximumLength(100);
    }
}

public sealed class CreateCompanyRequestValidator : AbstractValidator<CreateCompanyRequest>
{
    public CreateCompanyRequestValidator()
    {
        RuleFor(request => request.Name).NotEmpty().WithMessage("Le nom de la société est obligatoire.").MaximumLength(200);
        RuleFor(request => request.ShortName).NotEmpty().WithMessage("Le nom abrégé est obligatoire.").MaximumLength(50);
        RuleFor(request => request.UserNumber).GreaterThanOrEqualTo(0);
        RuleForEach(request => request.Contracts).SetValidator(new ContractInputValidator());
        RuleFor(request => request.Admin!).SetValidator(new AdminCustomerInputValidator()).When(request => request.Admin is not null);
    }
}

public sealed class UpdateCompanyRequestValidator : AbstractValidator<UpdateCompanyRequest>
{
    public UpdateCompanyRequestValidator()
    {
        RuleFor(request => request.ShortName).NotEmpty().WithMessage("Le nom abrégé est obligatoire.").MaximumLength(50);
        RuleFor(request => request.UserNumber).GreaterThanOrEqualTo(0);
        RuleForEach(request => request.Contracts).SetValidator(new ContractInputValidator());
        RuleFor(request => request.Admin!).SetValidator(new AdminCustomerInputValidator()).When(request => request.Admin is not null);
    }
}

public sealed class SaveContractRequestValidator : AbstractValidator<SaveContractRequest>
{
    public SaveContractRequestValidator()
    {
        RuleFor(request => request.ProductId).GreaterThan(0).WithMessage("Choisir un produit.");
        RuleFor(request => request.EndDate).GreaterThan(request => request.StartDate)
            .WithMessage("La date de fin doit être postérieure à la date de début.");
    }
}

public sealed class SaveCustomerRequestValidator : AbstractValidator<SaveCustomerRequest>
{
    public SaveCustomerRequestValidator()
    {
        RuleFor(request => request.Email).NotEmpty().EmailAddress().WithMessage("Adresse e-mail invalide.").MaximumLength(150);
        RuleFor(request => request.FirstName).NotEmpty().WithMessage("Le prénom est obligatoire.").MaximumLength(100);
        RuleFor(request => request.LastName).NotEmpty().WithMessage("Le nom est obligatoire.").MaximumLength(100);
        RuleFor(request => request.Function).MaximumLength(100);
    }
}

public sealed class ContractHistoryQueryValidator : AbstractValidator<ContractHistoryQuery>
{
    public ContractHistoryQueryValidator()
    {
        PagingRules.Apply(this);
        RuleFor(query => query.Search).MaximumLength(150);
    }
}
