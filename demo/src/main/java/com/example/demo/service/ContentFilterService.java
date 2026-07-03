package com.example.demo.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * AI 敏感关键词内容前置过滤（US-010）
 * 活动发布/留言提交时调用 AI 判断是否违规，
 * AI 超时 3 秒自动降级为本地关键词黑名单。
 */
@Slf4j
@Service
public class ContentFilterService {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final String aiBaseUrl;
    private final String aiApiKey;
    private final String aiModel;

    public ContentFilterService(RestClient.Builder restClientBuilder,
                                ObjectMapper objectMapper,
                                @Value("${app.ai.openai.base-url:}") String aiBaseUrl,
                                @Value("${app.ai.openai.api-key:}") String aiApiKey,
                                @Value("${app.ai.openai.model:}") String aiModel) {
        this.restClient = restClientBuilder.build();
        this.objectMapper = objectMapper;
        this.aiBaseUrl = aiBaseUrl;
        this.aiApiKey = aiApiKey;
        this.aiModel = aiModel;
    }

    /**
     * 检查文本是否安全
     * @param text 待检查文本
     * @return FilterResult { passed, reason }
     */
    public FilterResult check(String text) {
        return check(text, null);
    }

    /**
     * 检查文本是否安全（带用户ID用于日志）
     */
    public FilterResult check(String text, Long userId) {
        if (text == null || text.isBlank()) {
            return FilterResult.PASS;
        }

        // 先走本地黑名单（毫秒级，零成本）
        FilterResult local = checkLocal(text);
        if (!local.passed()) {
            log.info("[内容过滤] 本地黑名单拦截 userId={} reason={}", userId, local.reason());
            return local;
        }

        // AI 检测（超时 3 秒自动降级）
        try {
            return checkWithAI(text, userId);
        } catch (Exception e) {
            log.warn("[内容过滤] AI 检测失败，降级放行 userId={}: {}", userId, e.getMessage());
            return FilterResult.PASS;
        }
    }

    // ===== AI 检测 =====

    private FilterResult checkWithAI(String text, Long userId) {
        String systemPrompt = """
                你是一个内容安全审核助手。你的任务是判断用户输入的文本是否包含违规内容。
                违规内容包括（但不限于）：
                - 政治敏感言论、颠覆国家政权言论
                - 色情低俗、淫秽内容
                - 人身攻击、辱骂、仇恨言论
                - 违法广告（赌博、诈骗、传销等）
                - 暴力恐怖、教唆犯罪
                - 毒品、枪支等违禁品交易
                
                请只回复 JSON 格式，不要带其他文字：
                {"safe": true/false, "reason": "简短说明（safe为true时可为空）"}
                """;

        String chatUrl = aiBaseUrl;
        if (!chatUrl.endsWith("/")) chatUrl += "/";
        chatUrl += "chat/completions";

        String response = restClient.post()
                .uri(chatUrl)
                .header("Authorization", "Bearer " + aiApiKey)
                .header("Content-Type", "application/json")
                .body(Map.of(
                        "model", aiModel,
                        "messages", List.of(
                                Map.of("role", "system", "content", systemPrompt),
                                Map.of("role", "user", "content", "请审核以下文本是否违规：\n" + text)
                        ),
                        "temperature", 0.1,
                        "max_tokens", 100
                ))
                .retrieve()
                .body(String.class);

        JsonNode json;
        try {
            json = objectMapper.readTree(response);
        } catch (JsonProcessingException e) {
            log.warn("[内容过滤] AI 响应解析失败，降级放行");
            return FilterResult.PASS;
        }
        JsonNode choice = json.path("choices").get(0);
        String content = choice.path("message").path("content").asText();

        // 解析 JSON 回复
        try {
            JsonNode result = objectMapper.readTree(extractJson(content));
            boolean safe = result.path("safe").asBoolean(true);
            String reason = result.path("reason").asText("");

            if (!safe) {
                log.info("[内容过滤] AI 拦截 userId={} reason={}", userId, reason);
            }
            return safe ? FilterResult.PASS : new FilterResult(false, reason);
        } catch (JsonProcessingException e) {
            log.warn("[内容过滤] AI 返回解析失败，降级放行: {}", content);
            return FilterResult.PASS;
        }
    }

    // ===== 本地黑名单 =====

    private static final Set<String> BLACKLIST = Set.of(
            // 政治敏感
            "falun", "法轮", "flg", "六四", "天安门事件",
            // 色情低俗
            "裸聊", "约炮", "一夜情", "嫖娼", "卖淫",
            // 违法广告
            "赌博", "赌场", "六合彩", "时时彩", "网赚日结",
            "传销", "拉人头", "代理加盟",
            // 人身攻击
            "傻逼", "cnm", "操你", "草泥马", "去死吧",
            // 违禁品
            "枪支", "毒品", "冰毒", "摇头丸"
    );

    private FilterResult checkLocal(String text) {
        String lower = text.toLowerCase();
        for (String kw : BLACKLIST) {
            if (lower.contains(kw)) {
                return new FilterResult(false, "包含敏感关键词");
            }
        }
        return FilterResult.PASS;
    }

    // ===== 工具 =====

    private String extractJson(String content) {
        int start = content.indexOf('{');
        int end = content.lastIndexOf('}');
        if (start >= 0 && end > start) {
            return content.substring(start, end + 1);
        }
        return content;
    }

    public record FilterResult(boolean passed, String reason) {
        public static final FilterResult PASS = new FilterResult(true, "");
    }
}
