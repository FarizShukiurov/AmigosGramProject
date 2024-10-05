using Azure.Storage.Blobs;
using Microsoft.AspNetCore.Mvc;

namespace AmigosGramProject.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProfileController : ControllerBase
    {
        private readonly string _blobConnectionString;
        private readonly string _containerName;

        public ProfileController(IConfiguration configuration)
        {
            _blobConnectionString = configuration.GetSection("AzureBlobStorage:ConnectionString").Value;
            _containerName = configuration.GetSection("AzureBlobStorage:ContainerName").Value;
        }

        [HttpPost("upload-avatar")]
        public async Task<IActionResult> UploadAvatar(IFormFile avatar)
        {
            if (avatar == null || avatar.Length == 0)
            {
                return BadRequest("Please upload a valid file.");
            }

            try
            {
                var blobServiceClient = new BlobServiceClient(_blobConnectionString);
                var blobContainerClient = blobServiceClient.GetBlobContainerClient(_containerName);

                await blobContainerClient.CreateIfNotExistsAsync();

                var fileName = Guid.NewGuid().ToString() + Path.GetExtension(avatar.FileName);
                var blobClient = blobContainerClient.GetBlobClient(fileName);

                using (var stream = avatar.OpenReadStream())
                {
                    await blobClient.UploadAsync(stream, true);
                }

                var blobUrl = blobClient.Uri.ToString();
                return Ok(new { avatarUrl = blobUrl });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
    }
}
