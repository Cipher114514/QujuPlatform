package com.example.demo.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
public class FileService {

    private final String uploadDir;
    private final RestClient restClient;

    public FileService(@Value("${app.upload.dir:uploads}") String uploadDir,
                       RestClient.Builder restClientBuilder) {
        this.uploadDir = uploadDir;
        this.restClient = restClientBuilder.build();
    }

    public String upload(MultipartFile file, String type) throws IOException {
        Path dir = Paths.get(uploadDir, type);
        Files.createDirectories(dir);

        String originalName = file.getOriginalFilename();
        String ext = "";
        if (originalName != null && originalName.contains(".")) {
            ext = originalName.substring(originalName.lastIndexOf("."));
        }
        String filename = UUID.randomUUID().toString().substring(0, 8) + "_"
                + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")) + ext;

        Path target = dir.resolve(filename);
        file.transferTo(target);

        return "/uploads/" + type + "/" + filename;
    }

    /**
     * 从外部 URL 下载图片并存到本地
     */
    public String downloadFromUrl(String imageUrl) throws IOException {
        // 只处理 http(s) 外部链接
        if (imageUrl == null || (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://"))) {
            return imageUrl;
        }

        // 下载图片，同时校验 Content-Type
        var response = restClient.get()
                .uri(imageUrl)
                .header("User-Agent", "Mozilla/5.0 (compatible; QujuAlbum/1.0)")
                .retrieve()
                .toEntity(byte[].class);

        var contentType = response.getHeaders().getContentType();
        if (contentType != null && !contentType.toString().startsWith("image/")) {
            throw new IOException("链接返回的不是图片（Content-Type: " + contentType + "），请使用图片直链");
        }

        byte[] bytes = response.getBody();
        if (bytes == null || bytes.length == 0) {
            throw new IOException("下载图片失败：响应为空");
        }

        // 二次校验：通过文件头魔数确认是真实图片
        if (!isImageContent(bytes)) {
            throw new IOException("下载的内容不是有效图片，请使用图片直链（右键图片→复制图片地址）");
        }

        // 根据实际内容确定扩展名
        String ext = detectImageExt(bytes);

        // 限制大小 10MB
        if (bytes.length > 10 * 1024 * 1024) {
            throw new IOException("图片大小超过 10MB 限制");
        }

        Path dir = Paths.get(uploadDir, "album");
        Files.createDirectories(dir);

        String filename = UUID.randomUUID().toString().substring(0, 8) + "_"
                + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss")) + ext;

        Path target = dir.resolve(filename);
        Files.write(target, bytes);

        return "/uploads/album/" + filename;
    }

    /** 通过文件头魔数校验是否是真的图片 */
    private boolean isImageContent(byte[] bytes) {
        if (bytes.length < 4) return false;
        // JPEG: FF D8 FF
        if (bytes[0] == (byte) 0xFF && bytes[1] == (byte) 0xD8 && bytes[2] == (byte) 0xFF) return true;
        // PNG: 89 50 4E 47
        if (bytes[0] == (byte) 0x89 && bytes[1] == (byte) 0x50 && bytes[2] == (byte) 0x4E && bytes[3] == (byte) 0x47) return true;
        // GIF: 47 49 46
        if (bytes[0] == (byte) 0x47 && bytes[1] == (byte) 0x49 && bytes[2] == (byte) 0x46) return true;
        // WebP: 52 49 46 46 ... 57 45 42 50
        if (bytes[0] == (byte) 0x52 && bytes[1] == (byte) 0x49 && bytes[2] == (byte) 0x46 && bytes[3] == (byte) 0x46
                && bytes.length >= 12
                && bytes[8] == (byte) 0x57 && bytes[9] == (byte) 0x45 && bytes[10] == (byte) 0x42 && bytes[11] == (byte) 0x50) return true;
        // BMP: 42 4D
        if (bytes[0] == (byte) 0x42 && bytes[1] == (byte) 0x4D) return true;
        return false;
    }

    /** 根据文件头魔数检测真实扩展名 */
    private String detectImageExt(byte[] bytes) {
        if (bytes.length < 4) return ".jpg";
        if (bytes[0] == (byte) 0xFF && bytes[1] == (byte) 0xD8 && bytes[2] == (byte) 0xFF) return ".jpg";
        if (bytes[0] == (byte) 0x89 && bytes[1] == (byte) 0x50) return ".png";
        if (bytes[0] == (byte) 0x47 && bytes[1] == (byte) 0x49) return ".gif";
        if (bytes[0] == (byte) 0x52 && bytes[1] == (byte) 0x49) return ".webp";
        if (bytes[0] == (byte) 0x42 && bytes[1] == (byte) 0x4D) return ".bmp";
        return ".jpg";
    }
}
