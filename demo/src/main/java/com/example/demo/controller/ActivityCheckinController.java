package com.example.demo.controller;

import com.example.demo.common.Result;
import com.example.demo.dto.CheckinListResponse;
import com.example.demo.dto.CheckinQrResponse;
import com.example.demo.dto.CheckinRequest;
import com.example.demo.dto.CheckinStatusResponse;
import com.example.demo.entity.User;
import com.example.demo.service.ActivityCheckinService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/activities")
@RequiredArgsConstructor
public class ActivityCheckinController {

    private final ActivityCheckinService activityCheckinService;

    @GetMapping("/{id}/qrcode")
    public Result<CheckinQrResponse> getQrCode(@PathVariable Long id,
                                               @AuthenticationPrincipal User currentUser) {
        return Result.ok(activityCheckinService.createQrToken(id, currentUser));
    }

    @PostMapping("/{id}/checkin")
    public Result<CheckinStatusResponse> checkin(@PathVariable Long id,
                                                 @Valid @RequestBody CheckinRequest request,
                                                 @AuthenticationPrincipal User currentUser) {
        CheckinStatusResponse response = activityCheckinService.checkin(id, currentUser, request.getToken());
        String message = "ALREADY_CHECKED_IN".equals(response.getStatus()) ? "该用户已签到" : "签到成功";
        return Result.ok(message, response);
    }

    @GetMapping("/{id}/checkin/status")
    public Result<CheckinStatusResponse> getStatus(@PathVariable Long id,
                                                   @AuthenticationPrincipal User currentUser) {
        return Result.ok(activityCheckinService.getMyStatus(id, currentUser));
    }

    @GetMapping("/{id}/checkin/list")
    public Result<CheckinListResponse> getList(@PathVariable Long id,
                                               @AuthenticationPrincipal User currentUser) {
        return Result.ok(activityCheckinService.getCheckinList(id, currentUser));
    }
}
