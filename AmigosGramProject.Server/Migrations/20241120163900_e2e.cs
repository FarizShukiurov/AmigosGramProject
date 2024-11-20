using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AmigosGramProject.Server.Migrations
{
    /// <inheritdoc />
    public partial class e2e : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Content",
                table: "Messages",
                newName: "EncryptedForSender");

            migrationBuilder.AddColumn<string>(
                name: "EncryptedForReceiver",
                table: "Messages",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EncryptedForReceiver",
                table: "Messages");

            migrationBuilder.RenameColumn(
                name: "EncryptedForSender",
                table: "Messages",
                newName: "Content");
        }
    }
}
