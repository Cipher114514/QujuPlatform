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
@RequestMapping("/friends")
@RequiredArgsConstructor
@Slf4j
public class FriendsController {

    private final FriendshipService friendshipService;

    // ==================== 好友管理 ====================

    /**
     * 3.6.1 添加好友
     */
    @PostMapping
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
    @PutMapping("/{id}")
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
    @GetMapping
    public Result<List<FriendResponse>> getFriends(
            @AuthenticationPrincipal User currentUser) {
        log.info("获取好友列表: userId={}", currentUser.getId());
        List<FriendResponse> friends = friendshipService.getFriends(currentUser.getId());
        return Result.ok(friends);
    }

    /**
     * 3.6.4 删除好友
     */
    @DeleteMapping("/{userId}")
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
    @GetMapping("/requests/pending")
    public Result<List<FriendRequestResponse>> getPendingRequests(
            @AuthenticationPrincipal User currentUser) {
        List<FriendRequestResponse> requests = friendshipService.getPendingRequests(currentUser.getId());
        return Result.ok(requests);
    }

    /**
     * 获取已发送的好友请求（发出的）
     */
    @GetMapping("/requests/sent")
    public Result<List<FriendRequestResponse>> getSentRequests(
            @AuthenticationPrincipal User currentUser) {
        List<FriendRequestResponse> requests = friendshipService.getSentRequests(currentUser.getId());
        return Result.ok(requests);
    }

    /**
     * 检查好友关系
     */
    @GetMapping("/check/{userId}")
    public Result<Boolean> checkFriendship(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long userId) {
        boolean areFriends = friendshipService.areFriends(currentUser.getId(), userId);
        return Result.ok(areFriends);
    }

    // ==================== 黑名单功能 ====================

    /**
     * 拉黑用户
     */
    @PostMapping("/block")
    public Result<Void> blockUser(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody BlockRequest req) {
        log.info("拉黑用户: userId={}, targetUserId={}", currentUser.getId(), req.getUserId());
        friendshipService.blockUser(currentUser.getId(), req.getUserId());
        return Result.ok("拉黑成功", null);
    }

    /**
     * 取消拉黑
     */
    @DeleteMapping("/block/{userId}")
    public Result<Void> unblockUser(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long userId) {
        log.info("取消拉黑: userId={}, targetUserId={}", currentUser.getId(), userId);
        friendshipService.unblockUser(currentUser.getId(), userId);
        return Result.ok("取消拉黑成功", null);
    }

    /**
     * 检查是否被拉黑
     */
    @GetMapping("/block/check/{userId}")
    public Result<Boolean> checkBlocked(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long userId) {
        boolean blocked = friendshipService.isBlocked(currentUser.getId(), userId);
        return Result.ok(blocked);
    }

    /**
     * 获取黑名单列表（拉黑了我的人？还是我拉黑的人？）
     * 这里实现：获取当前用户拉黑的所有人
     */
    @GetMapping("/block/list")
    public Result<List<FriendResponse>> getBlockList(
            @AuthenticationPrincipal User currentUser) {
        // TODO: 实现获取黑名单列表
        // 需要 FriendshipRepository 支持查询 blockedBy = currentUser.id 且 blockStatus = BLOCKED
        log.info("获取黑名单列表: userId={}", currentUser.getId());
        List<FriendResponse> blockList = friendshipService.getBlockList(currentUser.getId());
        return Result.ok(blockList);
    }

    // ==================== 备注分组功能 ====================

    /**
     * 更新好友备注
     */
    @PutMapping("/remark")
    public Result<Void> updateRemark(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody RemarkUpdateRequest req) {
        log.info("更新好友备注: userId={}, friendId={}, remark={}", 
                currentUser.getId(), req.getUserId(), req.getRemark());
        friendshipService.updateRemark(currentUser.getId(), req.getUserId(), req.getRemark());
        return Result.ok("备注更新成功", null);
    }

    /**
     * 更新好友分组
     */
    @PutMapping("/group")
    public Result<Void> updateGroup(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody GroupUpdateRequest req) {
        log.info("更新好友分组: userId={}, friendId={}, group={}", 
                currentUser.getId(), req.getUserId(), req.getGroup());
        friendshipService.updateGroup(currentUser.getId(), req.getUserId(), req.getGroup());
        return Result.ok("分组更新成功", null);
    }

    /**
     * 按分组筛选好友列表
     */
    @GetMapping("/group/{group}")
    public Result<List<FriendResponse>> getFriendsByGroup(
            @AuthenticationPrincipal User currentUser,
            @PathVariable(required = false) String group) {
        log.info("按分组获取好友: userId={}, group={}", currentUser.getId(), group);
        List<FriendResponse> friends = friendshipService.getFriendsByGroup(currentUser.getId(), group);
        return Result.ok(friends);
    }

    /**
     * 获取所有分组列表（当前用户的所有分组标签）
     */
    @GetMapping("/groups")
    public Result<List<String>> getGroups(
            @AuthenticationPrincipal User currentUser) {
        log.info("获取分组列表: userId={}", currentUser.getId());
        List<String> groups = friendshipService.getGroups(currentUser.getId());
        return Result.ok(groups);
    }
}