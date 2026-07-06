package com.example.demo.controller;

import com.example.demo.common.Result;
import com.example.demo.entity.Activity;
import com.example.demo.entity.Registration;
import com.example.demo.entity.User;
import com.example.demo.entity.WaitlistEntry;
import com.example.demo.repository.ActivityRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.RegistrationManageService;
import com.example.demo.service.WaitlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping
@RequiredArgsConstructor
public class RegistrationManageController {

    private final RegistrationManageService registrationManageService;
    private final WaitlistService waitlistService;
    private final ActivityRepository activityRepository;
    private final UserRepository userRepository;

    private Long getCurrentUserId() {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return user.getId();
    }

    @DeleteMapping("/activities/{id}/register")
    public Result<Void> cancelRegistration(@PathVariable Long id) {
        registrationManageService.cancelRegistration(id, getCurrentUserId());
        return Result.ok();
    }

    @PostMapping("/activities/{id}/waitlist")
    public Result<WaitlistEntry> joinWaitlist(@PathVariable Long id) {
        WaitlistEntry entry = waitlistService.joinWaitlist(id, getCurrentUserId());
        return Result.ok("已加入等待队列", entry);
    }

    @GetMapping("/activities/{id}/waitlist")
    public Result<Object> getWaitlistStatus(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        WaitlistEntry myEntry = waitlistService.getMyWaitlistEntry(id, userId);
        int total = waitlistService.getWaitlistCount(id);

        if (myEntry != null) {
            return Result.ok(new WaitlistStatusResponse(
                    true,
                    myEntry.getQueuePosition(),
                    total,
                    total - myEntry.getQueuePosition(),
                    myEntry.getStatus(),
                    myEntry.getNotifiedAt() != null
            ));
        } else {
            return Result.ok(new WaitlistStatusResponse(false, -1, total, 0, null, false));
        }
    }

    @DeleteMapping("/activities/{id}/waitlist")
    public Result<Void> leaveWaitlist(@PathVariable Long id) {
        waitlistService.leaveWaitlist(id, getCurrentUserId());
        return Result.ok();
    }

    @GetMapping("/users/me/registrations")
    public Result<List<Object>> getMyRegistrations(@RequestParam(required = false) String status) {
        Long userId = getCurrentUserId();
        List<Registration> registrations = registrationManageService.getMyRegistrations(userId, status);

        List<Object> result = registrations.stream().map(reg -> {
            Activity activity = activityRepository.findById(reg.getActivityId()).orElse(null);
            return new RegistrationResponse(reg, activity);
        }).collect(Collectors.toList());

        return Result.ok(result);
    }

    // ====== 报名审核（活动创建人） ======

    @GetMapping("/activities/{id}/registrations/pending")
    public Result<List<Map<String, Object>>> getPendingRegistrations(@PathVariable Long id) {
        List<Registration> list = registrationManageService.getPendingRegistrations(id, getCurrentUserId());
        List<Map<String, Object>> result = list.stream().map(reg -> {
            User user = userRepository.findById(reg.getUserId()).orElse(null);
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", reg.getId());
            m.put("userId", reg.getUserId());
            m.put("status", reg.getStatus());
            m.put("registeredAt", reg.getRegisteredAt() != null ? reg.getRegisteredAt().toString() : null);
            if (user != null) {
                m.put("nickname", user.getNickname());
                m.put("avatar", user.getAvatar());
            }
            return m;
        }).collect(Collectors.toList());
        return Result.ok(result);
    }

    @PostMapping("/activities/{id}/registrations/{regId}/approve")
    public Result<Map<String, Object>> approveRegistration(@PathVariable Long id, @PathVariable Long regId) {
        Registration reg = registrationManageService.approveRegistration(id, regId, getCurrentUserId());
        User user = userRepository.findById(reg.getUserId()).orElse(null);
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", reg.getId());
        m.put("status", reg.getStatus());
        m.put("userId", reg.getUserId());
        if (user != null) {
            m.put("nickname", user.getNickname());
            m.put("avatar", user.getAvatar());
        }
        return Result.ok("已通过", m);
    }

    @PostMapping("/activities/{id}/registrations/{regId}/reject")
    public Result<Map<String, Object>> rejectRegistration(@PathVariable Long id, @PathVariable Long regId) {
        Registration reg = registrationManageService.rejectRegistration(id, regId, getCurrentUserId());
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", reg.getId());
        m.put("status", reg.getStatus());
        return Result.ok("已拒绝", m);
    }

    static class WaitlistStatusResponse {
        public boolean inQueue;
        public int queuePosition;
        public int totalCount;
        public int aheadCount;
        public String status;
        public boolean notified;

        public WaitlistStatusResponse(boolean inQueue, int queuePosition, int totalCount, int aheadCount, String status, boolean notified) {
            this.inQueue = inQueue;
            this.queuePosition = queuePosition;
            this.totalCount = totalCount;
            this.aheadCount = aheadCount;
            this.status = status;
            this.notified = notified;
        }
    }

    static class RegistrationResponse {
        public Long id;
        public Long activityId;
        public String activityTitle;
        public String activityLocation;
        public String activityStartTime;
        public String status;
        public int participants;
        public String registeredAt;
        public String cancelledAt;

        public RegistrationResponse(Registration reg, Activity activity) {
            this.id = reg.getId();
            this.activityId = reg.getActivityId();
            this.status = reg.getStatus();
            this.participants = reg.getParticipants();
            this.registeredAt = reg.getRegisteredAt() != null ? reg.getRegisteredAt().toString() : null;
            this.cancelledAt = reg.getCancelledAt() != null ? reg.getCancelledAt().toString() : null;

            if (activity != null) {
                this.activityTitle = activity.getTitle();
                this.activityLocation = activity.getLocation();
                this.activityStartTime = activity.getStartTime() != null ? activity.getStartTime().toString() : null;
            }
        }
    }
}