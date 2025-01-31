namespace UnoOnline.Models
{
    public class FriendRequest
    {
        public int Id { get; set; }
        public long SenderId { get; set; }
        public long ReceiverId { get; set; }
        public RequestStatus Status { get; set; }

        public User Sender { get; set; }
        public User Receiver { get; set; }
    }
}
