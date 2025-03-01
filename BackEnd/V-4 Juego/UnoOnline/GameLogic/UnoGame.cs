using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Net.WebSockets;
using System.Numerics;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using UnoOnline.Interfaces;
using UnoOnline.Repositories;
using UnoOnline.WebSockets;

namespace UnoOnline.GameLogic
{
    public class UnoGame
    {
        private List<Player> players;
        private int currentPlayerIndex;
        private Stack<Card> deck;
        private List<WebSocket> sockets;
        private Card currentCard;
        private SemaphoreSlim turnSemaphore = new SemaphoreSlim(1, 1);
        private readonly GameRoomRepository _gameRoomRepository;
        private readonly UserRepository _userRepository;
        private readonly WebSocketHandler _webSocketHandler;
        private string forcedColor = null;

        public UnoGame(GameRoomRepository gameRoomRepository, UserRepository userRepository, WebSocketHandler webSocketHandler)
        {
            players = new List<Player>();
            sockets = new List<WebSocket>();
            _gameRoomRepository = gameRoomRepository;
            _userRepository = userRepository;
            _webSocketHandler = webSocketHandler;
        }

        public void StartGame(List<WebSocket> playerSockets)
        {
            sockets = playerSockets; // Se asignan los WebSockets
            InitializeGame(); // Se inicia la partida con los sockets asignados
        }

        //private void InitializeGame()
        //{
        //    deck = GenerateDeck();
        //    deck = ShuffleDeck(deck);

        //    for (int i = 0; i < sockets.Count; i++)
        //    {
        //        players.Add(new Player($"Player {i + 1}", sockets[i], DrawStartingHand()));
        //    }

        //    currentCard = deck.Pop();
        //    currentPlayerIndex = new Random().Next(players.Count);
        //    SendGameStateToPlayers();
        //}

        private void InitializeGame()
        {
            deck = GenerateDeck();
            deck = ShuffleDeck(deck);

            for (int i = 0; i < sockets.Count; i++)
            {
                players.Add(new Player($"Player {i + 1}", sockets[i], DrawStartingHand()));
            }

            // Asegurar que la carta inicial no es especial
            do
            {
                currentCard = deck.Pop();
                if (IsSpecialCard(currentCard))
                {
                    deck.Push(currentCard);
                    deck = ShuffleDeck(deck);
                }
            } while (IsSpecialCard(currentCard));

            currentPlayerIndex = new Random().Next(players.Count);
            SendGameStateToPlayers();
        }

        private bool IsSpecialCard(Card card)
        {
            return card.Value == "+2" || card.Value == "+4" || card.Value == "Skip" || card.Value == "Reverse" || card.Value == "Wild";
        }


        private Stack<Card> GenerateDeck()
        {
            Stack<Card> newDeck = new Stack<Card>();
            string[] colors = { "Red", "Green", "Blue", "Yellow" };
            string[] specialCards = { "+2", "Skip", "Reverse" };

            foreach (var color in colors)
            {
                for (int i = 1; i <= 9; i++)
                {
                    newDeck.Push(new Card(color, i.ToString()));
                }

                foreach (var special in specialCards)
                {
                    newDeck.Push(new Card(color, special));
                }
            }

            for (int i = 0; i < 4; i++)
            {
                newDeck.Push(new Card("Wild", "+4"));
            }

            return newDeck;
        }

        private Stack<Card> ShuffleDeck(Stack<Card> deck)
        {
            return new Stack<Card>(deck.OrderBy(x => Guid.NewGuid()));
        }

        private List<Card> DrawStartingHand()
        {
            List<Card> hand = new List<Card>();
            for (int i = 0; i < 7; i++)
            {
                hand.Add(deck.Pop());
            }
            return hand;
        }

        // Versión sin parámetros (para InitializeGame)
        private async Task SendGameStateToPlayers()
        {
            var options = new JsonSerializerOptions
            {
                Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
            };

            foreach (var player in players)
            {
                var state = new
                {
                    currentPlayer = players[currentPlayerIndex].Name,
                    topCard = currentCard,
                    yourHand = player.Hand.Select(c => new { c.Color, c.Value })
                };

                string message = JsonSerializer.Serialize(state, options);
                await player.SendMessage(message);
            }

            var currentPlayerSocket = players[currentPlayerIndex].Socket;
            if (currentPlayerSocket.State == WebSocketState.Open)
            {
                await currentPlayerSocket.SendAsync(
                    Encoding.UTF8.GetBytes("YourTurn"),
                    WebSocketMessageType.Text,
                    true,
                    CancellationToken.None
                );
            }
        }

