package com.example.demo.repository;

import com.example.demo.entity.WaitlistEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WaitlistRepository extends JpaRepository<WaitlistEntry, Long> {

    List<WaitlistEntry> findByActivityIdOrderByQueuePositionAsc(Long activityId);

    Optional<WaitlistEntry> findByActivityIdAndUserId(Long activityId, Long userId);

    boolean existsByActivityIdAndUserId(Long activityId, Long userId);

    int countByActivityId(Long activityId);

    @Modifying
    @Query("UPDATE WaitlistEntry w SET w.queuePosition = w.queuePosition - 1 WHERE w.activityId = :activityId AND w.queuePosition > :position")
    void decrementQueuePositions(@Param("activityId") Long activityId, @Param("position") Integer position);
}