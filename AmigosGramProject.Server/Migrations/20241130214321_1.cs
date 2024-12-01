using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AmigosGramProject.Server.Migrations
{
    /// <inheritdoc />
    public partial class _1 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "StickerUrl",
                table: "Messages");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "StickerUrl",
                table: "Messages",
                type: "nvarchar(max)",
                nullable: true);
        }
    }
}
