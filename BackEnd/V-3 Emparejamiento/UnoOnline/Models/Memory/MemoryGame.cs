// MemoryGame.cs
using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.AspNetCore.SignalR;
using UnoOnline.Data;
using UnoOnline.WebSockets; 

namespace UnoOnline.Models.Memory
{
    public class MemoryGame
    {
        public Guid GameId { get; private set; }
        public string Player1 { get; private set; }
        public string Player2 { get; private set; }
        public string CurrentTurn { get; private set; }
        public List<Card> Board { get; private set; }
        public Dictionary<string, int> Scores { get; private set; }
        public bool IsGameOver { get; private set; }

       private static readonly int BoardSize = 36;
        private readonly DataBaseContext _dbContext;

        public MemoryGame(string player1, string player2, DataBaseContext dbContext)
        {
            GameId = Guid.NewGuid();
            Player1 = player1;
            Player2 = player2;
            CurrentTurn = player1;
            Scores = new Dictionary<string, int> { { player1, 0 }, { player2, 0 } };
            IsGameOver = false;
            _dbContext = dbContext;
            InitializeBoard();
        }
    

        private void InitializeBoard()
        {
            var pairs = Enumerable.Range(1, BoardSize / 2).ToList();
            var cards = pairs.Concat(pairs).OrderBy(x => Guid.NewGuid()).Select(value => new Card(value)).ToList();
            Board = cards;
        }

        public bool FlipCard(int index1, int index2, string player, IHubContext<GameHub> hubContext)
        {
            if (IsGameOver || player != CurrentTurn || index1 == index2 || index1 < 0 || index2 < 0 || index1 >= BoardSize || index2 >= BoardSize)
                return false;

            var card1 = Board[index1];
            var card2 = Board[index2];

            if (card1.IsMatched || card2.IsMatched)
                return false;

            card1.IsFlipped = true;
            card2.IsFlipped = true;

            hubContext.Clients.Group(GameId.ToString()).SendAsync("CardFlipped", index1, index2, player);

            if (card1.Value == card2.Value)
            {
                card1.IsMatched = true;
                card2.IsMatched = true;
                Scores[player]++;
                hubContext.Clients.Group(GameId.ToString()).SendAsync("PairMatched", index1, index2, player);
                CheckGameOver(hubContext);
                return true;
            }

            CurrentTurn = (CurrentTurn == Player1) ? Player2 : Player1;
            hubContext.Clients.Group(GameId.ToString()).SendAsync("TurnChanged", CurrentTurn);
            return false;
        }

        private void CheckGameOver(IHubContext<GameHub> hubContext)
        {
            if (Board.All(c => c.IsMatched))
            {
                IsGameOver = true;
                SaveGameResult();
                hubContext.Clients.Group(GameId.ToString()).SendAsync("GameOver", Scores);
            }
        }

        private void SaveGameResult()
        {
            var gameResult = new GameResult
            {
                GameId = GameId,
                Player1 = Player1,
                Player2 = Player2,
                ScorePlayer1 = Scores[Player1],
                ScorePlayer2 = Scores[Player2],
                Winner = Scores[Player1] > Scores[Player2] ? Player1 : (Scores[Player1] < Scores[Player2] ? Player2 : "Draw"),
                DatePlayed = DateTime.UtcNow
            };

            _dbContext.Set<GameResult>().Add(gameResult);
            _dbContext.SaveChanges();
        }

    }
}