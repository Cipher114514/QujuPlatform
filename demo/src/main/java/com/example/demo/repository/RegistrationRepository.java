package com.example.demo.repository;

import com.example.demo.entity.Registration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface RegistrationRepository extends JpaRepository<Registration, Long> {

    Optional<Registration> findByActivityIdAndUserId(Long activityId, Long userId);

    boolean existsByActivityIdAndUserId(Long activityId, Long userId);

    List<Registration> findByUserId(Long userId);

    List<Registration> findByUserIdAndStatus(Long userId, String status);

    List<Registration> findByActivityIdAndStatusOrderByRegisteredAtAsc(Long activityId, String status);
}
