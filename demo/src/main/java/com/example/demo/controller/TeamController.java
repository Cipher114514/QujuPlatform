package com.example.demo.controller;

import com.example.demo.common.Result;
import com.example.demo.dto.*;
import com.example.demo.entity.User;
import com.example.demo.service.TeamService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
            @PathVariable Long id) {
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
            @PathVariable Long id,
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
            @PathVariable Long id) {
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
            @PathVariable Long id) {
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
            @PathVariable Long id) {
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
            @PathVariable Long id,
            @PathVariable Long requestId,
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
}
