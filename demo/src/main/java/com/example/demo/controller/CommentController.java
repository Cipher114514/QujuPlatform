package com.example.demo.controller;

import com.example.demo.common.Result;
import com.example.demo.entity.User;
import com.example.demo.service.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/activities")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    /** US-043: 获取活动留言列表 */

    @GetMapping("/{activityId}/comments")
    public Result<List<Map<String, Object>>> getComments(@PathVariable Long activityId) {
        return Result.ok(commentService.getComments(activityId));
    }

    /** US-043: 发布留言/回复 */
    @PostMapping("/{activityId}/comments")
    public Result<Map<String, Object>> postComment(@PathVariable Long activityId,
                                                    @RequestBody Map<String, Object> body,
                                                    @AuthenticationPrincipal User currentUser) {
        String content = (String) body.get("content");
        Object parentIdObj = body.get("parentId");
        Long parentId = parentIdObj != null ? Long.valueOf(parentIdObj.toString()) : null;
        return Result.ok("留言成功", commentService.postComment(activityId, currentUser.getId(), content, parentId));
    }

    /** US-044: 举报留言 */
    @PutMapping("/{activityId}/comments/{commentId}/report")
    public Result<Void> reportComment(@PathVariable Long activityId,
                                       @PathVariable Long commentId,
                                       @RequestBody Map<String, Object> body,
                                       @AuthenticationPrincipal User currentUser) {
        String reason = (String) body.getOrDefault("reason", "其他");
        commentService.reportComment(commentId, currentUser.getId(), reason);
        return Result.ok();
    }

    /** 删除自己的留言 */
    @DeleteMapping("/{activityId}/comments/{commentId}")
    public Result<Void> deleteComment(@PathVariable Long activityId,
                                       @PathVariable Long commentId,
                                       @AuthenticationPrincipal User currentUser) {
        commentService.deleteComment(commentId, currentUser.getId());
        return Result.ok();
    }
}
