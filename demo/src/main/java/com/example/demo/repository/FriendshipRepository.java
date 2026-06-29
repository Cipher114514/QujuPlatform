package com.example.demo.repository;

import com.example.demo.entity.Friendship;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 好友关系数据访问层
 */
@Repository
public interface FriendshipRepository extends JpaRepository<Friendship, Long> {

    /**
     * 查找两个用户之间的好友关系（任意方向，可能返回多条）
     */
    @Query("SELECT f FROM Friendship f WHERE " +
           "(f.fromUserId = :userId1 AND f.toUserId = :userId2) OR " +
           "(f.fromUserId = :userId2 AND f.toUserId = :userId1)")
    List<Friendship> findFriendshipsBetweenUsers(Long userId1, Long userId2);

    /**
     * 查找用户的好友列表（作为发起方）
     */
    List<Friendship> findByFromUserIdAndStatus(Long fromUserId, String status);

    /**
     * 查找用户的好友列表（作为接收方）
     */
    List<Friendship> findByToUserIdAndStatus(Long toUserId, String status);

    /**
     * 检查两个用户之间是否已存在好友关系（任意方向）
     */
    @Query("SELECT CASE WHEN COUNT(f) > 0 THEN true ELSE false END FROM Friendship f WHERE " +
           "f.status = 'ACCEPTED' AND " +
           "(f.fromUserId = :userId1 AND f.toUserId = :userId2 OR " +
           "f.fromUserId = :userId2 AND f.toUserId = :userId1)")
    boolean existsFriendshipBetweenUsers(Long userId1, Long userId2);

    /**
     * 删除两个用户之间的好友关系
     */
    void deleteByFromUserIdAndToUserId(Long fromUserId, Long toUserId);
}
