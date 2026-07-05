package com.example.demo.repository;

import com.example.demo.entity.TeamAnnouncement;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface TeamAnnouncementRepository extends JpaRepository<TeamAnnouncement, Long> {
    Optional<TeamAnnouncement> findByTeamId(Long teamId);
    void deleteByTeamId(Long teamId);
}
