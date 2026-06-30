package com.example.demo.repository;

import com.example.demo.entity.Activity;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActivityRepository extends JpaRepository<Activity, Long>, JpaSpecificationExecutor<Activity> {

    /** 原子递增参与人数，仅当未满员时成功。返回受影响行数：1=成功，0=已满员 */
    @Modifying
    @Transactional
    @Query("UPDATE Activity a SET a.currentParticipants = a.currentParticipants + 1 " +
           "WHERE a.id = :id AND a.currentParticipants < a.maxParticipants")
    int incrementParticipants(@Param("id") Long id);

    /** m2: 按创建者ID降序查询活动列表 */
    List<Activity> findByCreatorIdOrderByCreatedAtDesc(Long creatorId);

    /** US-008: 按创建者ID和状态查询草稿 */
    List<Activity> findByCreatorIdAndStatusOrderByCreatedAtDesc(Long creatorId, String status);
}
