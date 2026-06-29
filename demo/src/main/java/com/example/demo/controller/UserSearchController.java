package com.example.demo.controller;

import com.example.demo.common.Result;
import com.example.demo.dto.UserSearchResponse;
import com.example.demo.entity.User;
import com.example.demo.service.FollowService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 用户搜索/发现控制器
 * 实现用户故事的 US-026 用户发现功能
 */
@RestController
@RequiredArgsConstructor
public class UserSearchController {

    private final FollowService followService;

    /**
     * 搜索用户
     * GET /users/search?nickname=xxx
     */
    @GetMapping("/users/search")
    public Result<List<UserSearchResponse>> searchUsers(
            @RequestParam String nickname,
            @AuthenticationPrincipal User currentUser) {
        List<UserSearchResponse> users = followService.searchUsers(currentUser, nickname);
        return Result.ok(users);
    }

    /**
     * 获取推荐用户（用于用户发现页的默认展示）
     * GET /users/recommended?limit=10
     */
    @GetMapping("/users/recommended")
    public Result<List<UserSearchResponse>> getRecommendedUsers(
            @RequestParam(defaultValue = "10") Integer limit,
            @AuthenticationPrincipal User currentUser) {
        List<UserSearchResponse> users = followService.getRecommendedUsers(currentUser, limit);
        return Result.ok(users);
    }
}
