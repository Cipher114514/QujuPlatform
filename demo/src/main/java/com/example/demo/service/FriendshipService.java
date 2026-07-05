package com.example.demo.service;

import com.example.demo.dto.*;
import com.example.demo.entity.Friendship;
import com.example.demo.entity.User;
import com.example.demo.exception.BusinessException;
import com.example.demo.repository.FriendshipRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FriendshipService {

    private final FriendshipRepository friendshipRepository;
    private final UserRepository userRepository;

    /**
     * 发送好友请求
     */
    @Transactional
    public FriendRequestResponse addFriend(Long currentUserId, Long targetUserId) {
        // 不能添加自己为好友
        if (currentUserId.equals(targetUserId)) {
            throw new BusinessException("不能添加自己为好友");
        }

        // 检查目标用户是否存在
        if (!userRepository.existsById(targetUserId)) {
            throw new BusinessException("用户不存在");
        }

        // 检查当前用户是否被目标用户拉黑
        if (isBlocked(currentUserId, targetUserId)) {
            throw new BusinessException("你已被对方拉黑，无法发送好友请求");
        }
        // 检查目标用户是否被当前用户拉黑
        if (isBlocked(targetUserId, currentUserId)) {
            throw new BusinessException("该用户已在你的黑名单中，请先取消拉黑");
        }

        // 检查是否已经是好友
        if (friendshipRepository.areFriends(currentUserId, targetUserId)) {
            throw new BusinessException("已经是好友了");
        }

        // 检查是否有待处理的好友请求（避免重复发送）
        if (friendshipRepository.hasPendingRequest(currentUserId, targetUserId)) {
            throw new BusinessException("已发送好友请求，请等待对方处理");
        }

        if (friendshipRepository.hasPendingRequest(targetUserId, currentUserId)) {
            // 使用新方法获取已接受的好友关系
            Friendship existing = friendshipRepository.findAcceptedFriendshipBetween(currentUserId, targetUserId)
                    .orElseThrow(() -> new BusinessException("好友请求不存在"));
            existing.setStatus("ACCEPTED");
            friendshipRepository.save(existing);
            log.info("自动接受好友请求: {} -> {}", currentUserId, targetUserId);
            return toRequestResponse(existing);
        }

        // 创建新的好友请求
        Friendship friendship = Friendship.builder()
                .fromUserId(currentUserId)
                .toUserId(targetUserId)
                .status("PENDING")
                .build();

        Friendship saved = friendshipRepository.save(friendship);
        log.info("发送好友请求: {} -> {}", currentUserId, targetUserId);
        return toRequestResponse(saved);
    }

    /**
     * 处理好友请求（接受或拒绝）
     */
    @Transactional
    public FriendRequestResponse handleFriendRequest(Long currentUserId, Long requestId, String action) {
        Friendship friendship = friendshipRepository.findById(requestId)
                .orElseThrow(() -> new BusinessException("好友请求不存在"));

        // 验证当前用户是请求的接收方
        if (!friendship.getToUserId().equals(currentUserId)) {
            throw new BusinessException("无权处理此好友请求");
        }

        // 验证请求状态为待处理
        if (!"PENDING".equals(friendship.getStatus())) {
            throw new BusinessException("该好友请求已处理");
        }

        if ("accept".equalsIgnoreCase(action)) {
            friendship.setStatus("ACCEPTED");
            log.info("接受好友请求: {} -> {}", friendship.getFromUserId(), friendship.getToUserId());
        } else if ("reject".equalsIgnoreCase(action)) {
            friendship.setStatus("REJECTED");
            log.info("拒绝好友请求: {} -> {}", friendship.getFromUserId(), friendship.getToUserId());
        } else {
            throw new BusinessException("无效的操作，请使用 accept 或 reject");
        }

        Friendship saved = friendshipRepository.save(friendship);
        return toRequestResponse(saved);
    }

    /**
     * 获取好友列表
     */
    public List<FriendResponse> getFriends(Long userId) {
        List<Friendship> friendships = friendshipRepository.findAcceptedFriendshipsExcludingBlocked(userId);
        return friendships.stream()
            .collect(Collectors.toMap(
                    f -> f.getFromUserId().equals(userId) ? f.getToUserId() : f.getFromUserId(),
                    f -> toFriendResponse(f, userId),
                    (existing, replacement) -> existing,  // 保留先出现的
                    LinkedHashMap::new
            ))
            .values()
            .stream()
            .collect(Collectors.toList());
    }

    /**
     * 将Friendship转换为FriendResponse
     */
    private FriendResponse toFriendResponse(Friendship friendship, Long currentUserId) {
        Long friendId = friendship.getFromUserId().equals(currentUserId) 
                ? friendship.getToUserId() 
                : friendship.getFromUserId();
        
        User friend = userRepository.findById(friendId)
                .orElseThrow(() -> new BusinessException("好友不存在"));

        // 获取当前用户给好友设置的备注和分组
        String remark = getRemarkForUser(friendship, currentUserId);
        String group = getGroupForUser(friendship, currentUserId);
        
        // 检查当前用户是否拉黑了对方
        boolean isBlocked = "BLOCKED".equals(friendship.getBlockStatus()) 
            && currentUserId.equals(friendship.getBlockedBy());

        return FriendResponse.builder()
                .id(friend.getId())
                .nickname(friend.getNickname())
                .avatar(friend.getAvatar())
                .status("online")  // TODO: 接入在线状态
                .friendSince(friendship.getCreatedAt())
                .remark(remark)
                .group(group)
                .isBlocked(isBlocked)
                .build();
    }

    /**
     * 删除好友
     */
    @Transactional
    public void deleteFriend(Long currentUserId, Long friendUserId) {
        // 检查是否为好友
        if (!friendshipRepository.areFriends(currentUserId, friendUserId)) {
            throw new BusinessException("不是好友关系");
        }

        friendshipRepository.deleteBetweenUsers(currentUserId, friendUserId);
        log.info("删除好友: {} -> {}", currentUserId, friendUserId);
    }

    /**
     * 获取待处理的好友请求（收到的）
     */
    public List<FriendRequestResponse> getPendingRequests(Long userId) {
        List<Friendship> pending = friendshipRepository.findPendingRequestsToUser(userId);
        return pending.stream()
                .map(this::toRequestResponse)
                .collect(Collectors.toList());
    }

    /**
     * 获取已发送的好友请求（发出的）
     */
    public List<FriendRequestResponse> getSentRequests(Long userId) {
        List<Friendship> sent = friendshipRepository.findPendingRequestsFromUser(userId);
        return sent.stream()
                .map(this::toRequestResponse)
                .collect(Collectors.toList());
    }

    /**
     * 检查两个用户是否是好友
     */
    public boolean areFriends(Long userId1, Long userId2) {
        return friendshipRepository.areFriends(userId1, userId2);
    }

    private FriendRequestResponse toRequestResponse(Friendship f) {
        return FriendRequestResponse.builder()
                .id(f.getId())
                .fromUserId(f.getFromUserId())
                .toUserId(f.getToUserId())
                .status(f.getStatus().toLowerCase())
                .createdAt(f.getCreatedAt())
                .build();
    }

    // ==================== 黑名单功能 ====================

    /**
     * 拉黑用户 如果是好友关系，自动解除好友关系
     */
    @Transactional
    public void blockUser(Long currentUserId, Long targetUserId) {
        if (currentUserId.equals(targetUserId)) {
            throw new BusinessException("不能拉黑自己");
        }

        if (!userRepository.existsById(targetUserId)) {
            throw new BusinessException("用户不存在");
        }

        // 检查是否已经拉黑
        if (friendshipRepository.isBlockedBy(currentUserId, targetUserId)) {
            throw new BusinessException("已经拉黑了该用户");
        }

        // 获取所有相关记录（包括双向的）
        List<Friendship> friendships = friendshipRepository.findBetweenUsersList(currentUserId, targetUserId);
        
        if (friendships.isEmpty()) {
            // 没有记录，新建一条
            Friendship friendship = Friendship.builder()
                    .fromUserId(currentUserId)
                    .toUserId(targetUserId)
                    .status("BLOCKED")
                    .blockStatus("BLOCKED")
                    .blockedBy(currentUserId)
                    .blockedAt(LocalDateTime.now())
                    .build();
            friendshipRepository.save(friendship);
            log.info("拉黑用户(新建): {} -> {}", currentUserId, targetUserId);
            return;
        }

        // 遍历所有记录，标记为拉黑
        for (Friendship f : friendships) {
            f.setBlockStatus("BLOCKED");
            f.setBlockedBy(currentUserId);
            f.setBlockedAt(LocalDateTime.now());
            if ("ACCEPTED".equals(f.getStatus())) {
                f.setStatus("BLOCKED");
                log.info("拉黑并解除好友关系: {} -> {}", currentUserId, targetUserId);
            }
            friendshipRepository.save(f);
        }
        
        log.info("拉黑用户(处理{}条记录): {} -> {}", friendships.size(), currentUserId, targetUserId);
    }

    /**
     * 取消拉黑
     */
    @Transactional
    public void unblockUser(Long currentUserId, Long targetUserId) {
        // 查找所有相关记录
        List<Friendship> friendships = friendshipRepository.findBetweenUsersList(currentUserId, targetUserId);
        
        if (friendships.isEmpty()) {
            throw new BusinessException("未找到与该用户的关系");
        }
        
        // 检查是否有被当前用户拉黑的记录
        boolean hasBlocked = friendships.stream().anyMatch(f -> 
                "BLOCKED".equals(f.getBlockStatus()) && currentUserId.equals(f.getBlockedBy()));
        
        if (!hasBlocked) {
            throw new BusinessException("未拉黑该用户");
        }
        
        // 清除所有记录的拉黑状态
        for (Friendship f : friendships) {
            f.setBlockStatus("NORMAL");
            f.setBlockedBy(null);
            f.setBlockedAt(null);
            if ("BLOCKED".equals(f.getStatus())) {
                f.setStatus("NORMAL");
            }
            friendshipRepository.save(f);
        }
        
        log.info("取消拉黑: {} -> {}, 处理 {} 条记录", currentUserId, targetUserId, friendships.size());
    }

    /**
     * 获取黑名单列表（当前用户拉黑的所有人）
     */
    public List<FriendResponse> getBlockList(Long userId) {
        List<Friendship> blocked = friendshipRepository.findBlockedByUser(userId);
        return blocked.stream()
            .collect(Collectors.toMap(
                    f -> f.getFromUserId().equals(userId) ? f.getToUserId() : f.getFromUserId(),
                    f -> convertToBlockResponse(f, userId),
                    (existing, replacement) -> existing,
                    LinkedHashMap::new
            ))
            .values()
            .stream()
            .collect(Collectors.toList());
    }

    /**
     * 转换为黑名单响应对象
     */
    private FriendResponse convertToBlockResponse(Friendship friendship, Long userId) {
        Long friendId = friendship.getFromUserId().equals(userId) 
                ? friendship.getToUserId() 
                : friendship.getFromUserId();
        
        User friend = userRepository.findById(friendId)
                .orElseThrow(() -> new BusinessException("用户不存在"));
        
        return FriendResponse.builder()
                .id(friend.getId())
                .nickname(friend.getNickname())
                .avatar(friend.getAvatar())
                .status("offline")
                .friendSince(friendship.getBlockedAt())
                .isBlocked(true)
                .build();
    }

    /**
     * 检查用户A是否被用户B拉黑
     */
    private boolean isBlockedBy(Long userIdA, Long userIdB) {
        return friendshipRepository.isBlockedBy(userIdB, userIdA);
    }

    /**
     * 检查用户A是否拉黑了用户B
     */
    private boolean hasBlocked(Long userIdA, Long userIdB) {
        return friendshipRepository.isBlockedBy(userIdA, userIdB);
    }

    /**
     * 检查两个用户之间是否有任何拉黑关系
     */
    public boolean isBlocked(Long userId1, Long userId2) {
        return isBlockedBy(userId1, userId2) || isBlockedBy(userId2, userId1);
    }

     // ==================== 备注分组功能 ====================

    /**
     * 更新好友备注
     */
    @Transactional
    public void updateRemark(Long currentUserId, Long friendUserId, String remark) {
        Friendship friendship = getAcceptedFriendship(currentUserId, friendUserId);
        
        // 更新备注（使用工具方法，自动判断方向）
        setRemarkForUser(friendship, currentUserId, remark);
        friendshipRepository.save(friendship);
        log.info("更新好友备注: userId={}, friendId={}, remark={}", currentUserId, friendUserId, remark);
    }

    /**
     * 更新好友分组
     */
    @Transactional
    public void updateGroup(Long currentUserId, Long friendUserId, String group) {
        Friendship friendship = getAcceptedFriendship(currentUserId, friendUserId);
        
        setGroupForUser(friendship, currentUserId, group);
        friendshipRepository.save(friendship);
        log.info("更新好友分组: userId={}, friendId={}, group={}", currentUserId, friendUserId, group);
    }

    /**
     * 获取已接受的好友关系
     */
    private Friendship getAcceptedFriendship(Long userId1, Long userId2) {
        return friendshipRepository.findAcceptedFriendshipBetween(userId1, userId2)
                .orElseThrow(() -> new BusinessException("不是好友关系"));
    }

    /**
     * 按分组获取好友列表
     */
    public List<FriendResponse> getFriendsByGroup(Long userId, String group) {
        List<Friendship> friendships = friendshipRepository.findAcceptedFriendshipsExcludingBlocked(userId);
        
        return friendships.stream()
            .filter(f -> {
                String friendGroup = getGroupForUser(f, userId);
                if (group == null || group.isEmpty()) {
                    return friendGroup == null || friendGroup.isEmpty();
                }
                return group.equals(friendGroup);
            })
            .collect(Collectors.toMap(
                    f -> f.getFromUserId().equals(userId) ? f.getToUserId() : f.getFromUserId(),
                    f -> toFriendResponse(f, userId),
                    (existing, replacement) -> existing,
                    LinkedHashMap::new
            ))
            .values()
            .stream()
            .collect(Collectors.toList());
    }

    /**
     * 获取当前用户的所有分组标签
     */
    public List<String> getGroups(Long userId) {
        List<String> fromGroups = friendshipRepository.findGroupsFromUserExcludingBlocked(userId);
        List<String> toGroups = friendshipRepository.findGroupsToUserExcludingBlocked(userId);
        Set<String> allGroups = new HashSet<>();
        allGroups.addAll(fromGroups);
        allGroups.addAll(toGroups);
        return new ArrayList<>(allGroups);
    }

    /**
     * 获取某个用户给另一个用户设置的备注
     * 
     * @param friendship 好友关系实体
     * @param userId 当前用户ID（查看者）
     * @return 备注内容，如果没有则返回 null
     */
    private String getRemarkForUser(Friendship friendship, Long userId) {
        if (friendship == null) {
            return null;
        }
        
        // 如果当前用户是 fromUserId，则获取 fromRemark（我给他设置的备注）
        if (userId.equals(friendship.getFromUserId())) {
            return friendship.getFromNote();
        } 
        // 如果当前用户是 toUserId，则获取 toRemark（我给他设置的备注）
        else if (userId.equals(friendship.getToUserId())) {
            return friendship.getToNote();
        }
        
        // 当前用户不在此好友关系中
        return null;
    }

    /**
     * 设置某个用户给另一个用户设置的备注
     * 
     * @param friendship 好友关系实体
     * @param userId 当前用户ID（设置者）
     * @param remark 备注内容
     */
    private void setRemarkForUser(Friendship friendship, Long userId, String remark) {
        if (friendship == null) {
            throw new BusinessException("好友关系不存在");
        }
        
        if (userId.equals(friendship.getFromUserId())) {
            friendship.setFromNote(remark);
        } else if (userId.equals(friendship.getToUserId())) {
            friendship.setToNote(remark);
        } else {
            throw new BusinessException("无权设置此好友的备注");
        }
    }

    /**
     * 获取某个用户给另一个用户设置的分组
     * 
     * @param friendship 好友关系实体
     * @param userId 当前用户ID（查看者）
     * @return 分组标签，如果没有则返回 null
     */
    private String getGroupForUser(Friendship friendship, Long userId) {
        if (friendship == null) {
            return null;
        }
        
        // 如果当前用户是 fromUserId，则获取 fromGroup（我给他设置的分组）
        if (userId.equals(friendship.getFromUserId())) {
            return friendship.getFromGroup();
        } 
        // 如果当前用户是 toUserId，则获取 toGroup（我给他设置的分组）
        else if (userId.equals(friendship.getToUserId())) {
            return friendship.getToGroup();
        }
        
        // 当前用户不在此好友关系中
        return null;
    }

    /**
     * 设置某个用户给另一个用户设置的分组
     * 
     * @param friendship 好友关系实体
     * @param userId 当前用户ID（设置者）
     * @param group 分组标签
     */
    private void setGroupForUser(Friendship friendship, Long userId, String group) {
        if (friendship == null) {
            throw new BusinessException("好友关系不存在");
        }
        
        if (userId.equals(friendship.getFromUserId())) {
            friendship.setFromGroup(group);
        } else if (userId.equals(friendship.getToUserId())) {
            friendship.setToGroup(group);
        } else {
            throw new BusinessException("无权设置此好友的分组");
        }
    }
}
