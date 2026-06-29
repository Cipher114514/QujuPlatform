package com.example.demo.service;

import com.example.demo.dto.AiGenerateRequest;
import com.example.demo.dto.AiGenerateResponse;
import com.example.demo.entity.ActivityTemplate;
import com.example.demo.repository.ActivityTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class AiGenerateService {

    private final ActivityTemplateRepository templateRepository;

    private static final Map<String, List<String>> CATEGORY_TAGS = Map.of(
        "sports",    List.of("运动", "健身", "户外"),
        "hiking",    List.of("户外", "徒步", "自然"),
        "boardgame", List.of("桌游", "聚会", "社交"),
        "study",     List.of("学习", "交流", "成长"),
        "charity",   List.of("公益", "志愿", "爱心"),
        "citywalk",  List.of("城市", "探索", "美食")
    );

    private static final Map<String, String> CATEGORY_LOCATION = Map.of(
        "sports",    "附近体育馆",
        "hiking",    "郊区自然景区",
        "boardgame", "附近桌游吧",
        "study",     "附近咖啡厅/图书馆",
        "charity",   "待定",
        "citywalk",  "市中心商业区"
    );

    public AiGenerateResponse generate(AiGenerateRequest request) {
        // 1. 按分类查模板
        List<ActivityTemplate> templates = templateRepository.findByCategory(request.getCategory());

        // 2. 未找到匹配分类则从全部模板中随机取
        if (templates.isEmpty()) {
            templates = templateRepository.findAll();
        }

        // 3. 随机选一条
        ActivityTemplate template = templates.get(new Random().nextInt(templates.size()));

        // 4. 替换占位符
        String title = replacePlaceholders(template.getTitleTemplate(), request.getTopic());
        String description = replacePlaceholders(template.getDescriptionTemplate(), request.getTopic());

        // 5. 生成建议标签和地点
        List<String> tags = CATEGORY_TAGS.getOrDefault(request.getCategory(),
            CATEGORY_TAGS.get(template.getCategory()));
        if (tags == null) {
            tags = List.of(request.getTopic());
        }

        String location = CATEGORY_LOCATION.getOrDefault(request.getCategory(),
            CATEGORY_LOCATION.getOrDefault(template.getCategory(), "待定"));

        return new AiGenerateResponse(title, description, tags, location);
    }

    /**
     * 替换模板中的占位符:
     * {主题}/{目的地}/{游戏名}/{区域} → topic
     * {公里数} → 默认 "5"
     */
    private String replacePlaceholders(String template, String topic) {
        return template
            .replace("{主题}", topic)
            .replace("{目的地}", topic)
            .replace("{游戏名}", topic)
            .replace("{区域}", topic)
            .replace("{公里数}", "5");
    }
}
