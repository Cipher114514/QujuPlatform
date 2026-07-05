package com.example.demo.controller;

import com.example.demo.common.Result;
import com.example.demo.service.FileService;
import com.example.demo.service.ImageTagService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/upload")
@RequiredArgsConstructor
public class UploadController {

    private final FileService fileService;
    private final ImageTagService imageTagService;

    @PostMapping
    public Result<Map<String, Object>> upload(@RequestParam("file") MultipartFile file,
                                               @RequestParam("type") String type) throws IOException {
        String url = fileService.upload(file, type);

        // US-011-B: 异步生成图片标签（不影响上传响应）
        try {
            List<String> tags = imageTagService.generateTags(file.getOriginalFilename(), type);
        } catch (Exception e) {
            // 标签生成失败不影响上传
        }

        return Result.ok(Map.of(
                "url", url,
                "filename", file.getOriginalFilename(),
                "size", file.getSize(),
                "type", type
        ));
    }
}
