package com.example.demo.repository;

import com.example.demo.entity.TeamVoteRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TeamVoteRecordRepository extends JpaRepository<TeamVoteRecord, Long> {
    List<TeamVoteRecord> findByVoteId(Long voteId);
    Optional<TeamVoteRecord> findByVoteIdAndUserIdAndOptionIndex(Long voteId, Long userId, Integer optionIndex);
    List<TeamVoteRecord> findByVoteIdAndUserId(Long voteId, Long userId);
    void deleteByVoteId(Long voteId);
    boolean existsByVoteIdAndUserId(Long voteId, Long userId);
}
