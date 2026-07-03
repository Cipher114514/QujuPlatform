package com.example.demo.service;

import com.example.demo.ai.AiProvider;
import com.example.demo.dto.AiGenerateRequest;
import com.example.demo.dto.AiGenerateResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AiGenerateService {

    private final AiProvider aiProvider;

    public AiGenerateResponse generate(AiGenerateRequest request) {
        return aiProvider.generate(request);
    }
}
