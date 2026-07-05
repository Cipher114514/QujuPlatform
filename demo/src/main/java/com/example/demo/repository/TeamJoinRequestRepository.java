package com.example.demo.repository;

import com.example.demo.entity.TeamJoinRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeamJoinRequestRepository extends JpaRepository<TeamJoinRequest, Long> {

    /**
     * 查找用户对小队的申请
     */
    Optional<TeamJoinRequest> findByTeamIdAndUserId(Long teamId, Long userId);

    /**
     * 检查是否存在待处理的申请
     */
    boolean existsByTeamIdAndUserIdAndStatus(Long teamId, Long userId, TeamJoinRequest.RequestStatus status);

    /**
     * 获取小队的待处理申请
     */
    @Query("SELECT r FROM TeamJoinRequest r WHERE r.teamId = :teamId AND r.status = 'PENDING' ORDER BY r.createdAt")
    List<TeamJoinRequest> findPendingRequestsByTeamId(@Param("teamId") Long teamId);

    /**
     * 获取小队的待处理申请分页
     */
    @Query("SELECT r FROM TeamJoinRequest r WHERE r.teamId = :teamId AND r.status = 'PENDING' ORDER BY r.createdAt")
    Page<TeamJoinRequest> findPendingRequestsByTeamId(@Param("teamId") Long teamId, Pageable pageable);

    /**
     * 获取用户的申请列表
     */
    @Query("SELECT r FROM TeamJoinRequest r WHERE r.userId = :userId ORDER BY r.createdAt DESC")
    Page<TeamJoinRequest> findByUserId(@Param("userId") Long userId, Pageable pageable);

    /**
     * 删除小队所有申请
     */
    void deleteByTeamId(Long teamId);

    /**
     * 删除用户在某小队的所有申请
     */
    void deleteByTeamIdAndUserId(Long teamId, Long userId);
}
