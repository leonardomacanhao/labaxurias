using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Labaxurias.Api.Modules.Auth.Controllers;

[ApiController]
[Route("api/admin/users")]
[Authorize(Roles = "Admin")]
public class AdminUserController : ControllerBase
{
    private readonly UserManager<IdentityUser> _userManager;

    public AdminUserController(UserManager<IdentityUser> userManager) 
    { 
        _userManager = userManager; 
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var users = _userManager.Users.Select(u => new { u.Id, u.UserName }).ToList();
        return Ok(users);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest request)
    {
        var user = new IdentityUser { UserName = request.Username, Email = request.Username };
        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded) return BadRequest(result.Errors);
        
        await _userManager.AddToRoleAsync(user, "User");
        return Ok(new { message = "Usuário criado com sucesso" });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return NotFound();
        if (user.UserName == "admin") return BadRequest(new { message = "Não é possível excluir o administrador principal." });
        
        await _userManager.DeleteAsync(user);
        return Ok();
    }

    [HttpPost("{id}/reset-password")]
    public async Task<IActionResult> ResetPassword(string id, [FromBody] ResetPasswordRequest request)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null) return NotFound();
        
        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var result = await _userManager.ResetPasswordAsync(user, token, request.NewPassword);
        if (!result.Succeeded) return BadRequest(result.Errors);
        
        return Ok(new { message = "Senha alterada com sucesso" });
    }
}

public class CreateUserRequest 
{ 
    public string Username { get; set; } = ""; 
    public string Password { get; set; } = ""; 
}

public class ResetPasswordRequest 
{ 
    public string NewPassword { get; set; } = ""; 
}
