package com.example.demo.repository;

import com.example.demo.entity.ActivityGallery;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ActivityGalleryRepository extends JpaRepository<ActivityGallery, Long> {

    Page<ActivityGallery> findByActivityIdOrderByCreatedAtDesc(Long activityId, Pageable pageable);
}
