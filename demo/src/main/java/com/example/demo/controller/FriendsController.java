package com.example.demo.controller;

import com.example.demo.common.Result;
import com.example.demo.dto.*;
import com.example.demo.entity.User;
import com.example.demo.service.FriendshipService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Slf4j
public class FriendsController {

    private final FriendshipService friendshipService;

    // ==================== 好友管理 ====================

    /**
     * 3.6.1 添加好友
     */
    @PostMapping("/friends")
    public Result<FriendRequestResponse> addFriend(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody FriendRequest req) {
        log.info("添加好友请求: userId={}, targetUserId={}", currentUser.getId(), req.getUserId());
        FriendRequestResponse response = friendshipService.addFriend(currentUser.getId(), req.getUserId());
        return Result.ok("好友请求已发送", response);
    }

    /**
     * 3.6.2 处理好友请求
     */
    @PutMapping("/friends/{id}")
    public Result<FriendRequestResponse> handleFriendRequest(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id,
            @Valid @RequestBody FriendHandleRequest req) {
        log.info("处理好友请求: userId={}, requestId={}, action={}", currentUser.getId(), id, req.getStatus());
        FriendRequestResponse response = friendshipService.handleFriendRequest(currentUser.getId(), id, req.getStatus());
        return Result.ok("处理成功", response);
    }

    /**
     * 3.6.3 获取好友列表
     */
    @GetMapping("/friends")
    public Result<List<FriendResponse>> getFriends(
            @AuthenticationPrincipal User currentUser) {
        log.info("获取好友列表: userId={}", currentUser.getId());
        List<FriendResponse> friends = friendshipService.getFriends(currentUser.getId());
        return Result.ok(friends);
    }

    /**
     * 3.6.4 删除好友
     */
    @DeleteMapping("/friends/{userId}")
    public Result<Void> deleteFriend(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long userId) {
        log.info("删除好友: userId={}, friendUserId={}", currentUser.getId(), userId);
        friendshipService.deleteFriend(currentUser.getId(), userId);
        return Result.ok("删除成功", null);
    }

    /**
     * 获取待处理的好友请求（收到的）
     */
    @GetMapping("/friends/requests/pending")
    public Result<List<FriendRequestResponse>> getPendingRequests(
            @AuthenticationPrincipal User currentUser) {
        List<FriendRequestResponse> requests = friendshipService.getPendingRequests(currentUser.getId());
        return Result.ok(requests);
    }

    /**
     * 获取已发送的好友请求（发出的）
     */
    @GetMapping("/friends/requests/sent")
    public Result<List<FriendRequestResponse>> getSentRequests(
            @AuthenticationPrincipal User currentUser) {
        List<FriendRequestResponse> requests = friendshipService.getSentRequests(currentUser.getId());
        return Result.ok(requests);
    }

    /**
     * 检查好友关系
     */
    @GetMapping("/friends/check/{userId}")
    public Result<Boolean> checkFriendship(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long userId) {
        boolean areFriends = friendshipService.areFriends(currentUser.getId(), userId);
        return Result.ok(areFriends);
    }
}