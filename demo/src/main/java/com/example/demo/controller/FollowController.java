package com.example.demo.controller;

import com.example.demo.common.Result;
import com.example.demo.dto.FollowRequest;
import com.example.demo.dto.UserListItemResponse;
import com.example.demo.entity.User;
import com.example.demo.service.FollowService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 关注功能控制器
 * 实现用户故事的 US-026
 */
@RestController
@RequiredArgsConstructor
public class FollowController {

    private final FollowService followService;

    /**
     * 关注用户
     * POST /follow
     */
    @PostMapping("/follow")
    public Result<?> followUser(@RequestBody FollowRequest request,
                                @AuthenticationPrincipal User currentUser) {
        var response = followService.followUser(currentUser, request.getUserId());
        return Result.ok(response);
    }

    /**
     * 取消关注
     * DELETE /follow/{userId}
     */
    @DeleteMapping("/follow/{userId}")
    public Result<Void> unfollowUser(@PathVariable Long userId,
                                     @AuthenticationPrincipal User currentUser) {
        followService.unfollowUser(currentUser, userId);
        return Result.ok();
    }

    /**
     * 获取我关注的人列表
     * GET /follow/following
     */
    @GetMapping("/follow/following")
    public Result<List<UserListItemResponse>> getFollowing(@AuthenticationPrincipal User currentUser) {
        List<UserListItemResponse> following = followService.getFollowing(currentUser);
        return Result.ok(following);
    }

    /**
     * 获取关注我的人（粉丝）列表
     * GET /follow/followers
     */
    @GetMapping("/follow/followers")
    public Result<List<UserListItemResponse>> getFollowers(@AuthenticationPrincipal User currentUser) {
        List<UserListItemResponse> followers = followService.getFollowers(currentUser);
        return Result.ok(followers);
    }
}
