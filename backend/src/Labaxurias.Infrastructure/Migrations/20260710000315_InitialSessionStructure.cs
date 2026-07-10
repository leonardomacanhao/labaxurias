using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Labaxurias.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialSessionStructure : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Mediums",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Mediums", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Sessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Date = table.Column<DateTime>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Sessions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SpiritualGuides",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    MediumId = table.Column<Guid>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SpiritualGuides", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SpiritualGuides_Mediums_MediumId",
                        column: x => x.MediumId,
                        principalTable: "Mediums",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SessionEntities",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    SessionId = table.Column<Guid>(type: "TEXT", nullable: false),
                    SpiritualGuideId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Order = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SessionEntities", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SessionEntities_Sessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "Sessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SessionEntities_SpiritualGuides_SpiritualGuideId",
                        column: x => x.SpiritualGuideId,
                        principalTable: "SpiritualGuides",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "QueueItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    SpiritualGuideId = table.Column<Guid>(type: "TEXT", nullable: true),
                    SessionEntityId = table.Column<Guid>(type: "TEXT", nullable: true),
                    ClientName = table.Column<string>(type: "TEXT", nullable: false),
                    Order = table.Column<int>(type: "INTEGER", nullable: false),
                    IsCalled = table.Column<bool>(type: "INTEGER", nullable: false),
                    CalledAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QueueItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QueueItems_SessionEntities_SessionEntityId",
                        column: x => x.SessionEntityId,
                        principalTable: "SessionEntities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_QueueItems_SpiritualGuides_SpiritualGuideId",
                        column: x => x.SpiritualGuideId,
                        principalTable: "SpiritualGuides",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_QueueItems_SessionEntityId",
                table: "QueueItems",
                column: "SessionEntityId");

            migrationBuilder.CreateIndex(
                name: "IX_QueueItems_SpiritualGuideId",
                table: "QueueItems",
                column: "SpiritualGuideId");

            migrationBuilder.CreateIndex(
                name: "IX_SessionEntities_SessionId",
                table: "SessionEntities",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_SessionEntities_SpiritualGuideId",
                table: "SessionEntities",
                column: "SpiritualGuideId");

            migrationBuilder.CreateIndex(
                name: "IX_SpiritualGuides_MediumId",
                table: "SpiritualGuides",
                column: "MediumId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "QueueItems");

            migrationBuilder.DropTable(
                name: "SessionEntities");

            migrationBuilder.DropTable(
                name: "Sessions");

            migrationBuilder.DropTable(
                name: "SpiritualGuides");

            migrationBuilder.DropTable(
                name: "Mediums");
        }
    }
}
