package com.example.demo.controller;

import com.example.demo.common.Result;
import com.example.demo.dto.*;
import com.example.demo.entity.TeamAnnouncement;
import com.example.demo.entity.User;
import com.example.demo.service.TeamService;
import jakarta.validation.Valid;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/teams")
@RequiredArgsConstructor
@Slf4j
public class TeamController {

    private final TeamService teamService;

    /**
     * 创建小队
     */
    @PostMapping
    public Result<TeamResponse> createTeam(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody CreateTeamRequest request) {
        log.info("创建小队: userId={}, name={}", currentUser.getId(), request.getName());
        TeamResponse response = teamService.createTeam(currentUser.getId(), request);
        return Result.ok("小队创建成功", response);
    }

    /**
     * 获取小队列表（发现页）
     */
    @GetMapping
    public Result<Page<TeamResponse>> getTeams(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String tag,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "12") Integer size) {
        log.info("获取小队列表: keyword={}, tag={}, page={}", keyword, tag, page);
        Page<TeamResponse> teams = teamService.getTeams(keyword, tag, page, size, currentUser.getId());
        return Result.ok(teams);
    }

    /**
     * 获取小队详情
     */
    @GetMapping("/{id}")
    public Result<TeamResponse> getTeamDetail(
            @AuthenticationPrincipal User currentUser,
            @PathVariable("id") Long id) {
        log.info("获取小队详情: teamId={}", id);
        TeamResponse response = teamService.getTeamDetail(id, currentUser.getId());
        return Result.ok(response);
    }

    /**
     * 申请加入小队
     */
    @PostMapping("/{id}/join")
    public Result<Void> joinTeam(
            @AuthenticationPrincipal User currentUser,
            @PathVariable("id") Long id,
            @RequestBody(required = false) JoinTeamRequest request) {
        log.info("申请加入小队: userId={}, teamId={}", currentUser.getId(), id);
        teamService.joinTeam(id, currentUser.getId(), request);
        return Result.ok("申请成功", null);
    }

    /**
     * 退出小队
     */
    @DeleteMapping("/{id}/leave")
    public Result<Void> leaveTeam(
            @AuthenticationPrincipal User currentUser,
            @PathVariable("id") Long id) {
        log.info("退出小队: userId={}, teamId={}", currentUser.getId(), id);
        teamService.leaveTeam(id, currentUser.getId());
        return Result.ok("已退出小队", null);
    }

    /**
     * 获取小队成员列表
     */
    @GetMapping("/{id}/members")
    public Result<List<TeamMemberResponse>> getTeamMembers(
            @AuthenticationPrincipal User currentUser,
            @PathVariable("id") Long id) {
        log.info("获取小队成员: teamId={}", id);
        List<TeamMemberResponse> members = teamService.getTeamMembers(id, currentUser.getId());
        return Result.ok(members);
    }

    /**
     * 获取小队的待处理申请列表
     */
    @GetMapping("/{id}/requests/pending")
    public Result<List<TeamJoinRequestResponse>> getPendingRequests(
            @AuthenticationPrincipal User currentUser,
            @PathVariable("id") Long id) {
        log.info("获取待处理申请: teamId={}", id);
        List<TeamJoinRequestResponse> requests = teamService.getPendingRequests(id, currentUser.getId());
        return Result.ok(requests);
    }

    /**
     * 处理加入申请
     */
    @PostMapping("/{id}/requests/{requestId}")
    public Result<TeamJoinRequestResponse> handleJoinRequest(
            @AuthenticationPrincipal User currentUser,
            @PathVariable("id") Long id,
            @PathVariable("requestId") Long requestId,
            @Valid @RequestBody HandleTeamJoinRequest request) {
        log.info("处理加入申请: teamId={}, requestId={}, action={}", id, requestId, request.getAction());
        TeamJoinRequestResponse response = teamService.handleJoinRequest(id, requestId, currentUser.getId(), request);
        return Result.ok("处理成功", response);
    }

    /**
     * 获取我的小队列表
     */
    @GetMapping("/me/list")
    public Result<List<TeamResponse>> getMyTeams(
            @AuthenticationPrincipal User currentUser) {
        log.info("获取我的小队列表: userId={}", currentUser.getId());
        List<TeamResponse> teams = teamService.getMyTeams(currentUser.getId());
        return Result.ok(teams);
    }

    // ==================== 小队群聊 ====================

    /**
     * 获取小队群聊消息历史
     */
    @GetMapping("/{id}/messages")
    public Result<TeamService.TeamMessagePage> getTeamMessages(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.info("获取小队群聊消息: teamId={}, page={}", id, page);
        return Result.ok(teamService.getTeamMessages(id, currentUser.getId(), page, size));
    }

    /**
     * 发送小队群聊消息
     */
    @PostMapping("/{id}/messages")
    public Result<TeamService.TeamMessageItem> sendTeamMessage(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id,
            @RequestBody SendMessageRequest req) {
        log.info("发送小队群聊消息: teamId={}, senderId={}", id, currentUser.getId());
        return Result.ok(teamService.sendTeamMessage(id, currentUser.getId(), req.getContent()));
    }

    // ==================== 队内活动 ====================

    /**
     * 创建队内专属活动（仅队长）
     */
    @PostMapping("/{id}/activities")
    public Result<?> createTeamActivity(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id,
            @Valid @RequestBody CreateActivityRequest req) {
        log.info("创建队内活动: teamId={}, creatorId={}", id, currentUser.getId());
        return Result.ok("队内活动创建成功", teamService.createTeamActivity(id, currentUser.getId(), req));
    }

    /**
     * 获取队内活动列表（仅成员）
     */
    @GetMapping("/{id}/activities")
    public Result<Page<com.example.demo.entity.Activity>> getTeamActivities(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        log.info("获取队内活动列表: teamId={}, page={}", id, page);
        return Result.ok(teamService.getTeamActivities(id, currentUser.getId(), page, size));
    }

    // ==================== 小队相册 ====================

    /**
     * 获取小队相册照片列表
     */
    @GetMapping("/{id}/album")
    public Result<List<TeamPhotoResponse>> getAlbum(
            @AuthenticationPrincipal User currentUser,
            @PathVariable("id") Long id) {
        log.info("获取小队相册: teamId={}", id);
        List<TeamPhotoResponse> photos = teamService.getAlbum(id, currentUser.getId());
        return Result.ok(photos);
    }

    /**
     * 上传照片到小队相册
     */
    @PostMapping("/{id}/album")
    public Result<TeamPhotoResponse> uploadPhoto(
            @AuthenticationPrincipal User currentUser,
            @PathVariable("id") Long id,
            @Valid @RequestBody UploadPhotoRequest request) {
        log.info("上传照片到小队相册: teamId={}, userId={}", id, currentUser.getId());
        TeamPhotoResponse photo = teamService.uploadPhoto(id, currentUser.getId(),
                request.getImageUrl(), request.getDescription());
        return Result.ok("上传成功", photo);
    }

    /**
     * 删除相册照片
     */
    @DeleteMapping("/{id}/album/{photoId}")
    public Result<Void> deletePhoto(
            @AuthenticationPrincipal User currentUser,
            @PathVariable("id") Long id,
            @PathVariable("photoId") Long photoId) {
        log.info("删除小队相册照片: teamId={}, photoId={}", id, photoId);
        teamService.deletePhoto(id, photoId, currentUser.getId());
        return Result.ok("删除成功", null);
    }

    // ==================== 解散小队 ====================

    /**
     * 解散小队（仅队长）
     */
    @PostMapping("/{id}/disband")
    public Result<Void> disbandTeam(
            @AuthenticationPrincipal User currentUser,
            @PathVariable("id") Long id) {
        log.info("解散小队: teamId={}, userId={}", id, currentUser.getId());
        teamService.disbandTeam(id, currentUser.getId());
        return Result.ok("小队已解散", null);
    }

    // ==================== 群公告（成员 D）====================

    /**
     * 获取小队公告
     */
    @GetMapping("/{id}/announcement")
    public Result<TeamAnnouncement> getAnnouncement(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id) {
        TeamAnnouncement announcement = teamService.getAnnouncement(id, currentUser.getId());
        return Result.ok(announcement);
    }

    /**
     * 发布/更新公告（队长/管理员）
     */
    @PostMapping("/{id}/announcement")
    public Result<TeamAnnouncement> publishAnnouncement(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String content = body.get("content");
        TeamAnnouncement announcement = teamService.publishAnnouncement(id, currentUser.getId(), content);
        return Result.ok("公告已发布", announcement);
    }

    /**
     * 删除公告（队长/管理员）
     */
    @DeleteMapping("/{id}/announcement")
    public Result<Void> deleteAnnouncement(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id) {
        teamService.deleteAnnouncement(id, currentUser.getId());
        return Result.ok("公告已删除", null);
    }

    @Data
    static class SendMessageRequest {
        private String content;
    }
}
