namespace AmigosGramProject.Server.Services
{
    public class UserService
    {
        private readonly PasswordHasher _passwordHasher;
        public UserService(PasswordHasher passwordHasher) 
        {
            _passwordHasher = passwordHasher;
        }
        public async Task Register(string userName, string email, string password)
        {
            var hashedPassword = _passwordHasher.Generate(password);
        }
    }
}
