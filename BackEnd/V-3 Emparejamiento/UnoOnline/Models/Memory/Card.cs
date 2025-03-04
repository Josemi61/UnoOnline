namespace UnoOnline.Models.Memory
{
    public class Card
    {
        public int Value { get; private set; }
        public bool IsFlipped { get; set; }
        public bool IsMatched { get; set; }

        public Card(int value)
        {
            Value = value;
            IsFlipped = false;
            IsMatched = false;
        }
    }
}