using System.Text.Json.Serialization;

namespace AmigosGramProject.Server.Models
{
    public class GroupMember
    {
        public Guid Id { get; set; }
        public Guid GroupId {  get; set; }

        [JsonIgnore]
        public Group GroupObj { get; set; }

        public string UserId { get; set; }
        public string EncryptedGroupKey { get; set; }
        public DateTime JoinedAt { get; set; }
    }
}
