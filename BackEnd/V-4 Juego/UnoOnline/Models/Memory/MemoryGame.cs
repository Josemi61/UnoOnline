﻿using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using UnoOnline.Data;
using UnoOnline.WebSockets;

namespace UnoOnline.Models.Memory
{
    public class MemoryGame
    {
        [Key]
        public Guid GameId { get; private set; } = Guid.NewGuid();

        public string Player1 { get; private set; }
        public string Player2 { get; private set; }
        public string CurrentTurn { get; private set; }
        public bool IsGameOver { get; private set; }

        // ✅ JSON para almacenar los puntajes
        public string ScoresJson { get; private set; }

        [NotMapped]
        public Dictionary<string, int> Scores
        {
            get => ScoresJson == null ? new Dictionary<string, int>() : JsonSerializer.Deserialize<Dictionary<string, int>>(ScoresJson);
            set => ScoresJson = JsonSerializer.Serialize(value);
        }

        [NotMapped]
        public List<Card> Board { get; private set; }

        private static readonly int BoardSize = 36;
        private readonly DataBaseContext _dbContext;
        private readonly SemaphoreSlim _turnSemaphore = new SemaphoreSlim(1, 1);

        // ✅ Constructor sin parámetros para EF Core
        public MemoryGame() { }

        // ✅ Constructor principal para lógica del juego
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
            var cards = pairs.Concat(pairs).OrderBy(x => Guid.NewGuid()).Select(value => new Card { Value = value }).ToList();
            Board = cards;
        }

        public async Task<bool> FlipCard(int index1, int index2, string player, IHubContext<GameHub> hubContext)
        {
            await _turnSemaphore.WaitAsync();
            try
            {
                if (IsGameOver || player != CurrentTurn || index1 == index2 || index1 < 0 || index2 < 0 || index1 >= BoardSize || index2 >= BoardSize)
                    return false;

                var card1 = Board[index1];
                var card2 = Board[index2];

                if (card1.IsMatched || card2.IsMatched)
                    return false;

                card1.IsFlipped = true;
                card2.IsFlipped = true;

                await hubContext.Clients.Group(GameId.ToString()).SendAsync("CardFlipped", index1, index2, player);

                if (card1.Value == card2.Value)
                {
                    card1.IsMatched = true;
                    card2.IsMatched = true;

                    Scores[player]++;
                    ScoresJson = JsonSerializer.Serialize(Scores);

                    await hubContext.Clients.Group(GameId.ToString()).SendAsync("PairMatched", index1, index2, player);
                    CheckGameOver(hubContext);
                    return true;
                }

                CurrentTurn = (CurrentTurn == Player1) ? Player2 : Player1;
                await hubContext.Clients.Group(GameId.ToString()).SendAsync("TurnChanged", CurrentTurn);
                return false;
            }
            finally
            {
                _turnSemaphore.Release();
            }
        }

        private async void CheckGameOver(IHubContext<GameHub> hubContext)
        {
            if (Board.All(c => c.IsMatched))
            {
                IsGameOver = true;
                await SaveGameResultAsync();
                await hubContext.Clients.Group(GameId.ToString()).SendAsync("GameOver", Scores);
            }
        }

        private async Task SaveGameResultAsync()
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
            await _dbContext.SaveChangesAsync();
        }
    }
}
