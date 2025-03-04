namespace UnoOnline.Models
{
    public class User
    {
        public long Id { get; set; } 
        public string Apodo { get; set; }
        public string Email { get; set; }
        public string Avatar { get; set; }
        public string Password { get; set; }
        public string? Role { get; set; }
        public int? victoriasUno { get; set; } = 0;
        public int? victoriasMemory { get; set; } = 0;
        public StatusUser Status { get; set; }
    }
}
