package com.example.demo.controller;

import com.example.demo.common.Result;
import com.example.demo.dto.*;
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
        log.info("发送小队群聊消息: teamId={}, senderId={}, type={}", id, currentUser.getId(), req.getType());
        return Result.ok(teamService.sendTeamMessage(id, currentUser.getId(),
                req.getContent(), req.getType(), req.getMetadata()));
    }

    // ==================== 队内活动 ====================

    /**
     * 创建队内专属活动（队长或管理员）
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

    // ==================== 角色管理 ====================

    /**
     * 任命管理员（仅队长）
     */
    @PutMapping("/{id}/members/{userId}/appoint-admin")
    public Result<Void> appointAdmin(
            @AuthenticationPrincipal User currentUser,
            @PathVariable("id") Long id,
            @PathVariable("userId") Long userId) {
        log.info("任命管理员: teamId={}, leaderId={}, userId={}", id, currentUser.getId(), userId);
        teamService.appointAdmin(id, currentUser.getId(), userId);
        return Result.ok("已任命为管理员", null);
    }

    /**
     * 免除管理员（仅队长）
     */
    @PutMapping("/{id}/members/{userId}/remove-admin")
    public Result<Void> removeAdmin(
            @AuthenticationPrincipal User currentUser,
            @PathVariable("id") Long id,
            @PathVariable("userId") Long userId) {
        log.info("免除管理员: teamId={}, leaderId={}, userId={}", id, currentUser.getId(), userId);
        teamService.removeAdmin(id, currentUser.getId(), userId);
        return Result.ok("已免除管理员", null);
    }

    // ==================== 群公告 ====================

    /**
     * 更新群公告（队长或管理员）
     */
    @PutMapping("/{id}/announcement")
    public Result<Void> updateAnnouncement(
            @AuthenticationPrincipal User currentUser,
            @PathVariable("id") Long id,
            @RequestBody Map<String, String> body) {
        String announcement = body.get("announcement");
        log.info("更新群公告: teamId={}, userId={}", id, currentUser.getId());
        teamService.updateAnnouncement(id, currentUser.getId(), announcement);
        return Result.ok("公告已更新", null);
    }

    // ==================== 群投票 ====================

    /**
     * 创建群投票
     */
    @PostMapping("/{id}/votes")
    public Result<VoteResponse> createVote(
            @AuthenticationPrincipal User currentUser,
            @PathVariable("id") Long id,
            @Valid @RequestBody CreateVoteRequest request) {
        log.info("创建群投票: teamId={}, userId={}", id, currentUser.getId());
        return Result.ok(teamService.createVote(id, currentUser.getId(), request));
    }

    /**
     * 参与投票
     */
    @PostMapping("/{id}/votes/{voteId}")
    public Result<VoteResponse> castVote(
            @AuthenticationPrincipal User currentUser,
            @PathVariable("id") Long id,
            @PathVariable("voteId") Long voteId,
            @Valid @RequestBody CastVoteRequest request) {
        log.info("参与投票: teamId={}, voteId={}, userId={}", id, voteId, currentUser.getId());
        return Result.ok(teamService.castVote(id, voteId, currentUser.getId(), request));
    }

    /**
     * 获取投票列表
     */
    @GetMapping("/{id}/votes")
    public Result<List<VoteResponse>> getVotes(
            @AuthenticationPrincipal User currentUser,
            @PathVariable("id") Long id) {
        log.info("获取投票列表: teamId={}", id);
        return Result.ok(teamService.getVotes(id, currentUser.getId()));
    }

    /**
     * 获取单个投票详情
     */
    @GetMapping("/{id}/votes/{voteId}")
    public Result<VoteResponse> getVoteDetail(
            @AuthenticationPrincipal User currentUser,
            @PathVariable("id") Long id,
            @PathVariable("voteId") Long voteId) {
        log.info("获取投票详情: teamId={}, voteId={}", id, voteId);
        return Result.ok(teamService.getVoteDetail(id, voteId, currentUser.getId()));
    }

    /**
     * 关闭投票（发起者、队长或管理员）
     */
    @PutMapping("/{id}/votes/{voteId}/close")
    public Result<Void> closeVote(
            @AuthenticationPrincipal User currentUser,
            @PathVariable("id") Long id,
            @PathVariable("voteId") Long voteId) {
        log.info("关闭投票: teamId={}, voteId={}, userId={}", id, voteId, currentUser.getId());
        teamService.closeVote(id, voteId, currentUser.getId());
        return Result.ok("投票已关闭", null);
    }

    @Data
    static class SendMessageRequest {
        private String content;
        private String type;
        private String metadata;
        private String fileName;
    }
}
