﻿namespace UnoOnline.Interfaces
{
    public interface IPasswordHasher
    {
        string Hash(string password);
    }
}
