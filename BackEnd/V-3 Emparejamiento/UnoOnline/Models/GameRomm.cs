using System.ComponentModel.DataAnnotations;

namespace UnoOnline.Models
{
    public class GameRoom
    {
        [Key]
        public string RoomId { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public int HostId { get; set; }

        public int? GuestId { get; set; }

        public bool IsActive { get; set; } = true;
    }
}

