using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AmigosGramProject.Server.Migrations
{
    /// <inheritdoc />
    public partial class SSSex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "GroupId",
                table: "GroupMessages",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.CreateIndex(
                name: "IX_GroupMembers_GroupId",
                table: "GroupMembers",
                column: "GroupId");

            migrationBuilder.AddForeignKey(
                name: "FK_GroupMembers_Groups_GroupId",
                table: "GroupMembers",
                column: "GroupId",
                principalTable: "Groups",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_GroupMembers_Groups_GroupId",
                table: "GroupMembers");

            migrationBuilder.DropIndex(
                name: "IX_GroupMembers_GroupId",
                table: "GroupMembers");

            migrationBuilder.AlterColumn<int>(
                name: "GroupId",
                table: "GroupMessages",
                type: "int",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");
        }
    }
}
