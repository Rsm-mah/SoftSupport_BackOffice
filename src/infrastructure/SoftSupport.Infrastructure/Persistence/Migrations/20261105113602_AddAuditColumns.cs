using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SoftSupport.Infrastructure.Persistence.Migrations
{
    public partial class AddAuditColumns : Migration
    {
        private static readonly string[] NewAuditTables = ["Companies", "Customers", "Roles", "Departements"];

        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "DateCreated",
                table: "Users",
                newName: "created_at");

            migrationBuilder.AddColumn<DateTime>(
                name: "updated_at",
                table: "Users",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "SYSDATETIME()");

            migrationBuilder.Sql("UPDATE dbo.Users SET updated_at = created_at;");

            migrationBuilder.AddColumn<bool>(
                name: "isDeleted",
                table: "Users",
                type: "bit",
                nullable: false,
                defaultValue: false);

            // Valeurs par défaut SQL : l'ancien BDC insère encore sans renseigner ces colonnes.
            foreach (var table in NewAuditTables)
            {
                migrationBuilder.AddColumn<DateTime>(
                    name: "created_at",
                    table: table,
                    type: "datetime2",
                    nullable: false,
                    defaultValueSql: "SYSDATETIME()");

                migrationBuilder.AddColumn<DateTime>(
                    name: "updated_at",
                    table: table,
                    type: "datetime2",
                    nullable: false,
                    defaultValueSql: "SYSDATETIME()");

                migrationBuilder.AddColumn<bool>(
                    name: "isDeleted",
                    table: table,
                    type: "bit",
                    nullable: false,
                    defaultValue: false);
            }
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            foreach (var table in NewAuditTables)
            {
                migrationBuilder.DropColumn(name: "created_at", table: table);
                migrationBuilder.DropColumn(name: "updated_at", table: table);
                migrationBuilder.DropColumn(name: "isDeleted", table: table);
            }

            migrationBuilder.DropColumn(name: "updated_at", table: "Users");
            migrationBuilder.DropColumn(name: "isDeleted", table: "Users");

            migrationBuilder.RenameColumn(
                name: "created_at",
                table: "Users",
                newName: "DateCreated");
        }
    }
}
