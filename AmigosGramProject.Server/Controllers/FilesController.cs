using Azure.Storage.Blobs;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.IO;
using System.Threading.Tasks;

[ApiController]
[Route("api/files")]
public class FilesController : ControllerBase
{
    private readonly BlobServiceClient _blobServiceClient;

    // Внедрение BlobServiceClient через конструктор
    public FilesController(BlobServiceClient blobServiceClient)
    {
        _blobServiceClient = blobServiceClient;
    }

    // Эндпоинт для загрузки файлов
    [HttpPost("upload")]
    public async Task<IActionResult> UploadFile(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("File is not selected or empty.");

        try
        {
            // Получаем контейнер для файлов (если его нет, создаём)
            var containerClient = _blobServiceClient.GetBlobContainerClient("files");
            await containerClient.CreateIfNotExistsAsync();

            // Получаем BlobClient для файла
            var blobClient = containerClient.GetBlobClient(file.FileName);

            // Загружаем файл в Blob Storage
            await using (var stream = file.OpenReadStream())
            {
                await blobClient.UploadAsync(stream, true);
            }

            // Формируем URL загруженного файла
            var fileUrl = blobClient.Uri.ToString();

            // Возвращаем успешный результат с URL файла
            return Ok(new { fileName = file.FileName, url = fileUrl });
        }
        catch (Exception ex)
        {
            // Обработка ошибок
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }
}
