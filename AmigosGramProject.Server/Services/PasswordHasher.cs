using Org.BouncyCastle.Crypto.Generators;

namespace AmigosGramProject.Server.Services
{
    public class PasswordHasher
    {
        public string Generate(string password) =>
           BCrypt.Net.BCrypt.EnhancedHashPassword(password);

        public bool Verify(string password, string hashedPassword) =>
            BCrypt.Net.BCrypt.EnhancedVerify(password, hashedPassword);
    }
}
