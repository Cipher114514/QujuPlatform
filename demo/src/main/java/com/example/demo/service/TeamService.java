package com.example.demo.service;

import com.example.demo.dto.*;
import com.example.demo.entity.Team;
import com.example.demo.entity.TeamJoinRequest;
import com.example.demo.entity.TeamMember;
import com.example.demo.entity.User;
import com.example.demo.exception.BusinessException;
import com.example.demo.repository.TeamJoinRequestRepository;
import com.example.demo.repository.TeamMemberRepository;
import com.example.demo.repository.TeamRepository;
import com.example.demo.repository.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TeamService {

    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final TeamJoinRequestRepository teamJoinRequestRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    /**
     * 创建小队
     */
    @Transactional
    public TeamResponse createTeam(Long currentUserId, CreateTeamRequest request) {
        // 验证小队名称唯一性
        if (teamRepository.existsByName(request.getName())) {
            throw new BusinessException("小队名称已被使用");
        }

        // 将标签列表转换为JSON字符串
        String tagsJson;
        try {
            tagsJson = objectMapper.writeValueAsString(request.getTags());
        } catch (JsonProcessingException e) {
            throw new BusinessException("标签格式错误");
        }

        // 创建小队
        Team team = Team.builder()
                .name(request.getName())
                .description(request.getDescription())
                .tags(tagsJson)
                .isPublic(request.getIsPublic())
                .leaderId(currentUserId)
                .memberCount(1)
                .status(Team.TeamStatus.ACTIVE)
                .build();

        Team savedTeam = teamRepository.save(team);

        // 创建者自动成为队长
        TeamMember leader = TeamMember.builder()
                .teamId(savedTeam.getId())
                .userId(currentUserId)
                .role(TeamMember.MemberRole.LEADER)
                .build();

        teamMemberRepository.save(leader);

        log.info("用户 {} 创建小队: {}", currentUserId, savedTeam.getName());
        return toTeamResponse(savedTeam, currentUserId);
    }

    /**
     * 获取小队列表（支持搜索和标签筛选）
     */
    public Page<TeamResponse> getTeams(String keyword, String tag, Integer page, Integer size, Long currentUserId) {
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Team> teams;

        String searchKeyword = (keyword != null && !keyword.isEmpty()) ? keyword : "";

        if (tag != null && !tag.isEmpty()) {
            // 有标签筛选
            teams = teamRepository.searchTeamsByTagAndKeyword(tag, searchKeyword, pageable);
        } else {
            // 无标签筛选，按关键词搜索
            if (searchKeyword.isEmpty()) {
                teams = teamRepository.findAllActiveTeams(pageable);
            } else {
                teams = teamRepository.findActiveTeams(searchKeyword, pageable);
            }
        }

        return teams.map(t -> toTeamResponse(t, currentUserId));
    }

    /**
     * 获取小队详情
     */
    public TeamResponse getTeamDetail(Long teamId, Long currentUserId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new BusinessException("小队不存在"));

        return toTeamResponse(team, currentUserId);
    }

    /**
     * 申请加入小队
     */
    @Transactional
    public void joinTeam(Long teamId, Long currentUserId, JoinTeamRequest request) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new BusinessException("小队不存在"));

        if (team.getStatus() != Team.TeamStatus.ACTIVE) {
            throw new BusinessException("小队已解散");
        }

        // 检查是否已经是成员
        if (teamMemberRepository.existsByTeamIdAndUserId(teamId, currentUserId)) {
            throw new BusinessException("您已是该小队成员");
        }

        // 公开小队直接加入
        if (team.getIsPublic()) {
            TeamMember member = TeamMember.builder()
                    .teamId(teamId)
                    .userId(currentUserId)
                    .role(TeamMember.MemberRole.MEMBER)
                    .build();
            teamMemberRepository.save(member);

            // 更新成员数量
            team.setMemberCount(team.getMemberCount() + 1);
            teamRepository.save(team);

            // 清理该用户在这个小队的所有申请记录
            teamJoinRequestRepository.deleteByTeamIdAndUserId(teamId, currentUserId);

            log.info("用户 {} 直接加入小队: {}", currentUserId, team.getName());
        } else {
            // 审核小队：删除旧申请（如果有），创建新申请
            teamJoinRequestRepository.deleteByTeamIdAndUserId(teamId, currentUserId);

            TeamJoinRequest joinRequest = TeamJoinRequest.builder()
                    .teamId(teamId)
                    .userId(currentUserId)
                    .message(request != null ? request.getMessage() : null)
                    .status(TeamJoinRequest.RequestStatus.PENDING)
                    .build();

            teamJoinRequestRepository.save(joinRequest);
            log.info("用户 {} 申请加入小队: {}", currentUserId, team.getName());
        }
    }

    /**
     * 处理加入申请（同意/拒绝）
     */
    @Transactional
    public TeamJoinRequestResponse handleJoinRequest(Long teamId, Long requestId, Long currentUserId, HandleTeamJoinRequest request) {
        // 验证队长权限
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new BusinessException("小队不存在"));

        if (!team.getLeaderId().equals(currentUserId)) {
            throw new BusinessException("只有队长可以处理加入申请");
        }

        TeamJoinRequest joinRequest = teamJoinRequestRepository.findById(requestId)
                .orElseThrow(() -> new BusinessException("申请不存在"));

        if (!joinRequest.getTeamId().equals(teamId)) {
            throw new BusinessException("申请不匹配该小队");
        }

        if (joinRequest.getStatus() != TeamJoinRequest.RequestStatus.PENDING) {
            throw new BusinessException("该申请已被处理");
        }

        joinRequest.setProcessedAt(LocalDateTime.now());

        if ("approve".equalsIgnoreCase(request.getAction())) {
            // 检查用户是否已经是成员
            if (teamMemberRepository.existsByTeamIdAndUserId(teamId, joinRequest.getUserId())) {
                // 已是成员，标记申请为已拒绝
                joinRequest.setStatus(TeamJoinRequest.RequestStatus.REJECTED);
                teamJoinRequestRepository.save(joinRequest);
                throw new BusinessException("用户已是该小队成员");
            }

            // 添加成员
            TeamMember member = TeamMember.builder()
                    .teamId(teamId)
                    .userId(joinRequest.getUserId())
                    .role(TeamMember.MemberRole.MEMBER)
                    .build();
            teamMemberRepository.save(member);

            // 更新成员数量
            team.setMemberCount(team.getMemberCount() + 1);
            teamRepository.save(team);

            // 更新申请状态为已批准
            joinRequest.setStatus(TeamJoinRequest.RequestStatus.APPROVED);
            teamJoinRequestRepository.save(joinRequest);

            log.info("队长 {} 同意用户 {} 加入小队: {}", currentUserId, joinRequest.getUserId(), team.getName());
        } else {
            // 拒绝申请：保留记录，更新状态为REJECTED
            joinRequest.setStatus(TeamJoinRequest.RequestStatus.REJECTED);
            teamJoinRequestRepository.save(joinRequest);
            log.info("队长 {} 拒绝用户 {} 加入小队: {}", currentUserId, joinRequest.getUserId(), team.getName());
        }

        return toJoinRequestResponse(joinRequest);
    }

    /**
     * 退出小队
     */
    @Transactional
    public void leaveTeam(Long teamId, Long currentUserId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new BusinessException("小队不存在"));

        TeamMember member = teamMemberRepository.findByTeamIdAndUserId(teamId, currentUserId)
                .orElseThrow(() -> new BusinessException("您不是该小队成员"));

        // 队长不能退出，只能解散
        if (member.getRole() == TeamMember.MemberRole.LEADER) {
            throw new BusinessException("队长不能退出小队，请使用解散功能");
        }

        // 删除成员关系
        teamMemberRepository.delete(member);

        // 更新成员数量
        team.setMemberCount(Math.max(0, team.getMemberCount() - 1));
        teamRepository.save(team);

        // 删除该用户的所有待处理申请
        teamJoinRequestRepository.deleteByTeamIdAndUserId(teamId, currentUserId);

        log.info("用户 {} 退出小队: {}", currentUserId, team.getName());
    }

    /**
     * 获取小队成员列表
     */
    public List<TeamMemberResponse> getTeamMembers(Long teamId, Long currentUserId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new BusinessException("小队不存在"));

        List<TeamMember> members = teamMemberRepository.findByTeamIdOrderByJoinedAt(teamId);
        List<TeamMemberResponse> result = new ArrayList<>();

        for (TeamMember member : members) {
            User user = userRepository.findById(member.getUserId())
                    .orElse(null);
            if (user != null) {
                result.add(TeamMemberResponse.builder()
                        .id(member.getId())
                        .userId(user.getId())
                        .nickname(user.getNickname())
                        .avatar(user.getAvatar())
                        .role(member.getRole().name().toLowerCase())
                        .joinedAt(member.getJoinedAt())
                        .build());
            }
        }

        return result;
    }

    /**
     * 获取小队的待处理申请列表
     */
    public List<TeamJoinRequestResponse> getPendingRequests(Long teamId, Long currentUserId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new BusinessException("小队不存在"));

        // 验证队长权限
        if (!team.getLeaderId().equals(currentUserId)) {
            throw new BusinessException("只有队长可以查看待处理申请");
        }

        List<TeamJoinRequest> requests = teamJoinRequestRepository.findPendingRequestsByTeamId(teamId);
        return requests.stream()
                .map(this::toJoinRequestResponse)
                .collect(Collectors.toList());
    }

    /**
     * 获取用户的小队列表
     */
    public List<TeamResponse> getMyTeams(Long currentUserId) {
        List<Long> teamIds = teamMemberRepository.findTeamIdsByUserId(currentUserId);
        List<TeamResponse> result = new ArrayList<>();

        for (Long teamId : teamIds) {
            Team team = teamRepository.findById(teamId).orElse(null);
            if (team != null && team.getStatus() == Team.TeamStatus.ACTIVE) {
                result.add(toTeamResponse(team, currentUserId));
            }
        }

        return result;
    }

    // ==================== 私有辅助方法 ====================

    private TeamResponse toTeamResponse(Team team, Long currentUserId) {
        // 解析标签
        List<String> tagList = new ArrayList<>();
        if (team.getTags() != null && !team.getTags().isEmpty()) {
            try {
                tagList = objectMapper.readValue(team.getTags(),
                        objectMapper.getTypeFactory().constructCollectionType(List.class, String.class));
            } catch (JsonProcessingException e) {
                // 忽略解析错误
            }
        }

        // 获取队长信息
        User leader = userRepository.findById(team.getLeaderId()).orElse(null);

        // 获取用户角色和申请状态
        String userRole = null;
        String requestStatus = null;
        if (currentUserId != null) {
            if (team.getLeaderId().equals(currentUserId)) {
                userRole = "leader";
            } else {
                TeamMember member = teamMemberRepository.findByTeamIdAndUserId(team.getId(), currentUserId).orElse(null);
                if (member != null) {
                    userRole = member.getRole().name().toLowerCase();
                } else {
                    // 不是成员，检查申请状态
                    TeamJoinRequest request = teamJoinRequestRepository.findByTeamIdAndUserId(team.getId(), currentUserId).orElse(null);
                    if (request != null) {
                        requestStatus = request.getStatus().name().toLowerCase();
                    }
                }
            }
        }

        return TeamResponse.builder()
                .id(team.getId())
                .name(team.getName())
                .description(team.getDescription())
                .tags(tagList)
                .isPublic(team.getIsPublic())
                .coverImage(team.getCoverImage())
                .leaderId(team.getLeaderId())
                .leaderNickname(leader != null ? leader.getNickname() : null)
                .leaderAvatar(leader != null ? leader.getAvatar() : null)
                .memberCount(team.getMemberCount())
                .status(team.getStatus().name().toLowerCase())
                .createdAt(team.getCreatedAt())
                .updatedAt(team.getUpdatedAt())
                .userRole(userRole)
                .requestStatus(requestStatus)
                .build();
    }

    private TeamJoinRequestResponse toJoinRequestResponse(TeamJoinRequest request) {
        Team team = teamRepository.findById(request.getTeamId()).orElse(null);
        User user = userRepository.findById(request.getUserId()).orElse(null);

        return TeamJoinRequestResponse.builder()
                .id(request.getId())
                .teamId(request.getTeamId())
                .teamName(team != null ? team.getName() : null)
                .userId(request.getUserId())
                .nickname(user != null ? user.getNickname() : null)
                .avatar(user != null ? user.getAvatar() : null)
                .message(request.getMessage())
                .status(request.getStatus().name().toLowerCase())
                .createdAt(request.getCreatedAt())
                .processedAt(request.getProcessedAt())
                .build();
    }
}
