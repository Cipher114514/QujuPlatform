package com.example.demo.repository;

import com.example.demo.entity.TeamMember;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {

    /**
     * 查找用户在小队的成员信息
     */
    Optional<TeamMember> findByTeamIdAndUserId(Long teamId, Long userId);

    /**
     * 检查用户是否是小队成员
     */
    boolean existsByTeamIdAndUserId(Long teamId, Long userId);

    /**
     * 获取小队所有成员
     */
    @Query("SELECT tm FROM TeamMember tm WHERE tm.teamId = :teamId ORDER BY tm.joinedAt")
    List<TeamMember> findByTeamIdOrderByJoinedAt(@Param("teamId") Long teamId);

    /**
     * 获取小队成员分页
     */
    @Query("SELECT tm FROM TeamMember tm WHERE tm.teamId = :teamId ORDER BY " +
           "CASE WHEN tm.role = 'LEADER' THEN 0 ELSE 1 END, tm.joinedAt")
    Page<TeamMember> findByTeamId(@Param("teamId") Long teamId, Pageable pageable);

    /**
     * 获取用户加入的所有小队ID
     */
    @Query("SELECT tm.teamId FROM TeamMember tm WHERE tm.userId = :userId")
    List<Long> findTeamIdsByUserId(@Param("userId") Long userId);

    /**
     * 删除小队所有成员
     */
    void deleteByTeamId(Long teamId);

    /**
     * 统计小队成员数
     */
    long countByTeamId(Long teamId);
}
