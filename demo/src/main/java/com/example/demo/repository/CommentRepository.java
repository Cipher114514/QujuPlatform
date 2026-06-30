package com.example.demo.repository;

import com.example.demo.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    /** 获取活动的所有主评论（不含回复），按时间倒序 */
    List<Comment> findByActivityIdAndParentIdIsNullOrderByCreatedAtDesc(Long activityId);

    /** 获取某条主评论的所有回复 */
    List<Comment> findByParentIdOrderByCreatedAtAsc(Long parentId);

    /** 获取活动的评论总数 */
    long countByActivityId(Long activityId);
}
