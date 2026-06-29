package com.example.demo.controller;

import com.example.demo.common.Result;
import com.example.demo.dto.CreateActivityRequest;
import com.example.demo.entity.Activity;
import com.example.demo.entity.User;
import com.example.demo.service.ActivityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/activities")
@RequiredArgsConstructor
public class ActivityController {

    private final ActivityService activityService;

    @PostMapping
    public Result<Activity> create(@Valid @RequestBody CreateActivityRequest req,
                                   @AuthenticationPrincipal User currentUser) {
        return Result.ok("创建成功", activityService.createActivity(req, currentUser));
    }
}
