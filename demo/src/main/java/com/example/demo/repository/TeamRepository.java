package com.example.demo.repository;

import com.example.demo.entity.Team;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeamRepository extends JpaRepository<Team, Long> {

    /**
     * 按名称查找小队
     */
    Optional<Team> findByName(String name);

    /**
     * 检查名称是否存在
     */
    boolean existsByName(String name);

    /**
     * 按标签搜索小队（标签存储为JSON，需要精确匹配）
     */
    @Query("SELECT t FROM Team t WHERE t.status = 'ACTIVE' AND " +
           "t.tags LIKE CONCAT('%\"', :tag, '\"%')")
    Page<Team> findTeamsByTag(@Param("tag") String tag, Pageable pageable);

    /**
     * 按标签和关键词搜索小队
     */
    @Query("SELECT t FROM Team t WHERE t.status = 'ACTIVE' AND " +
           "t.tags LIKE CONCAT('%\"', :tag, '\"%') AND " +
           "(LOWER(t.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(t.description) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Team> searchTeamsByTagAndKeyword(@Param("tag") String tag, @Param("keyword") String keyword, Pageable pageable);

    /**
     * 查找活跃的小队（按关键词）
     */
    @Query("SELECT t FROM Team t WHERE t.status = 'ACTIVE' AND " +
           "(LOWER(t.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(t.description) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Team> findActiveTeams(@Param("keyword") String keyword, Pageable pageable);

    /**
     * 获取所有活跃小队
     */
    @Query("SELECT t FROM Team t WHERE t.status = 'ACTIVE' ORDER BY t.createdAt DESC")
    Page<Team> findAllActiveTeams(Pageable pageable);

    /**
     * 获取热门标签
     */
    @Query("SELECT t.tags FROM Team t WHERE t.status = 'ACTIVE' AND t.tags IS NOT NULL")
    List<String> findAllTags();

    /**
     * 管理员查询所有小队（含停用、解散）
     */
    @Query("SELECT t FROM Team t ORDER BY t.createdAt DESC")
    Page<Team> findAllForAdmin(Pageable pageable);

    /**
     * 管理员按关键词搜索所有小队（含停用、解散）
     */
    @Query("SELECT t FROM Team t WHERE " +
           "(LOWER(t.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(t.description) LIKE LOWER(CONCAT('%', :keyword, '%'))) ORDER BY t.createdAt DESC")
    Page<Team> searchAllForAdmin(@Param("keyword") String keyword, Pageable pageable);

    /**
     * 管理员按状态筛选小队
     */
    @Query("SELECT t FROM Team t WHERE t.status = :status ORDER BY t.createdAt DESC")
    Page<Team> findByStatusForAdmin(@Param("status") Team.TeamStatus status, Pageable pageable);

    /**
     * 管理员按状态和关键词筛选小队
     */
    @Query("SELECT t FROM Team t WHERE t.status = :status AND " +
           "(LOWER(t.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(t.description) LIKE LOWER(CONCAT('%', :keyword, '%'))) ORDER BY t.createdAt DESC")
    Page<Team> searchByStatusForAdmin(@Param("status") Team.TeamStatus status, @Param("keyword") String keyword, Pageable pageable);
}
