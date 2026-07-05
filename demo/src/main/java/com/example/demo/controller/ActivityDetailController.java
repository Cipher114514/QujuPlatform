package com.example.demo.controller;

import com.example.demo.common.Result;
import com.example.demo.dto.ActivityDetailResponse;
import com.example.demo.entity.Registration;
import com.example.demo.entity.User;
import com.example.demo.service.ActivityDetailService;
import com.example.demo.service.RegistrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/activities")
@RequiredArgsConstructor
public class ActivityDetailController {

    private final ActivityDetailService activityDetailService;
    private final RegistrationService registrationService;

    /** 获取活动详情（含当前用户报名状态） */
    @GetMapping("/{id}")
    public Result<ActivityDetailResponse> getDetail(@PathVariable Long id,
                                                     @AuthenticationPrincipal User currentUser) {
        return Result.ok(activityDetailService.getDetail(id, currentUser.getId()));
    }

    /** 报名活动 */
    @PostMapping("/{id}/register")
    public Result<Registration> register(@PathVariable Long id,
                                          @AuthenticationPrincipal User currentUser) {
        Registration reg = registrationService.register(id, currentUser.getId());
        return Result.ok("报名成功", reg);
    }
}
