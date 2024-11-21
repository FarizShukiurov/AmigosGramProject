namespace AmigosGramProject.Server.DTOs
{
    public class ResetPasswordDTO
    {
        public string Token { get; set; }
        public string OldPassword { get; set; }
        public string NewPassword { get; set; }
        public string ConfirmNewPassword { get; set; }
    }

}
