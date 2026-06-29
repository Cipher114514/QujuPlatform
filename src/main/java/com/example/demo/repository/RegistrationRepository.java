package com.example.demo.repository;

import com.example.demo.entity.Registration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RegistrationRepository extends JpaRepository<Registration, Long> {

    Optional<Registration> findByActivityIdAndUserId(Long activityId, Long userId);

    List<Registration> findByUserId(Long userId);

    List<Registration> findByUserIdAndStatus(Long userId, String status);

    List<Registration> findByActivityId(Long activityId);

    boolean existsByActivityIdAndUserId(Long activityId, Long userId);
}