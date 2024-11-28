namespace AmigosGramProject.Server.DTOs
{
    public class DeleteMessageDto
    {
        public List<string>? MediaUrls { get; set; }
        public List<string>? FileUrls { get; set; }
        public string? AudioUrl { get; set; }
    }

}
