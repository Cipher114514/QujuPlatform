package com.example.demo.repository;

import com.example.demo.entity.Follow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 关注关系数据访问层
 */
@Repository
public interface FollowRepository extends JpaRepository<Follow, Long> {

    /**
     * 查找用户关注的人列表
     */
    List<Follow> findByFollowerId(Long followerId);

    /**
     * 查找关注用户的粉丝列表
     */
    List<Follow> findByFollowingId(Long followingId);

    /**
     * 查找特定的关注关系
     */
    Optional<Follow> findByFollowerIdAndFollowingId(Long followerId, Long followingId);

    /**
     * 检查是否存在关注关系
     */
    boolean existsByFollowerIdAndFollowingId(Long followerId, Long followingId);

    /**
     * 删除关注关系
     */
    void deleteByFollowerIdAndFollowingId(Long followerId, Long followingId);

    /**
     * 统计用户的关注数
     */
    long countByFollowerId(Long followerId);

    /**
     * 统计用户的粉丝数
     */
    long countByFollowingId(Long followingId);
}
