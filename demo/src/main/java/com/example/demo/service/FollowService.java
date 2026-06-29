package com.example.demo.service;

import com.example.demo.dto.FollowResponse;
import com.example.demo.dto.UserListItemResponse;
import com.example.demo.dto.UserSearchResponse;
import com.example.demo.entity.Follow;
import com.example.demo.entity.Friendship;
import com.example.demo.entity.User;
import com.example.demo.exception.BusinessException;
import com.example.demo.repository.FollowRepository;
import com.example.demo.repository.FriendshipRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 关注服务
 * 实现关注/取关功能，以及互关自动升级好友逻辑
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FollowService {

    private final FollowRepository followRepository;
    private final FriendshipRepository friendshipRepository;
    private final UserRepository userRepository;

    /**
     * 关注用户
     * @param currentUser 当前用户
     * @param targetUserId 目标用户ID
     * @return 关注结果
     */
    @Transactional
    public FollowResponse followUser(User currentUser, Long targetUserId) {
        // 校验：不能关注自己
        if (currentUser.getId().equals(targetUserId)) {
            throw new BusinessException("不能关注自己");
        }

        // 校验：目标用户是否存在
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new BusinessException("用户不存在"));

        // 检查是否已关注
        if (followRepository.existsByFollowerIdAndFollowingId(currentUser.getId(), targetUserId)) {
            throw new BusinessException("已经关注过该用户");
        }

        // 创建关注关系
        Follow follow = Follow.builder()
                .followerId(currentUser.getId())
                .followingId(targetUserId)
                .build();
        follow = followRepository.save(follow);

        // 检查是否互关（目标用户是否也关注了当前用户）
        boolean isNowFriend = false;
        if (followRepository.existsByFollowerIdAndFollowingId(targetUserId, currentUser.getId())) {
            // 互关了，自动升级为好友关系
            isNowFriend = true;
            createMutualFriendship(currentUser.getId(), targetUserId);
            log.info("用户 {} 和 {} 互关，自动升级为好友", currentUser.getId(), targetUserId);
        }

        return FollowResponse.builder()
                .id(follow.getId())
                .followerId(follow.getFollowerId())
                .followingId(follow.getFollowingId())
                .createdAt(follow.getCreatedAt() != null ? follow.getCreatedAt().toString() : null)
                .isNowFriend(isNowFriend)
                .build();
    }

    /**
     * 取消关注
     * @param currentUser 当前用户
     * @param targetUserId 目标用户ID
     */
    @Transactional
    public void unfollowUser(User currentUser, Long targetUserId) {
        // 校验：不能取关自己
        if (currentUser.getId().equals(targetUserId)) {
            throw new BusinessException("不能取消关注自己");
        }

        // 检查关注关系是否存在
        Follow follow = followRepository.findByFollowerIdAndFollowingId(currentUser.getId(), targetUserId)
                .orElseThrow(() -> new BusinessException("未关注该用户"));

        // 删除关注关系
        followRepository.delete(follow);

        // 同步解除好友关系（如果有）
        List<Friendship> friendships = friendshipRepository.findFriendshipsBetweenUsers(currentUser.getId(), targetUserId);
        if (!friendships.isEmpty()) {
            friendshipRepository.deleteAll(friendships);
            log.info("用户 {} 取消关注 {}，同步解除好友关系", currentUser.getId(), targetUserId);
        }
    }

    /**
     * 获取我关注的人列表
     */
    public List<UserListItemResponse> getFollowing(User currentUser) {
        List<Follow> follows = followRepository.findByFollowerId(currentUser.getId());
        return follows.stream()
                .map(f -> buildUserListItemResponse(currentUser, f.getFollowingId(), f.getCreatedAt()))
                .collect(Collectors.toList());
    }

    /**
     * 获取关注我的人（粉丝）列表
     */
    public List<UserListItemResponse> getFollowers(User currentUser) {
        List<Follow> follows = followRepository.findByFollowingId(currentUser.getId());
        return follows.stream()
                .map(f -> buildUserListItemResponse(currentUser, f.getFollowerId(), f.getCreatedAt()))
                .collect(Collectors.toList());
    }

    /**
     * 搜索用户（用于用户发现）
     */
    public List<UserSearchResponse> searchUsers(User currentUser, String nickname) {
        List<User> users = userRepository.findByNicknameContainingIgnoreCase(nickname);
        return users.stream()
                .map(user -> buildUserSearchResponse(currentUser, user))
                .collect(Collectors.toList());
    }

    /**
     * 获取推荐用户（随机推荐活跃用户）
     */
    public List<UserSearchResponse> getRecommendedUsers(User currentUser, int limit) {
        // 简单实现：返回最新的用户（排除自己和已关注的）
        List<User> allUsers = userRepository.findAll();
        return allUsers.stream()
                .filter(u -> !u.getId().equals(currentUser.getId()))
                .filter(u -> !followRepository.existsByFollowerIdAndFollowingId(currentUser.getId(), u.getId()))
                .limit(limit)
                .map(user -> buildUserSearchResponse(currentUser, user))
                .collect(Collectors.toList());
    }

    /**
     * 构建用户列表项响应
     */
    private UserListItemResponse buildUserListItemResponse(User currentUser, Long targetUserId, java.time.LocalDateTime followedAt) {
        User targetUser = userRepository.findById(targetUserId)
                .orElse(null);
        if (targetUser == null) {
            return null;
        }

        boolean isFollowing = followRepository.existsByFollowerIdAndFollowingId(currentUser.getId(), targetUserId);
        boolean isFollowedBy = followRepository.existsByFollowerIdAndFollowingId(targetUserId, currentUser.getId());
        boolean isFriend = friendshipRepository.existsFriendshipBetweenUsers(currentUser.getId(), targetUserId);

        return UserListItemResponse.builder()
                .id(targetUser.getId())
                .nickname(targetUser.getNickname())
                .avatar(targetUser.getAvatar())
                .bio(targetUser.getBio())
                .isFollowing(isFollowing)
                .isFollowedBy(isFollowedBy)
                .isFriend(isFriend)
                .followedAt(followedAt != null ? followedAt.toString() : null)
                .build();
    }

    /**
     * 构建用户搜索响应
     */
    private UserSearchResponse buildUserSearchResponse(User currentUser, User targetUser) {
        boolean isFollowing = followRepository.existsByFollowerIdAndFollowingId(currentUser.getId(), targetUser.getId());
        boolean isFriend = friendshipRepository.existsFriendshipBetweenUsers(currentUser.getId(), targetUser.getId());

        return UserSearchResponse.builder()
                .id(targetUser.getId())
                .nickname(targetUser.getNickname())
                .avatar(targetUser.getAvatar())
                .bio(targetUser.getBio())
                .role(targetUser.getRole().name().toLowerCase())
                .isFollowing(isFollowing)
                .isFriend(isFriend)
                .followersCount(followRepository.countByFollowingId(targetUser.getId()))
                .followingCount(followRepository.countByFollowerId(targetUser.getId()))
                .build();
    }

    /**
     * 创建双向好友关系
     */
    private void createMutualFriendship(Long userId1, Long userId2) {
        // 检查是否已存在好友关系
        if (friendshipRepository.existsFriendshipBetweenUsers(userId1, userId2)) {
            return;
        }

        // 创建双向好友记录（userId1 -> userId2）
        Friendship friendship1 = Friendship.builder()
                .fromUserId(userId1)
                .toUserId(userId2)
                .status("ACCEPTED")
                .build();
        friendshipRepository.save(friendship1);

        // 创建双向好友记录（userId2 -> userId1）
        Friendship friendship2 = Friendship.builder()
                .fromUserId(userId2)
                .toUserId(userId1)
                .status("ACCEPTED")
                .build();
        friendshipRepository.save(friendship2);
    }
}
