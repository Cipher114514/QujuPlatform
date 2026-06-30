package com.example.demo.ai;

import com.example.demo.dto.AiGenerateRequest;
import com.example.demo.dto.AiGenerateResponse;
import com.example.demo.entity.ActivityTemplate;
import com.example.demo.repository.ActivityTemplateRepository;

import java.util.*;

/**
 * 模板 AI Provider（降级方案）
 * 当真实 AI API 不可用时，使用预设模板 + 占位符替换模拟生成
 */
public class TemplateProvider implements AiProvider {

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

    public TemplateProvider(ActivityTemplateRepository templateRepository) {
        this.templateRepository = templateRepository;
    }

    @Override
    public AiGenerateResponse generate(AiGenerateRequest request) {
        List<ActivityTemplate> templates = templateRepository.findByCategory(request.getCategory());
        if (templates.isEmpty()) {
            templates = templateRepository.findAll();
        }

        ActivityTemplate template = templates.get(new Random().nextInt(templates.size()));

        String title = replacePlaceholders(template.getTitleTemplate(), request.getTopic());
        String description = replacePlaceholders(template.getDescriptionTemplate(), request.getTopic());

        List<String> tags = CATEGORY_TAGS.getOrDefault(request.getCategory(),
            CATEGORY_TAGS.get(template.getCategory()));
        if (tags == null) tags = List.of(request.getTopic());

        String location = CATEGORY_LOCATION.getOrDefault(request.getCategory(),
            CATEGORY_LOCATION.getOrDefault(template.getCategory(), "待定"));

        return new AiGenerateResponse(title, description, tags, location);
    }

    private String replacePlaceholders(String template, String topic) {
        return template
            .replace("{主题}", topic)
            .replace("{目的地}", topic)
            .replace("{游戏名}", topic)
            .replace("{区域}", topic)
            .replace("{公里数}", "5");
    }
}
