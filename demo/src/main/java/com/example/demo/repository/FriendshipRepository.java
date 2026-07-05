package com.example.demo.repository;

import com.example.demo.entity.Friendship;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FriendshipRepository extends JpaRepository<Friendship, Long> {

    /**
     * 查找两个用户之间的好友关系（双向查询）
     */
    @Query("SELECT f FROM Friendship f WHERE " +
           "(f.fromUserId = :userId1 AND f.toUserId = :userId2) OR " +
           "(f.fromUserId = :userId2 AND f.toUserId = :userId1)")
    Optional<Friendship> findBetweenUsers(@Param("userId1") Long userId1, @Param("userId2") Long userId2);

    /**
     * 查找用户发送的好友请求（待处理）
     */
    @Query("SELECT f FROM Friendship f WHERE f.fromUserId = :userId AND f.status = 'PENDING'")
    List<Friendship> findPendingRequestsFromUser(@Param("userId") Long userId);

    /**
     * 查找用户收到的好友请求（待处理）
     */
    @Query("SELECT f FROM Friendship f WHERE f.toUserId = :userId AND f.status = 'PENDING'")
    List<Friendship> findPendingRequestsToUser(@Param("userId") Long userId);

    /**
     * 获取用户的好友列表（已接受的好友关系）
     */
    @Query("SELECT f FROM Friendship f WHERE " +
           "(f.fromUserId = :userId OR f.toUserId = :userId) AND f.status = 'ACCEPTED'")
    List<Friendship> findAcceptedFriendships(@Param("userId") Long userId);

    /**
     * 检查两个用户是否是好友
     */
    @Query("SELECT COUNT(f) > 0 FROM Friendship f WHERE " +
           "f.status = 'ACCEPTED' AND " +
           "((f.fromUserId = :userId1 AND f.toUserId = :userId2) OR " +
           "(f.fromUserId = :userId2 AND f.toUserId = :userId1))")
    boolean areFriends(@Param("userId1") Long userId1, @Param("userId2") Long userId2);

    /**
     * 检查是否有待处理的好友请求
     */
    @Query("SELECT COUNT(f) > 0 FROM Friendship f WHERE " +
           "f.fromUserId = :fromUserId AND f.toUserId = :toUserId AND f.status = 'PENDING'")
    boolean hasPendingRequest(@Param("fromUserId") Long fromUserId, @Param("toUserId") Long toUserId);

    /**
     * 更新好友请求状态
     */
    @Modifying
    @Query("UPDATE Friendship f SET f.status = :status WHERE f.id = :id")
    int updateStatus(@Param("id") Long id, @Param("status") String status);

    /**
     * 删除两个用户之间的所有好友关系
     */
    @Modifying
    @Query("DELETE FROM Friendship f WHERE " +
           "(f.fromUserId = :userId1 AND f.toUserId = :userId2) OR " +
           "(f.fromUserId = :userId2 AND f.toUserId = :userId1)")
    void deleteBetweenUsers(@Param("userId1") Long userId1, @Param("userId2") Long userId2);

    /** 查找两个用户之间的所有好友关系（不区分方向，任意状态） */
    @Query("SELECT f FROM Friendship f WHERE " +
           "(f.fromUserId = :userId1 AND f.toUserId = :userId2) OR " +
           "(f.fromUserId = :userId2 AND f.toUserId = :userId1)")
    List<Friendship> findFriendshipsBetweenUsers(@Param("userId1") Long userId1, @Param("userId2") Long userId2);

    /** 检查两个用户之间是否存在好友关系（不区分方向，任意状态） */
    @Query("SELECT COUNT(f) > 0 FROM Friendship f WHERE " +
           "(f.fromUserId = :userId1 AND f.toUserId = :userId2) OR " +
           "(f.fromUserId = :userId2 AND f.toUserId = :userId1)")
    boolean existsFriendshipBetweenUsers(@Param("userId1") Long userId1, @Param("userId2") Long userId2);

    /**
     * 获取被当前用户拉黑的所有关系
     */
    @Query("SELECT f FROM Friendship f WHERE f.blockedBy = :userId AND f.blockStatus = 'BLOCKED'")
    List<Friendship> findBlockedByUser(@Param("userId") Long userId);

    /**
     * 获取某个用户的所有分组标签
     */
    @Query("SELECT DISTINCT f.fromGroup FROM Friendship f WHERE f.fromUserId = :userId AND f.status = 'ACCEPTED' AND f.fromGroup IS NOT NULL AND f.fromGroup != ''")
    List<String> findGroupsFromUser(@Param("userId") Long userId);

    @Query("SELECT DISTINCT f.toGroup FROM Friendship f WHERE f.toUserId = :userId AND f.status = 'ACCEPTED' AND f.toGroup IS NOT NULL AND f.toGroup != ''")
    List<String> findGroupsToUser(@Param("userId") Long userId);

    // ========== 新增方法，用于解决数据库表的设计问题：
    // 未分为好友申请表与好友关系表，导致查询好友关系时出现重复情况（双向好友申请），导致查询错误
    //  ==========

    /**
     * 查找两个用户之间的所有好友关系（双向，返回 List）
     */
    @Query("SELECT f FROM Friendship f WHERE " +
           "(f.fromUserId = :userId1 AND f.toUserId = :userId2) OR " +
           "(f.fromUserId = :userId2 AND f.toUserId = :userId1)")
    List<Friendship> findBetweenUsersList(@Param("userId1") Long userId1, @Param("userId2") Long userId2);

    /**
     * 获取两个用户之间已接受的好友关系（优先取 ACCEPTED 状态）
     */
    default Optional<Friendship> findAcceptedFriendshipBetween(Long userId1, Long userId2) {
        List<Friendship> results = findBetweenUsersList(userId1, userId2);
        return results.stream()
                .filter(f -> "ACCEPTED".equals(f.getStatus()))
                .findFirst();
    }

    /**
     * 获取两个用户之间被当前用户拉黑的关系
     */
    default Optional<Friendship> findBlockedRelationship(Long currentUserId, Long targetUserId) {
        List<Friendship> results = findBetweenUsersList(currentUserId, targetUserId);
        return results.stream()
                .filter(f -> "BLOCKED".equals(f.getBlockStatus()) 
                        && currentUserId.equals(f.getBlockedBy()))
                .findFirst();
    }

    /**
     * 检查两个用户之间是否存在拉黑关系（被 currentUserId 拉黑）
     */
    default boolean isBlockedBy(Long currentUserId, Long targetUserId) {
        return findBlockedRelationship(currentUserId, targetUserId).isPresent();
    }

	/**
	 * 获取用户的好友列表（已接受的好友关系，排除所有拉黑关系）
	 */
	@Query("SELECT f FROM Friendship f WHERE " +
		"(f.fromUserId = :userId OR f.toUserId = :userId) AND f.status = 'ACCEPTED' " +
		"AND NOT EXISTS (" +
		"   SELECT 1 FROM Friendship b WHERE " +
		"   ((b.fromUserId = :userId AND b.toUserId = f.toUserId) OR " +
		"    (b.fromUserId = f.toUserId AND b.toUserId = :userId)) " +
		"   AND b.blockStatus = 'BLOCKED'" +
		")")
	List<Friendship> findAcceptedFriendshipsExcludingBlocked(@Param("userId") Long userId);

	/**
	 * 获取用户的分组标签（排除所有拉黑关系）
	 */
	@Query("SELECT DISTINCT f.fromGroup FROM Friendship f WHERE f.fromUserId = :userId AND f.status = 'ACCEPTED' AND f.fromGroup IS NOT NULL AND f.fromGroup != '' " +
		"AND NOT EXISTS (" +
		"   SELECT 1 FROM Friendship b WHERE " +
		"   ((b.fromUserId = :userId AND b.toUserId = f.toUserId) OR " +
		"    (b.fromUserId = f.toUserId AND b.toUserId = :userId)) " +
		"   AND b.blockStatus = 'BLOCKED'" +
		")")
	List<String> findGroupsFromUserExcludingBlocked(@Param("userId") Long userId);

	@Query("SELECT DISTINCT f.toGroup FROM Friendship f WHERE f.toUserId = :userId AND f.status = 'ACCEPTED' AND f.toGroup IS NOT NULL AND f.toGroup != '' " +
		"AND NOT EXISTS (" +
		"   SELECT 1 FROM Friendship b WHERE " +
		"   ((b.fromUserId = :userId AND b.toUserId = f.fromUserId) OR " +
		"    (b.fromUserId = f.fromUserId AND b.toUserId = :userId)) " +
		"   AND b.blockStatus = 'BLOCKED'" +
		")")
	List<String> findGroupsToUserExcludingBlocked(@Param("userId") Long userId);
}