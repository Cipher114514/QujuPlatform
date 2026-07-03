package com.example.demo.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * AI 图片多标签自动分类（US-011-B）
 * 因 qwen 不支持图片识别，采用降级方案：
 * 基于文件名关键词 + 上传分类生成规则标签，每张图至少 3 个。
 */
@Slf4j
@Service
public class ImageTagService {

    private static final Map<String, List<String>> KEYWORD_TAGS = new HashMap<>();
    private static final Map<String, List<String>> TYPE_TAGS = new HashMap<>();
    private static final List<String> DEFAULT_TAGS = List.of("活动", "社交", "生活");

    static {
        KEYWORD_TAGS.put("运动", List.of("运动", "健身", "比赛"));
        KEYWORD_TAGS.put("篮球", List.of("篮球", "运动", "比赛"));
        KEYWORD_TAGS.put("足球", List.of("足球", "运动", "比赛"));
        KEYWORD_TAGS.put("羽毛球", List.of("羽毛球", "运动", "健身"));
        KEYWORD_TAGS.put("瑜伽", List.of("瑜伽", "健身", "健康"));
        KEYWORD_TAGS.put("跑步", List.of("跑步", "运动", "户外"));
        KEYWORD_TAGS.put("徒步", List.of("徒步", "户外", "自然"));
        KEYWORD_TAGS.put("登山", List.of("登山", "户外", "探险"));
        KEYWORD_TAGS.put("骑行", List.of("骑行", "户外", "运动"));
        KEYWORD_TAGS.put("香山", List.of("香山", "徒步", "自然"));
        KEYWORD_TAGS.put("公园", List.of("户外", "自然", "休闲"));
        KEYWORD_TAGS.put("桌游", List.of("桌游", "聚会", "社交"));
        KEYWORD_TAGS.put("狼人杀", List.of("桌游", "聚会", "社交"));
        KEYWORD_TAGS.put("学习", List.of("学习", "交流", "教育"));
        KEYWORD_TAGS.put("读书", List.of("读书", "学习", "文化"));
        KEYWORD_TAGS.put("编程", List.of("编程", "技术", "学习"));
        KEYWORD_TAGS.put("python", List.of("编程", "技术", "学习"));
        KEYWORD_TAGS.put("公益", List.of("公益", "志愿", "社区"));
        KEYWORD_TAGS.put("环保", List.of("环保", "公益", "自然"));
        KEYWORD_TAGS.put("摄影", List.of("摄影", "艺术", "户外"));
        KEYWORD_TAGS.put("美食", List.of("美食", "社交", "生活"));
        KEYWORD_TAGS.put("音乐", List.of("音乐", "艺术", "娱乐"));
        KEYWORD_TAGS.put("宠物", List.of("宠物", "社交", "生活"));
        KEYWORD_TAGS.put("头像", List.of("头像", "个人", "社交"));
        KEYWORD_TAGS.put("封面", List.of("封面", "活动", "宣传"));
        KEYWORD_TAGS.put("活动", List.of("活动", "社交", "聚会"));
        KEYWORD_TAGS.put("聚会", List.of("聚会", "社交", "娱乐"));
        KEYWORD_TAGS.put("城市", List.of("城市", "探索", "户外"));
        KEYWORD_TAGS.put("citywalk", List.of("城市", "探索", "户外"));
        KEYWORD_TAGS.put("户外", List.of("户外", "自然", "运动"));

        TYPE_TAGS.put("activity", List.of("活动", "社交", "聚会"));
        TYPE_TAGS.put("avatar", List.of("头像", "个人", "社交"));
        TYPE_TAGS.put("banner", List.of("封面", "宣传", "活动"));
        TYPE_TAGS.put("gallery", List.of("活动", "花絮", "社交"));
        TYPE_TAGS.put("team", List.of("小队", "团队", "社交"));
    }

    /**
     * 根据文件名和上传类型生成标签（至少 3 个）
     */
    public List<String> generateTags(String filename, String uploadType) {
        List<String> tags = new ArrayList<>();

        // 1. 从文件名提取关键词
        if (filename != null) {
            String name = filename.toLowerCase();
            // 去掉扩展名
            int dot = name.lastIndexOf('.');
            if (dot > 0) name = name.substring(0, dot);

            for (var entry : KEYWORD_TAGS.entrySet()) {
                if (name.contains(entry.getKey())) {
                    for (String tag : entry.getValue()) {
                        if (!tags.contains(tag)) tags.add(tag);
                    }
                }
            }
        }

        // 2. 从上传类型补充
        List<String> typeTags = TYPE_TAGS.getOrDefault(uploadType, DEFAULT_TAGS);
        for (String tag : typeTags) {
            if (!tags.contains(tag)) tags.add(tag);
        }

        // 3. 不足 3 个，用默认补足
        for (String tag : DEFAULT_TAGS) {
            if (tags.size() >= 3) break;
            if (!tags.contains(tag)) tags.add(tag);
        }

        log.info("[图片标签] filename={} type={} tags={}", filename, uploadType, tags);
        return tags;
    }
}
