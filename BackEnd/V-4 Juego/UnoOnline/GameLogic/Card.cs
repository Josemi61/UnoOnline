namespace UnoOnline.GameLogic
{
    public class Card
    {
        public string Color { get; }
        public string Value { get; }

        public Card(string color, string value)
        {
            Color = color;
            Value = value;
        }
    }
}
