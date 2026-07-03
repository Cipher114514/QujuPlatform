package com.example.demo.repository;

import com.example.demo.entity.TeamPhoto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TeamPhotoRepository extends JpaRepository<TeamPhoto, Long> {

    /** 按小队ID获取所有照片，按上传时间倒序 */
    List<TeamPhoto> findByTeamIdOrderByCreatedAtDesc(Long teamId);

    /** 删除小队所有照片 */
    void deleteByTeamId(Long teamId);

    /** 统计小队照片数 */
    long countByTeamId(Long teamId);
}
