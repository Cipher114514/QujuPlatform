package com.example.demo.controller;

import com.example.demo.common.Result;
import com.example.demo.service.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/upload")
@RequiredArgsConstructor
public class UploadController {

    private final FileService fileService;

    @PostMapping
    public Result<Map<String, Object>> upload(@RequestParam("file") MultipartFile file,
                                               @RequestParam("type") String type) throws IOException {
        String url = fileService.upload(file, type);
        return Result.ok(Map.of(
                "url", url,
                "filename", file.getOriginalFilename(),
                "size", file.getSize(),
                "type", type
        ));
    }
}
