using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FinanceDashboard.Api.Migrations
{
    public partial class AddPublicDashboardSharing : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "PublicDashboardEnabled",
                table: "Users",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PublicDashboardEnabled",
                table: "Users");
        }
    }
}
