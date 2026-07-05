package com.example.demo.controller;

import com.example.demo.common.Result;
import com.example.demo.dto.UpdateUserRequest;
import com.example.demo.dto.UserProfileResponse;
import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;

    @GetMapping("/me")
    public Result<UserProfileResponse> getProfile(@AuthenticationPrincipal User currentUser) {
        return Result.ok(userService.getProfile(currentUser));
    }

    @PutMapping("/me")
    public Result<UserProfileResponse> updateProfile(@AuthenticationPrincipal User currentUser,
                                                      @RequestBody UpdateUserRequest req) {
        return Result.ok("更新成功", userService.updateProfile(currentUser, req));
    }

    /**
     * 用户搜索 — 支持按用户ID精确查找 或 按昵称模糊匹配
     * 前端提示"请输入用户ID或昵称"，后端两者都查
     */
    @GetMapping("/search")
    public Result<List<UserSearchResult>> searchUsers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String nickname) {
        String q = keyword != null ? keyword : nickname;
        if (q == null || q.isBlank()) {
            return Result.ok(List.of());
        }
        Set<User> users = new LinkedHashSet<>();

        // 1. 如果是纯数字，尝试按ID精确查找
        try {
            Long id = Long.parseLong(q);
            userRepository.findById(id).ifPresent(users::add);
        } catch (NumberFormatException ignored) {}

        // 2. 按昵称模糊匹配
        users.addAll(userRepository.findByNicknameContainingIgnoreCase(q));

        List<UserSearchResult> results = users.stream()
                .map(u -> new UserSearchResult(u.getId(), u.getNickname(), u.getAvatar(), u.getBio()))
                .toList();
        return Result.ok(results);
    }

    /** 搜索结果 DTO，只暴露必要字段 */
    public record UserSearchResult(Long id, String nickname, String avatar, String bio) {}
}
