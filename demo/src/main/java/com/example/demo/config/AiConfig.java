package com.example.demo.config;

import com.example.demo.ai.AiProvider;
import com.example.demo.ai.OpenAiCompatibleProvider;
import com.example.demo.ai.TemplateProvider;
import com.example.demo.repository.ActivityTemplateRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Slf4j
@Configuration
public class AiConfig {

    @Bean
    public RestClient.Builder restClientBuilder() {
        return RestClient.builder();
    }

    @Bean
    public ObjectMapper objectMapper() {
        return new ObjectMapper();
    }

    @Bean
    public AiProvider aiProvider(RestClient.Builder restClientBuilder,
                                  ActivityTemplateRepository templateRepository,
                                  ObjectMapper objectMapper,
                                  @Value("${app.ai.provider:template}") String provider,
                                  @Value("${app.ai.openai.base-url:}") String baseUrl,
                                  @Value("${app.ai.openai.api-key:}") String apiKey,
                                  @Value("${app.ai.openai.model:}") String model) {
        if ("openai".equalsIgnoreCase(provider)) {
            if (baseUrl.isBlank() || model.isBlank()) {
                log.warn("OpenAI 兼容配置不完整 (base-url/model 为空)，降级为模板模式");
                return new TemplateProvider(templateRepository);
            }
            log.info("AI Provider: OpenAI 兼容 → {} (model: {})", baseUrl, model);
            return new OpenAiCompatibleProvider(restClientBuilder, baseUrl, apiKey, model, objectMapper);
        }

        log.info("AI Provider: Template（模板模拟模式）");
        return new TemplateProvider(templateRepository);
    }
}
