package com.example.demo.repository;

import com.example.demo.entity.TeamVote;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TeamVoteRepository extends JpaRepository<TeamVote, Long> {
    List<TeamVote> findByTeamIdOrderByCreatedAtDesc(Long teamId);
    Page<TeamVote> findByTeamIdOrderByCreatedAtDesc(Long teamId, Pageable pageable);
}
