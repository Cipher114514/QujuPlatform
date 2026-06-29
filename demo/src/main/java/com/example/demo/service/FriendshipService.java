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
import java.util.List;
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

        // 检查是否已经是好友
        if (friendshipRepository.areFriends(currentUserId, targetUserId)) {
            throw new BusinessException("已经是好友了");
        }

        // 检查是否有待处理的好友请求（避免重复发送）
        if (friendshipRepository.hasPendingRequest(currentUserId, targetUserId)) {
            throw new BusinessException("已发送好友请求，请等待对方处理");
        }

        // 检查对方是否已向你发送了请求（如果是，则自动接受）
        if (friendshipRepository.hasPendingRequest(targetUserId, currentUserId)) {
            Friendship existing = friendshipRepository.findBetweenUsers(currentUserId, targetUserId)
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
        List<Friendship> friendships = friendshipRepository.findAcceptedFriendships(userId);
        return friendships.stream()
                .map(f -> {
                    Long friendId = f.getFromUserId().equals(userId) ? f.getToUserId() : f.getFromUserId();
                    User friend = userRepository.findById(friendId)
                            .orElseThrow(() -> new BusinessException("好友不存在"));
                    return FriendResponse.builder()
                            .id(friend.getId())
                            .nickname(friend.getNickname())
                            .avatar(friend.getAvatar())
                            .status("online")
                            .friendSince(f.getCreatedAt())
                            .build();
                })
                .collect(Collectors.toList());
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
}