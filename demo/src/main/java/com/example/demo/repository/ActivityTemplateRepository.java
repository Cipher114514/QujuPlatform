package com.example.demo.repository;

import com.example.demo.entity.ActivityTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ActivityTemplateRepository extends JpaRepository<ActivityTemplate, Long> {
    List<ActivityTemplate> findByCategory(String category);
}
