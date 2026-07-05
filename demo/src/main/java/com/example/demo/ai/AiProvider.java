package com.example.demo.ai;

import com.example.demo.dto.AiGenerateRequest;
import com.example.demo.dto.AiGenerateResponse;

/**
 * AI 活动策划 Provider 接口
 * 支持多种实现：DeepSeek / 模板降级 / 未来扩展更多AI厂商
 */
public interface AiProvider {
    AiGenerateResponse generate(AiGenerateRequest request);
}
