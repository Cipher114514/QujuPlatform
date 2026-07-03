package com.example.demo.service;

import com.example.demo.entity.Comment;
import com.example.demo.entity.User;
import com.example.demo.exception.BusinessException;
import com.example.demo.repository.CommentRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final UserRepository userRepository;

    /** 获取活动的留言列表（含回复和用户信息） */
    public List<Map<String, Object>> getComments(Long activityId) {
        List<Comment> parents = commentRepository.findByActivityIdAndParentIdIsNullOrderByCreatedAtDesc(activityId);
        Set<Long> userIds = new HashSet<>();
        for (Comment c : parents) {
            userIds.add(c.getUserId());
        }

        List<Comment> allReplies = new ArrayList<>();
        for (Comment p : parents) {
            List<Comment> replies = commentRepository.findByParentIdOrderByCreatedAtAsc(p.getId());
            allReplies.addAll(replies);
            for (Comment r : replies) {
                userIds.add(r.getUserId());
            }
        }

        Map<Long, User> userMap = new HashMap<>();
        if (!userIds.isEmpty()) {
            userMap = userRepository.findAllById(userIds).stream()
                    .collect(Collectors.toMap(User::getId, u -> u));
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (Comment p : parents) {
            Map<String, Object> m = toCommentMap(p, userMap);
            List<Comment> replies = commentRepository.findByParentIdOrderByCreatedAtAsc(p.getId());
            List<Map<String, Object>> replyList = new ArrayList<>();
            for (Comment r : replies) {
                replyList.add(toCommentMap(r, userMap));
            }
            m.put("replies", replyList);
            result.add(m);
        }
        return result;
    }

    /** 发布留言或回复 */
    public Map<String, Object> postComment(Long activityId, Long userId, String content, Long parentId) {
        if (content == null || content.isBlank()) {
            throw new BusinessException("留言内容不能为空");
        }
        if (content.length() > 200) {
            throw new BusinessException("留言内容不能超过200个字符");
        }

        Comment comment = Comment.builder()
                .activityId(activityId)
                .userId(userId)
                .content(content.trim())
                .parentId(parentId)
                .build();

        comment = commentRepository.save(comment);
        User user = userRepository.findById(userId).orElse(null);
        return toCommentMap(comment, user != null ? Map.of(user.getId(), user) : Map.of());
    }

    /** 删除自己的留言 */
    public void deleteComment(Long commentId, Long userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new BusinessException(404, "留言不存在"));
        if (!comment.getUserId().equals(userId)) {
            throw new BusinessException("只能删除自己的留言");
        }
        commentRepository.delete(comment);
    }

    /** US-044: 举报留言 */
    public void reportComment(Long commentId, Long userId, String reason) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new BusinessException(404, "留言不存在"));
        if (comment.getUserId().equals(userId)) {
            throw new BusinessException("不能举报自己的留言");
        }
        if ("REPORTED".equals(comment.getReportStatus())) {
            throw new BusinessException("该留言已被举报，正在审核中");
        }
        comment.setReportStatus("REPORTED");
        comment.setReportReason(reason);
        commentRepository.save(comment);
    }

    private Map<String, Object> toCommentMap(Comment c, Map<Long, User> userMap) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", c.getId());
        m.put("activityId", c.getActivityId());
        m.put("userId", c.getUserId());
        m.put("content", "REPORTED".equals(c.getReportStatus()) ? "[该留言已被举报，审核中]" : c.getContent());
        m.put("parentId", c.getParentId());
        m.put("reportStatus", c.getReportStatus());
        m.put("createdAt", c.getCreatedAt() != null ? c.getCreatedAt().toString() : null);

        User u = userMap.get(c.getUserId());
        if (u != null) {
            Map<String, Object> userInfo = new LinkedHashMap<>();
            userInfo.put("id", u.getId());
            userInfo.put("nickname", u.getNickname());
            userInfo.put("avatar", u.getAvatar());
            m.put("user", userInfo);
        }
        return m;
    }
}
