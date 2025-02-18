namespace UnoOnline.Models.Memory
{
    public class GameResult
    {
        public Guid GameId { get; set; }
        public string Player1 { get; set; }
        public string Player2 { get; set; }
        public int ScorePlayer1 { get; set; }
        public int ScorePlayer2 { get; set; }
        public string Winner { get; set; }
        public DateTime DatePlayed { get; set; }
    }
}