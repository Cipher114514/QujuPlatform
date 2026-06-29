package com.example.demo.controller;

import com.example.demo.common.Result;
import com.example.demo.entity.User;
import com.example.demo.service.MessageService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    @GetMapping("/conversations")
    public Result<?> getConversations(@AuthenticationPrincipal User currentUser) {
        return Result.ok(messageService.getConversations(currentUser.getId()));
    }

    @GetMapping("/conversations/{conversationId}")
    public Result<?> getMessages(@AuthenticationPrincipal User currentUser,
                                  @PathVariable Long conversationId,
                                  @RequestParam(defaultValue = "1") int page,
                                  @RequestParam(defaultValue = "20") int size) {
        return Result.ok(messageService.getMessages(currentUser.getId(), conversationId, page, size));
    }

    @PostMapping
    public Result<?> sendMessage(@AuthenticationPrincipal User currentUser,
                                  @RequestBody SendMessageRequest req) {
        return Result.ok("发送成功", messageService.sendMessage(currentUser.getId(), req.getTargetUserId(), req.getContent()));
    }

    @PutMapping("/conversations/{conversationId}/read")
    public Result<Void> markAsRead(@AuthenticationPrincipal User currentUser,
                                   @PathVariable Long conversationId) {
        messageService.markAsRead(currentUser.getId(), conversationId);
        return Result.ok("标记已读成功", null);
    }

    @GetMapping("/conversations/{conversationId}/new")
    public Result<?> getNewMessages(@AuthenticationPrincipal User currentUser,
                                     @PathVariable Long conversationId,
                                     @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime since) {
        return Result.ok(messageService.getNewMessages(currentUser.getId(), conversationId, since));
    }

    @Data
    static class SendMessageRequest {
        private Long targetUserId;
        private String content;
    }
}
