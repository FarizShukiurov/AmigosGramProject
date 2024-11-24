using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

[ApiController]
[Route("api/files")]
public class FilesController : ControllerBase
{
    private readonly BlobServiceClient _blobServiceClient;

    public FilesController(BlobServiceClient blobServiceClient)
    {
        _blobServiceClient = blobServiceClient;
    }

    // Эндпоинт для загрузки файлов
    [HttpPost("upload")]
    public async Task<IActionResult> UploadFile(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("Файл не выбран или пуст.");

        try
        {
            var containerClient = _blobServiceClient.GetBlobContainerClient("files");
            await containerClient.CreateIfNotExistsAsync();

            // Генерация уникального ID и имени файла
            var uniqueId = Guid.NewGuid().ToString();
            var uniqueFileName = $"{uniqueId}_{file.FileName}";
            var blobClient = containerClient.GetBlobClient(uniqueFileName);

            // Загружаем файл
            await using (var stream = file.OpenReadStream())
            {
                await blobClient.UploadAsync(stream, true);
            }

            // Устанавливаем метаданные с уникальным ID
            await blobClient.SetMetadataAsync(new Dictionary<string, string>
        {
            { "UniqueId", uniqueId }
        });

            // Получаем URL загруженного файла
            var fileUrl = blobClient.Uri.ToString();

            // Возвращаем ID, имя файла и URL
            return Ok(new { fileId = uniqueId, fileName = file.FileName, url = fileUrl });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Внутренняя ошибка сервера: {ex.Message}");
        }
    }

    [HttpPost("uploadAudio")]
    public async Task<IActionResult> UploadAudio(IFormFile audioFile)
    {
        if (audioFile == null || audioFile.Length == 0)
            return BadRequest("Файл не выбран или пуст.");

        // Проверяем тип аудиофайла
        var allowedAudioTypes = new[] { "audio/mpeg", "audio/webm", "audio/wav" };
        if (!allowedAudioTypes.Contains(audioFile.ContentType))
            return BadRequest("Неверный формат файла. Разрешены только аудиофайлы.");
        try
        {
            // Подключение к контейнеру Blob Storage
            var containerClient = _blobServiceClient.GetBlobContainerClient("audio");
            await containerClient.CreateIfNotExistsAsync(PublicAccessType.Blob);

            // Генерация уникального ID и имени для файла
            var uniqueId = Guid.NewGuid().ToString();
            var uniqueFileName = $"{uniqueId}_{audioFile.FileName}";
            var blobClient = containerClient.GetBlobClient(uniqueFileName);

            // Загрузка файла в Blob Storage
            await using (var stream = audioFile.OpenReadStream())
            {
                await blobClient.UploadAsync(stream, true);
            }

            // Получаем URL загруженного файла
            var fileUrl = blobClient.Uri.ToString();

            // Возвращаем URL файла вместе с ID и типом файла
            return Ok(new { fileId = uniqueId, fileName = audioFile.FileName, url = fileUrl, fileType = audioFile.ContentType });
        }
        catch (Exception ex)
        {
            // Логируем ошибку и возвращаем 500 ошибку сервера
            return StatusCode(500, $"Внутренняя ошибка сервера: {ex.Message}");
        }
    }


    // Эндпоинт для удаления файла по ID
    // Добавляем этот метод в FilesController
    [HttpDelete("delete/{fileId}")]
    public async Task<IActionResult> DeleteFile(string fileId)
    {
        try
        {
            var containerClient = _blobServiceClient.GetBlobContainerClient("files");

            // Ищем файл по метаданным с UniqueId
            await foreach (var blobItem in containerClient.GetBlobsAsync())
            {
                var blobClient = containerClient.GetBlobClient(blobItem.Name);
                var properties = await blobClient.GetPropertiesAsync();

                if (properties.Value.Metadata.TryGetValue("UniqueId", out var storedId) && storedId == fileId)
                {
                    await blobClient.DeleteAsync();
                    return Ok(new { message = "Файл успешно удалён." });
                }
            }

            return NotFound(new { message = "Файл не найден." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Внутренняя ошибка сервера: {ex.Message}");
        }
    }
}
