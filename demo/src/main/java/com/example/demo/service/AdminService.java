package com.example.demo.service;

import com.example.demo.dto.*;
import com.example.demo.entity.Activity;
import com.example.demo.entity.User;
import com.example.demo.entity.User.UserRole;
import com.example.demo.entity.User.UserStatus;
import com.example.demo.exception.BusinessException;
import com.example.demo.repository.ActivityRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final UserRepository userRepository;
    private final ActivityRepository activityRepository;

    // ==================== 统计 ====================

    public AdminStatsResponse getStats() {
        return AdminStatsResponse.builder()
                .totalUsers(userRepository.count())
                .totalActivities(activityRepository.count())
                .pendingBusinesses(userRepository.countByRoleAndStatus(UserRole.BUSINESS, UserStatus.PENDING))
                .bannedUsers(userRepository.countByStatus(UserStatus.BANNED))
                .activeUsers(userRepository.countByStatus(UserStatus.ACTIVE))
                .businessUsers(userRepository.countByRole(UserRole.BUSINESS))
                .build();
    }

    // ==================== 用户管理 ====================

    public Page<AdminUserResponse> listUsers(String keyword, String role, String status, int page, int size) {
        UserRole roleEnum = null;
        UserStatus statusEnum = null;
        if (role != null && !role.isBlank()) {
            try { roleEnum = UserRole.valueOf(role.toUpperCase()); } catch (IllegalArgumentException ignored) {}
        }
        if (status != null && !status.isBlank()) {
            try { statusEnum = UserStatus.valueOf(status.toUpperCase()); } catch (IllegalArgumentException ignored) {}
        }
        String kw = (keyword != null && !keyword.isBlank()) ? keyword : null;
        return userRepository.adminSearchUsers(kw, roleEnum, statusEnum, PageRequest.of(page, size))
                .map(AdminUserResponse::from);
    }

    public AdminUserResponse getUserDetail(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("用户不存在"));
        return AdminUserResponse.from(user);
    }

    @Transactional
    public AdminUserResponse updateUserRole(Long userId, UpdateUserRoleRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("用户不存在"));

        if (user.getRole() == UserRole.ADMIN) {
            throw new BusinessException("不能修改管理员角色");
        }

        try {
            UserRole newRole = UserRole.valueOf(req.getRole().toUpperCase());
            user.setRole(newRole);
            log.info("管理员修改用户角色: userId={}, {} -> {}", userId, user.getRole(), newRole);
        } catch (IllegalArgumentException e) {
            throw new BusinessException("无效的角色: " + req.getRole());
        }

        userRepository.save(user);
        return AdminUserResponse.from(user);
    }

    @Transactional
    public AdminUserResponse banUser(Long userId, BanUserRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("用户不存在"));

        if (user.getRole() == UserRole.ADMIN) {
            throw new BusinessException("不能封禁管理员");
        }

        if (req.getReason() == null || req.getReason().isBlank()) {
            throw new BusinessException("请填写封禁原因");
        }

        user.setStatus(UserStatus.BANNED);
        user.setBanReason(req.getReason());
        user.setBanUntil(req.getBanUntil());  // null = 永久
        userRepository.save(user);

        log.info("管理员封禁用户: userId={}, reason={}, banUntil={}", userId, req.getReason(), req.getBanUntil());
        return AdminUserResponse.from(user);
    }

    @Transactional
    public AdminUserResponse unbanUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("用户不存在"));

        if (user.getStatus() != UserStatus.BANNED) {
            throw new BusinessException("该用户未被封禁");
        }

        user.setStatus(UserStatus.ACTIVE);
        user.setBanReason(null);
        user.setBanUntil(null);
        userRepository.save(user);

        log.info("管理员解封用户: userId={}", userId);
        return AdminUserResponse.from(user);
    }

    // ==================== 商家审批 ====================

    @Transactional
    public AdminUserResponse approveBusiness(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("用户不存在"));

        if (user.getRole() != UserRole.BUSINESS) {
            throw new BusinessException("该用户不是商家");
        }
        if (user.getStatus() != UserStatus.PENDING) {
            throw new BusinessException("该商家不是待审批状态");
        }

        user.setStatus(UserStatus.ACTIVE);
        userRepository.save(user);

        log.info("管理员审批通过商家: userId={}", userId);
        return AdminUserResponse.from(user);
    }

    @Transactional
    public void rejectBusiness(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("用户不存在"));

        if (user.getRole() != UserRole.BUSINESS) {
            throw new BusinessException("该用户不是商家");
        }
        if (user.getStatus() != UserStatus.PENDING) {
            throw new BusinessException("该商家不是待审批状态");
        }

        // 拒绝时直接删除该商家账号
        userRepository.delete(user);
        log.info("管理员拒绝商家注册并删除: userId={}", userId);
    }

    // ==================== 活动管理 ====================

    public Page<Activity> listAllActivities(String keyword, String status, int page, int size) {
        // 简单实现：查询所有活动
        return activityRepository.findAll(PageRequest.of(page, size));
    }

    @Transactional
    public Activity cancelActivity(Long activityId) {
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new BusinessException("活动不存在"));

        activity.setStatus("CANCELLED");
        activityRepository.save(activity);

        log.info("管理员下架活动: activityId={}", activityId);
        return activity;
    }

    @Transactional
    public void deleteActivity(Long activityId) {
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new BusinessException("活动不存在"));

        activityRepository.delete(activity);
        log.info("管理员删除活动: activityId={}", activityId);
    }
}