        // Versión con roomId (para HandlePlayerAction)
        private async Task SendGameStateToPlayers(string roomId)
        {
            var options = new JsonSerializerOptions
            {
                Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
            };

            foreach (var player in players)
            {
                var state = new
                {
                    roomId = roomId, // ✅ Incluimos roomId solo en esta versión
                    currentPlayer = players[currentPlayerIndex].Name,
                    topCard = currentCard,
                    yourHand = player.Hand.Select(c => new { c.Color, c.Value })
                };

                string message = JsonSerializer.Serialize(state, options);
                await player.SendMessage(message);
            }

            var currentPlayerSocket = players[currentPlayerIndex].Socket;
            if (currentPlayerSocket.State == WebSocketState.Open)
            {
                await currentPlayerSocket.SendAsync(
                    Encoding.UTF8.GetBytes("YourTurn"),
                    WebSocketMessageType.Text,
                    true,
                    CancellationToken.None
                );
            }
        }


        private int drawStack = 0;

        private string lastAccumulatedCard = "";

        public async Task HandlePlayerAction(WebSocket socket, string message, string roomId, int playerId)
        {
            await turnSemaphore.WaitAsync();
            try
            {
                var player = players.FirstOrDefault(p => p.Socket == socket);
                if (player == null || players[currentPlayerIndex] != player)
                    return;

                var action = JsonSerializer.Deserialize<PlayerAction>(message);

                // 🃏 El jugador juega una carta
                if (action.PlayedCard != null && IsValidMove(action.PlayedCard))
                {
                    player.Hand.Remove(action.PlayedCard);
                    currentCard = action.PlayedCard;

                    if (forcedColor != null && action.PlayedCard.Color == forcedColor)
                    {
                        forcedColor = null; // 🔹 Se elimina la restricción cuando se juega el color correcto
                    }

                    // 🏁 Verificar si el jugador ha ganado
                    if (!player.Hand.Any())
                    {
                        Console.WriteLine($"🏆 {player.Name} ha ganado la partida!");
                        await _webSocketHandler.BroadcastToPlayers(players, $"Winner|{player.Name}");
                        await EndGame(roomId, playerId);
                        return;
                    }

                    // ♻️ Manejar acumulación de cartas en +2 y +4
                    if (action.PlayedCard.Value == "+2")
                    {
                        drawStack += 2;
                        lastAccumulatedCard = "+2"; // 📌 Marcar que el último acumulado fue +2
                    }
                    else if (action.PlayedCard.Value == "+4")
                    {
                        drawStack += 4;
                        lastAccumulatedCard = "+4"; // 📌 Marcar que el último acumulado fue +4
                    }
                    else
                    {
                        drawStack = 0; // 🔹 Si no es una carta de acumulación, se resetea
                        lastAccumulatedCard = "";
                    }

                    HandleSpecialCard(action.PlayedCard);

                    // ✅ Si el último acumulado fue un +4 y el siguiente jugador no pudo continuar, el que jugó el +4 elige color
                    if (lastAccumulatedCard == "+4" && drawStack == 0)
                    {
                        await AskPlayerForColor(players[currentPlayerIndex].Socket);
                    }

                    NextTurn();
                }
                // 🃏 El jugador roba cartas acumuladas si no tiene para responder
                else if (action.DrawCard)
                {
                    if (drawStack > 0) // 🔹 Si hay cartas acumuladas, se las chupa todas
                    {
                        for (int i = 0; i < drawStack; i++)
                        {
                            player.Hand.Add(deck.Pop());
                        }
                        drawStack = 0; // 🔹 Se reinicia el contador después de robar
                        lastAccumulatedCard = ""; // 🔹 Ya no hay acumulación activa

                        // ✅ Si el último acumulado fue un +4, ahora se elige el color
                        if (lastAccumulatedCard == "+4")
                        {
                            await AskPlayerForColor(players[(currentPlayerIndex + 1) % players.Count].Socket);
                        }
                    }
                    else
                    {
                        player.Hand.Add(deck.Pop());
                    }
                    NextTurn();
                }

                // 📤 Enviar el estado actualizado a todos los jugadores
                await SendGameStateToPlayers(roomId);
            }
            finally
            {
                turnSemaphore.Release();
            }
        }

