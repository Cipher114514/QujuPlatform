package com.example.demo.controller;

import com.example.demo.common.Result;
import com.example.demo.dto.ActivitySummaryResponse;
import com.example.demo.dto.CreateActivityRequest;
import com.example.demo.entity.Activity;
import com.example.demo.entity.User;
import com.example.demo.service.ActivitySearchService;
import com.example.demo.service.ActivityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/activities")
@RequiredArgsConstructor
public class ActivityController {

    private final ActivityService activityService;
    private final ActivitySearchService activitySearchService;

    @PostMapping
    public Result<Activity> create(@Valid @RequestBody CreateActivityRequest req,
                                   @AuthenticationPrincipal User currentUser) {
        return Result.ok("创建成功", activityService.createActivity(req, currentUser));
    }

    /** m3: 活动列表/搜索 */
    @GetMapping
    public Result<Page<ActivitySummaryResponse>> listActivities(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String tag,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "8") int size) {
        return Result.ok(activitySearchService.searchActivities(keyword, category, tag, startFrom, startTo, page, size));
    }
}
