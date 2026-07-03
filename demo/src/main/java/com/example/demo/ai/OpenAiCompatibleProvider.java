package com.example.demo.ai;

import com.example.demo.dto.AiGenerateRequest;
import com.example.demo.dto.AiGenerateResponse;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

/**
 * 通用 OpenAI 兼容 Provider
 * 支持任意兼容 OpenAI Chat Completions API 的模型：
 * - DeepSeek:        baseUrl = https://api.deepseek.com
 * - Ollama 本地:      baseUrl = http://localhost:11434/v1
 * - vLLM 本地:        baseUrl = http://localhost:8000/v1
 * - 通义千问/百川等:  通过 OneAPI 代理统一接入
 */
@Slf4j
public class OpenAiCompatibleProvider implements AiProvider {

    private final RestClient restClient;
    private final String model;
    private final ObjectMapper objectMapper;

    public OpenAiCompatibleProvider(RestClient.Builder builder,
                                    String baseUrl,
                                    String apiKey,
                                    String model,
                                    ObjectMapper objectMapper) {
        var b = builder
                .baseUrl(baseUrl)
                .defaultHeader("Content-Type", "application/json");
        if (apiKey != null && !apiKey.isBlank()) {
            b.defaultHeader("Authorization", "Bearer " + apiKey);
        }
        this.restClient = b.build();
        this.model = model;
        this.objectMapper = objectMapper;
    }

    @Override
    public AiGenerateResponse generate(AiGenerateRequest request) {
        String systemPrompt = """
            你是一个专业的线下活动策划助手。根据用户提供的活动主题和分类，生成一份完整的活动策划方案。

            请严格按照以下JSON格式返回，不要包含任何其他文字：
            {
              "title": "活动标题（15字以内，吸引人）",
              "description": "活动详细描述（80-200字，包含活动亮点、适合人群、注意事项）",
              "tags": ["标签1", "标签2", "标签3", "标签4"],
              "suggestedLocation": "建议的活动地点"
            }

            要求：
            - title 要简洁有力，突出活动主题
            - description 要详细具体，让人看了就想参加
            - tags 要有3-4个，涵盖活动类型、氛围、目标人群
            - suggestedLocation 要根据活动类型给出合理的地点建议
            """;

        String userPrompt = "活动主题：" + request.getTopic() + "\n活动分类：" + getCategoryName(request.getCategory());

        try {
            var body = Map.of(
                "model", model,
                "messages", List.of(
                    Map.of("role", "system", "content", systemPrompt),
                    Map.of("role", "user", "content", userPrompt)
                ),
                "temperature", 0.8,
                "max_tokens", 1024
            );

            String responseBody = restClient.post()
                    .uri("/chat/completions")
                    .body(body)
                    .retrieve()
                    .body(String.class);

            ChatResponse chatResp = objectMapper.readValue(responseBody, ChatResponse.class);
            String content = chatResp.getChoices().get(0).getMessage().getContent();
            log.info("AI 生成完成: {}", content);

            return objectMapper.readValue(content, AiGenerateResponse.class);

        } catch (Exception e) {
            log.error("AI API 调用失败", e);
            throw new RuntimeException("AI生成失败，请稍后重试: " + e.getMessage());
        }
    }

    private String getCategoryName(String category) {
        return switch (category) {
            case "sports" -> "运动健身";
            case "hiking" -> "户外徒步";
            case "boardgame" -> "桌游聚会";
            case "study" -> "学习交流";
            case "charity" -> "公益活动";
            case "citywalk" -> "城市探索";
            default -> category;
        };
    }

    // ---- OpenAI 兼容响应结构 ----
    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    static class ChatResponse {
        private List<Choice> choices;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    static class Choice {
        private Message message;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    static class Message {
        private String content;
    }
}
