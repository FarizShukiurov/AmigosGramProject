using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AmigosGramProject.Server.Migrations
{
    /// <inheritdoc />
    public partial class encryptUrls : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "MediaUrls",
                table: "Messages",
                newName: "MediaUrlsForSender");

            migrationBuilder.RenameColumn(
                name: "FileUrls",
                table: "Messages",
                newName: "MediaUrlsForReceiver");

            migrationBuilder.AddColumn<string>(
                name: "FileUrlsForReceiver",
                table: "Messages",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FileUrlsForSender",
                table: "Messages",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FileUrlsForReceiver",
                table: "Messages");

            migrationBuilder.DropColumn(
                name: "FileUrlsForSender",
                table: "Messages");

            migrationBuilder.RenameColumn(
                name: "MediaUrlsForSender",
                table: "Messages",
                newName: "MediaUrls");

            migrationBuilder.RenameColumn(
                name: "MediaUrlsForReceiver",
                table: "Messages",
                newName: "FileUrls");
        }
    }
}
