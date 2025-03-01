using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

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

