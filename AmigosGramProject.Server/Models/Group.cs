namespace AmigosGramProject.Server.Models
{
    public class Group
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public string AdminId { get; set; }
        public DateTime CreatedDate { get; set; }
        public ICollection<GroupMember> Members { get; set; } = new List<GroupMember>();
    }
}