        public async Task SetNewColor(string roomId, string newColor)
        {
            if (newColor != "Red" && newColor != "Green" && newColor != "Blue" && newColor != "Yellow")
            {
                Console.WriteLine("⚠️ Color inválido elegido. No se cambiará.");
                return;
            }

            Console.WriteLine($"🎨 El siguiente jugador solo puede jugar cartas {newColor}");
            forcedColor = newColor; // ✅ Se establece la restricción de color

            // 📤 Enviar el estado actualizado a todos los jugadores con el nuevo color obligatorio
            await SendGameStateToPlayers(roomId);
        }



        private async Task AskPlayerForColor(WebSocket playerSocket)
        {
            if (playerSocket.State == WebSocketState.Open)
            {
                await playerSocket.SendAsync(
                    Encoding.UTF8.GetBytes("ChooseColor"), // 📩 Enviar mensaje para elegir color
                    WebSocketMessageType.Text,
                    true,
                    CancellationToken.None
                );
            }
        }



        public bool IsValidMove(Card card)
        {
            // ✅ Si hay un color forzado por un +4, solo se pueden jugar cartas de ese color o un comodín
            if (forcedColor != null)
            {
                return card.Color == forcedColor || card.Color == "Wild";
            }

            // ✅ Si no hay restricción, se juega normalmente
            return card.Color == currentCard.Color || card.Value == currentCard.Value || card.Color == "Wild";
        }


        //private void HandleSpecialCard(Card card)
        //{
        //    if (card.Value == "Skip")
        //    {
        //        NextTurn();
        //    }
        //    else if (card.Value == "Reverse")
        //    {
        //        players.Reverse();
        //        currentPlayerIndex = players.Count - 1 - currentPlayerIndex;
        //    }
        //    else if (card.Value == "+2")
        //    {
        //        players[(currentPlayerIndex + 1) % players.Count].Hand.Add(deck.Pop());
        //        players[(currentPlayerIndex + 1) % players.Count].Hand.Add(deck.Pop());
        //    }
        //    else if (card.Value == "+4")
        //    {
        //        players[(currentPlayerIndex + 1) % players.Count].Hand.Add(deck.Pop());
        //        players[(currentPlayerIndex + 1) % players.Count].Hand.Add(deck.Pop());
        //        players[(currentPlayerIndex + 1) % players.Count].Hand.Add(deck.Pop());
        //        players[(currentPlayerIndex + 1) % players.Count].Hand.Add(deck.Pop());
        //    }
        //}

        private void HandleSpecialCard(Card card)
        {
            if (card.Value == "Skip")
            {
                NextTurn();
            }
            else if (card.Value == "Reverse")
            {
                players.Reverse();
                currentPlayerIndex = players.Count - 1 - currentPlayerIndex;
            }
            else if (card.Value == "+2")
            {
                // 🔹 Se maneja en HandlePlayerAction con drawStack
            }
            else if (card.Value == "+4")
            {
                // 🔹 Se maneja en HandlePlayerAction con drawStack

                // ✅ El jugador elige un nuevo color
                var currentPlayerSocket = players[currentPlayerIndex].Socket;
                if (currentPlayerSocket.State == WebSocketState.Open)
                {
                    currentPlayerSocket.SendAsync(
                        Encoding.UTF8.GetBytes("ChooseColor"),
                        WebSocketMessageType.Text,
                        true,
                        CancellationToken.None
                    );
                }
            }
        }


        private async Task EndGame(string roomId, int winnerId)
        {
            // 1. Elimina la sala de matchmaking
            bool roomDeleted = await _gameRoomRepository.DeleteRoomAsync(roomId);
            Console.WriteLine(roomDeleted ? $"✅ Sala {roomId} eliminada." : $"⚠️ No se encontró la sala {roomId}.");

            // 2. Suma una victoria al jugador ganador (si hay un ganador)
            if (winnerId != 0)
            {
                bool victoryAdded = await _userRepository.AddVictoryAsync(winnerId);
                Console.WriteLine(victoryAdded ? $"🏆 Victoria sumada al jugador {winnerId}." : $"⚠️ No se encontró al jugador {winnerId}.");
            }
        }

        public void SetForcedColor(string color)
        {
            forcedColor = color;
            Console.WriteLine($"🎨 Color forzado actualizado a {forcedColor}");
        }


        private void NextTurn()
        {
            currentPlayerIndex = (currentPlayerIndex + 1) % players.Count;
        }
    }
}
