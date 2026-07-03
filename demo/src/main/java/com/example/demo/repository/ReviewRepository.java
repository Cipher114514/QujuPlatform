package com.example.demo.repository;

import com.example.demo.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    Page<Review> findByActivityIdOrderByCreatedAtDesc(Long activityId, Pageable pageable);

    long countByActivityId(Long activityId);

    boolean existsByActivityIdAndUserId(Long activityId, Long userId);

    @Query("SELECT COALESCE(AVG(r.rating), 0) FROM Review r WHERE r.activityId = :activityId")
    BigDecimal getAvgRatingByActivityId(Long activityId);
}
