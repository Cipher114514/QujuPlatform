package com.example.demo.controller;

import com.example.demo.common.Result;
import com.example.demo.service.ContentFilterService;
import com.example.demo.service.ImageTagService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * AI 内容安全接口（US-010 / US-011-B）
 */
@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
public class AiContentController {

    private final ContentFilterService contentFilterService;
    private final ImageTagService imageTagService;

    /** US-010: 敏感词过滤 */
    @PostMapping("/content-filter")
    public Result<Map<String, Object>> filter(@RequestBody Map<String, String> body) {
        String text = body.get("text");
        if (text == null || text.isBlank()) {
            return Result.ok(Map.of("passed", true));
        }

        ContentFilterService.FilterResult result = contentFilterService.check(text);
        return Result.ok(Map.of(
                "passed", result.passed(),
                "reason", result.reason() != null ? result.reason() : ""
        ));
    }

    /** US-011-B: 图片标签生成 */
    @PostMapping("/image-tags")
    public Result<Map<String, Object>> imageTags(@RequestBody Map<String, String> body) {
        String imageUrl = body.get("imageUrl");
        String type = body.getOrDefault("type", "activity");

        // 从 URL 中提取文件名
        String filename = imageUrl;
        if (imageUrl != null && imageUrl.contains("/")) {
            filename = imageUrl.substring(imageUrl.lastIndexOf('/') + 1);
        }

        List<String> tags = imageTagService.generateTags(filename, type);
        return Result.ok(Map.of("tags", tags));
    }
}
