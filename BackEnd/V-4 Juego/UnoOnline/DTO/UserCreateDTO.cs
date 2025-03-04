namespace UnoOnline.DTO
{
    public class UserDTO
    {
        public long Id { get; set; }
        public string? Avatar { get; set; }
        public string? Apodo { get; set; }
        public string? Email { get; set; }
        public string? Status { get; set; }
        public string? Role { get; internal set; }
    }

    public class UserCreateDTO
    {
        public long Id { get; set; }//IFormFile?
        public  IFormFile? Avatar { get; set; }
        public string? Apodo { get; set; }
        public string? Email { get; set; }
        public string? Password { get; set; }
        public string Role { get; set; }
    }
    public class UserRoleDTO
    {
        public string Role { get; set; }
    }
}
