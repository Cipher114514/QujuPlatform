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

    /** US-009: 修改已发布的活动 */
    @PutMapping("/{id}")
    public Result<Activity> update(@PathVariable Long id,
                                   @Valid @RequestBody CreateActivityRequest req,
                                   @AuthenticationPrincipal User currentUser) {
        return Result.ok("修改成功", activityService.updateActivity(id, req, currentUser));
    }

    /** US-009: 撤销发布 */
    @PutMapping("/{id}/cancel")
    public Result<Void> cancel(@PathVariable Long id,
                               @AuthenticationPrincipal User currentUser) {
        activityService.cancelActivity(id, currentUser);
        return Result.ok();
    }

    /** US-008: 保存草稿（不做时间校验） */
    @PostMapping("/draft")
    public Result<Activity> saveDraft(@RequestBody CreateActivityRequest req,
                                      @AuthenticationPrincipal User currentUser) {
        return Result.ok("草稿已保存", activityService.saveDraft(req, currentUser));
    }

    /** US-008: 更新草稿（不做时间校验，允许任意非空内容） */
    @PutMapping("/{id}/draft")
    public Result<Activity> updateDraft(@PathVariable Long id,
                                       @RequestBody CreateActivityRequest req,
                                       @AuthenticationPrincipal User currentUser) {
        return Result.ok("草稿已更新", activityService.updateDraft(id, req, currentUser));
    }

    /** US-008: 发布草稿（将草稿状态改为ACTIVE） */
    @PostMapping("/{id}/publish")
    public Result<Activity> publishDraft(@PathVariable Long id,
                                         @RequestBody CreateActivityRequest req,
                                         @AuthenticationPrincipal User currentUser) {
        return Result.ok("草稿发布成功", activityService.publishDraft(id, req, currentUser));
    }

    /** US-008: 获取我的草稿列表 */
    @GetMapping("/drafts")
    public Result<java.util.List<Activity>> getDrafts(@AuthenticationPrincipal User currentUser) {
        if (currentUser == null) return Result.fail(401, "请先登录");
        return Result.ok(activityService.getDrafts(currentUser.getId()));
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
            @RequestParam(defaultValue = "8") int size,
            @RequestParam(defaultValue = "newest") String sort) {
        return Result.ok(activitySearchService.searchActivities(keyword, category, tag, startFrom, startTo, page, size, sort));
    }
}
