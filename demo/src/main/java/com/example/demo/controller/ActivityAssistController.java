package com.example.demo.controller;

import com.example.demo.common.Result;
import com.example.demo.dto.AiGenerateRequest;
import com.example.demo.dto.AiGenerateResponse;
import com.example.demo.entity.Activity;
import com.example.demo.entity.ActivityTemplate;
import com.example.demo.entity.User;
import com.example.demo.repository.ActivityRepository;
import com.example.demo.repository.ActivityTemplateRepository;
import com.example.demo.service.ActivityCloneService;
import com.example.demo.service.AiGenerateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class ActivityAssistController {

    private final AiGenerateService aiGenerateService;
    private final ActivityTemplateRepository templateRepository;
    private final ActivityCloneService cloneService;
    private final ActivityRepository activityRepository;

    /**
     * US-007 AI活动策划
     */
    @PostMapping("/activities/ai-generate")
    public Result<AiGenerateResponse> aiGenerate(@Valid @RequestBody AiGenerateRequest request) {
        AiGenerateResponse result = aiGenerateService.generate(request);
        return Result.ok("生成成功", result);
    }

    /**
     * US-008 获取活动模板列表
     */
    @GetMapping("/activities/templates")
    public Result<List<ActivityTemplate>> getTemplates() {
        List<ActivityTemplate> templates = templateRepository.findAll();
        return Result.ok(templates);
    }

    /**
     * US-009 我创建的活动列表
     */
    @GetMapping("/activities/my")
    public Result<List<Activity>> getMyActivities(@AuthenticationPrincipal User currentUser) {
        List<Activity> activities = activityRepository.findByCreatorIdOrderByCreatedAtDesc(currentUser.getId());
        return Result.ok(activities);
    }

    /**
     * US-009 克隆活动
     */
    @PostMapping("/activities/{id}/clone")
    public Result<Activity> cloneActivity(@PathVariable Long id,
                                          @AuthenticationPrincipal User currentUser) {
        Activity cloned = cloneService.clone(id, currentUser.getId());
        return Result.ok("克隆成功", cloned);
    }
}
