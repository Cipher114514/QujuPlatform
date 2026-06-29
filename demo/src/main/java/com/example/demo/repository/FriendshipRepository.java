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
}