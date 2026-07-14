using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Labaxurias.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddIsActiveToCatalog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "SpiritualGuides",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Mediums",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "SpiritualGuides");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Mediums");
        }
    }
}
