using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AmigosGramProject.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddConfirmationCodeToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ConfirmationCode",
                table: "AspNetUsers",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ConfirmationCode",
                table: "AspNetUsers");
        }
    }
}
