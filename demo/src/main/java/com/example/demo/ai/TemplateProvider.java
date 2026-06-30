package com.example.demo.ai;

import com.example.demo.dto.AiGenerateRequest;
import com.example.demo.dto.AiGenerateResponse;
import com.example.demo.entity.ActivityTemplate;
import com.example.demo.repository.ActivityTemplateRepository;

import java.security.SecureRandom;
import java.util.*;

/**
 * 模板 AI Provider（降级方案）
 * 当真实 AI API 不可用时，使用预设模板 + 占位符替换模拟生成
 */
public class TemplateProvider implements AiProvider {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final ActivityTemplateRepository templateRepository;

    private static final Map<String, List<String>> CATEGORY_TAGS = Map.of(
        "sports",    List.of("运动", "健身", "户外"),
        "hiking",    List.of("户外", "徒步", "自然"),
        "boardgame", List.of("桌游", "聚会", "社交"),
        "study",     List.of("学习", "交流", "成长"),
        "charity",   List.of("公益", "志愿", "爱心"),
        "citywalk",  List.of("城市", "探索", "美食")
    );

    private static final Map<String, List<String>> CATEGORY_LOCATIONS = Map.of(
        "sports",    List.of("附近体育馆", "朝阳公园运动场", "市体育中心", "奥体中心综合馆", "社区篮球场"),
        "hiking",    List.of("郊区自然景区", "西山国家森林公园", "长城徒步路线", "香山登山步道", "雁栖湖环湖步道"),
        "boardgame", List.of("附近桌游吧", "三里屯桌游俱乐部", "大学城休闲吧", "CBD社交空间", "创意园区咖啡厅"),
        "study",     List.of("附近咖啡厅", "市图书馆自习室", "大学城共享空间", "创业孵化器路演厅", "文化艺术中心"),
        "charity",   List.of("社区活动中心", "敬老院", "流浪动物救助站", "城市公园", "福利院"),
        "citywalk",  List.of("老城区历史街区", "南锣鼓巷", "武康路/安福路", "沙面岛", "文创园区", "江滨步道", "大学校园")
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

        ActivityTemplate template = templates.get(SECURE_RANDOM.nextInt(templates.size()));

        String title = replacePlaceholders(template.getTitleTemplate(), request.getTopic());
        String description = replacePlaceholders(template.getDescriptionTemplate(), request.getTopic());

        List<String> tags = CATEGORY_TAGS.getOrDefault(request.getCategory(),
            CATEGORY_TAGS.get(template.getCategory()));
        if (tags == null) tags = List.of(request.getTopic());

        List<String> locations = CATEGORY_LOCATIONS.getOrDefault(request.getCategory(),
            CATEGORY_LOCATIONS.get(template.getCategory()));
        String location;
        if (locations != null && !locations.isEmpty()) {
            location = locations.get(SECURE_RANDOM.nextInt(locations.size()));
        } else {
            location = "待定";
        }

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
