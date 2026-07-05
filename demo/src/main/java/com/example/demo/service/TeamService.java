package com.example.demo.service;

import com.example.demo.annotation.RedisLock;
import com.example.demo.dto.*;
import com.example.demo.entity.*;
import com.example.demo.exception.BusinessException;
import com.example.demo.repository.*;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TeamService {

    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final TeamJoinRequestRepository teamJoinRequestRepository;
    private final TeamPhotoRepository teamPhotoRepository;
    private final UserRepository userRepository;
    private final MessageRepository messageRepository;
    private final ActivityRepository activityRepository;
    private final TeamVoteRepository teamVoteRepository;
    private final TeamVoteRecordRepository teamVoteRecordRepository;
    private final FileService fileService;
    private final ObjectMapper objectMapper;
    private final SimpMessagingTemplate messagingTemplate;
    private final TeamAnnouncementRepository announcementRepository;

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
    @RedisLock(key = "team:join:{teamId}")
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
    @RedisLock(key = "team:handle:{teamId}")
    public TeamJoinRequestResponse handleJoinRequest(Long teamId, Long requestId, Long currentUserId, HandleTeamJoinRequest request) {
        // 验证队长或管理员权限
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new BusinessException("小队不存在"));

        if (!isLeaderOrAdmin(team, currentUserId)) {
            throw new BusinessException("只有队长或管理员可以处理加入申请");
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

        // 验证队长或管理员权限
        if (!isLeaderOrAdmin(team, currentUserId)) {
            throw new BusinessException("只有队长或管理员可以查看待处理申请");
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

    // ==================== 小队群聊 (US-029) ====================

    /**
     * 发送小队群聊消息
     */
    @Transactional
    public TeamMessageItem sendTeamMessage(Long teamId, Long senderId, String content) {
        return sendTeamMessage(teamId, senderId, content, "TEXT", null);
    }

    @Transactional
    public TeamMessageItem sendTeamMessage(Long teamId, Long senderId, String content, String type, String metadata) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new BusinessException("小队不存在"));

        if (team.getStatus() != Team.TeamStatus.ACTIVE) {
            throw new BusinessException("小队已解散");
        }

        // 验证发送者是小队成员
        if (!teamMemberRepository.existsByTeamIdAndUserId(teamId, senderId)) {
            throw new BusinessException("您不是该小队成员");
        }

        if (content == null || content.isBlank()) {
            throw new BusinessException("消息内容不能为空");
        }

        if (content.length() > 2000) {
            throw new BusinessException("消息内容不能超过2000字");
        }

        // @all 权限校验：仅队长/管理员可用
        if (type == null || type.isBlank()) {
            type = "TEXT";
        }
        if (content.contains("@all") || content.contains("@所有人")) {
            TeamMember member = teamMemberRepository.findByTeamIdAndUserId(teamId, senderId)
                    .orElseThrow(() -> new BusinessException("您不是该小队成员"));
            if (!isLeaderOrAdmin(member)) {
                throw new BusinessException("仅队长和管理员可以使用@所有人");
            }
        }

        User sender = userRepository.findById(senderId).orElse(null);

        Message msg = Message.builder()
                .conversationId(0L)  // 群聊不使用conversationId
                .teamId(teamId)
                .senderId(senderId)
                .content(content)
                .type(type)
                .status("DELIVERED")
                .metadata(metadata)
                .build();
        msg = messageRepository.save(msg);

        TeamMessageItem result = TeamMessageItem.builder()
                .id(msg.getId())
                .teamId(teamId)
                .senderId(senderId)
                .senderNickname(sender != null ? sender.getNickname() : null)
                .senderAvatar(sender != null ? sender.getAvatar() : null)
                .content(msg.getContent())
                .type(msg.getType())
                .metadata(msg.getMetadata())
                .sentAt(msg.getSentAt())
                .build();

        // WebSocket 广播给所有小队成员
        messagingTemplate.convertAndSend("/topic/team/" + teamId, result);
        log.info("小队群聊广播: teamId={}, senderId={}, msgId={}", teamId, senderId, msg.getId());

        return result;
    }

    // ===================== 群公告（成员 D）=====================

    /**
     * 获取小队公告
     */
    public TeamAnnouncement getAnnouncement(Long teamId, Long userId) {
        teamRepository.findById(teamId)
                .orElseThrow(() -> new BusinessException("小队不存在"));
        if (!teamMemberRepository.existsByTeamIdAndUserId(teamId, userId)) {
            throw new BusinessException("您不是该小队成员");
        }
        return announcementRepository.findByTeamId(teamId).orElse(null);
    }

    /**
     * 发布/更新公告（仅队长/管理员）
     */
    @Transactional
    public TeamAnnouncement publishAnnouncement(Long teamId, Long publisherId, String content) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new BusinessException("小队不存在"));

        TeamMember member = teamMemberRepository.findByTeamIdAndUserId(teamId, publisherId)
                .orElseThrow(() -> new BusinessException("您不是该小队成员"));

        if (!isLeaderOrAdmin(member)) {
            throw new BusinessException("仅队长和管理员可以发布公告");
        }

        if (content == null || content.isBlank()) {
            throw new BusinessException("公告内容不能为空");
        }
        if (content.length() > 500) {
            throw new BusinessException("公告内容不能超过500字");
        }

        // 使用 saveOrUpdate：每个小队只有一条公告
        TeamAnnouncement announcement = announcementRepository.findByTeamId(teamId)
                .orElse(TeamAnnouncement.builder().teamId(teamId).publisherId(publisherId).build());

        announcement.setContent(content.trim());
        announcement.setPublisherId(publisherId);
        announcement = announcementRepository.save(announcement);

        // WebSocket 推送公告更新
        User publisher = userRepository.findById(publisherId).orElse(null);
        var payload = new AnnouncementPayload(
                announcement.getId(), teamId, announcement.getContent(),
                publisherId, publisher != null ? publisher.getNickname() : null,
                announcement.getUpdatedAt().toString()
        );
        messagingTemplate.convertAndSend("/topic/team/" + teamId + "/announcement", payload);
        log.info("群公告更新: teamId={}, publisherId={}", teamId, publisherId);

        return announcement;
    }

    /**
     * 删除公告（仅队长/管理员）
     */
    @Transactional
    public void deleteAnnouncement(Long teamId, Long userId) {
        teamRepository.findById(teamId)
                .orElseThrow(() -> new BusinessException("小队不存在"));

        TeamMember member = teamMemberRepository.findByTeamIdAndUserId(teamId, userId)
                .orElseThrow(() -> new BusinessException("您不是该小队成员"));

        if (!isLeaderOrAdmin(member)) {
            throw new BusinessException("仅队长和管理员可以删除公告");
        }

        announcementRepository.deleteByTeamId(teamId);

        // WebSocket 推送公告已删除
        Object payload = Map.of("action", "deleted", "teamId", teamId);
        messagingTemplate.convertAndSend("/topic/team/" + teamId + "/announcement", payload);
        log.info("群公告已删除: teamId={}, userId={}", teamId, userId);
    }

    // ===================== 权限工具 =====================

    private boolean isLeaderOrAdmin(TeamMember member) {
        return member.getRole() == TeamMember.MemberRole.LEADER
                || member.getRole() == TeamMember.MemberRole.ADMIN;
    }

    /**
     * 获取小队群聊消息历史（分页）
     */
    public TeamMessagePage getTeamMessages(Long teamId, Long userId, int page, int size) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new BusinessException("小队不存在"));

        // 验证用户是小队成员
        if (!teamMemberRepository.existsByTeamIdAndUserId(teamId, userId)) {
            throw new BusinessException("您不是该小队成员");
        }

        Pageable pageable = PageRequest.of(page - 1, size);
        Page<Message> msgPage = messageRepository.findByTeamIdOrderBySentAtDesc(teamId, pageable);

        List<TeamMessageItem> list = new ArrayList<>();
        for (Message m : msgPage.getContent()) {
            User sender = userRepository.findById(m.getSenderId()).orElse(null);
            list.add(TeamMessageItem.builder()
                    .id(m.getId())
                    .teamId(teamId)
                    .senderId(m.getSenderId())
                    .senderNickname(sender != null ? sender.getNickname() : null)
                    .senderAvatar(sender != null ? sender.getAvatar() : null)
                    .content(m.getContent())
                    .type(m.getType())
                    .metadata(m.getMetadata())
                    .sentAt(m.getSentAt())
                    .build());
        }

        return TeamMessagePage.builder()
                .list(list)
                .pagination(TeamPagination.builder()
                        .page(page)
                        .size(size)
                        .total(msgPage.getTotalElements())
                        .pages(msgPage.getTotalPages())
                        .build())
                .build();
    }

    // ==================== 队内活动 (US-029) ====================

    /**
     * 队长创建队内专属活动
     */
    @Transactional
    public Activity createTeamActivity(Long teamId, Long creatorId, CreateActivityRequest req) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new BusinessException("小队不存在"));

        if (team.getStatus() != Team.TeamStatus.ACTIVE) {
            throw new BusinessException("小队已解散");
        }

        // 仅队长或管理员可以创建队内活动
        if (!isLeaderOrAdmin(team, creatorId)) {
            throw new BusinessException("只有队长或管理员可以创建队内活动");
        }

        // 时间校验
        if (!req.getStartTime().isAfter(LocalDateTime.now())) {
            throw new BusinessException("活动开始时间必须晚于当前系统时间");
        }
        if (!req.getRegistrationDeadline().isBefore(req.getStartTime())) {
            throw new BusinessException("报名截止时间必须早于活动开始时间");
        }
        if (!req.getEndTime().isAfter(req.getStartTime())) {
            throw new BusinessException("活动结束时间必须晚于开始时间");
        }

        String tagsStr = null;
        if (req.getTags() != null && !req.getTags().isEmpty()) {
            tagsStr = String.join(",", req.getTags());
        }

        String imagesStr = null;
        if (req.getImages() != null && !req.getImages().isEmpty()) {
            imagesStr = String.join(",", req.getImages());
        }

        Activity activity = Activity.builder()
                .title(req.getTitle())
                .description(req.getDescription())
                .category(req.getCategory())
                .startTime(req.getStartTime())
                .endTime(req.getEndTime())
                .location(req.getLocation())
                .maxParticipants(req.getMaxParticipants())
                .currentParticipants(0)
                .fee(req.getFee() != null ? req.getFee() : BigDecimal.ZERO)
                .status("ACTIVE")
                .tags(tagsStr)
                .images(imagesStr)
                .coverImage(req.getCoverImage())
                .creatorId(creatorId)
                .teamId(teamId)
                .registrationDeadline(req.getRegistrationDeadline())
                .build();

        Activity saved = activityRepository.save(activity);

        // 群聊广播通知
        User creator = userRepository.findById(creatorId).orElse(null);
        String notice = (creator != null ? creator.getNickname() : "队长") + " 发布了队内活动：「" + saved.getTitle() + "」";
        Message noticeMsg = Message.builder()
                .conversationId(0L)
                .teamId(teamId)
                .senderId(creatorId)
                .content(notice)
                .type("SYSTEM")
                .status("DELIVERED")
                .build();
        messageRepository.save(noticeMsg);
        messagingTemplate.convertAndSend("/topic/team/" + teamId,
                TeamMessageItem.builder()
                        .id(noticeMsg.getId())
                        .teamId(teamId)
                        .senderId(creatorId)
                        .senderNickname(creator != null ? creator.getNickname() : null)
                        .senderAvatar(creator != null ? creator.getAvatar() : null)
                        .content(notice)
                        .type("SYSTEM")
                        .sentAt(noticeMsg.getSentAt())
                        .build());

        log.info("队长 {} 创建队内活动: teamId={}, activityId={}", creatorId, teamId, saved.getId());
        return saved;
    }

    /**
     * 获取队内活动列表
     */
    public Page<Activity> getTeamActivities(Long teamId, Long userId, int page, int size) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new BusinessException("小队不存在"));

        // 验证用户是小队成员
        if (!teamMemberRepository.existsByTeamIdAndUserId(teamId, userId)) {
            throw new BusinessException("您不是该小队成员");
        }

        Pageable pageable = PageRequest.of(page - 1, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return activityRepository.findByTeamId(teamId, pageable);
    }

    // ==================== 小队相册 (US-031) ====================

    /**
     * 获取小队相册照片列表
     */
    public List<TeamPhotoResponse> getAlbum(Long teamId, Long currentUserId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new BusinessException("小队不存在"));

        // 验证用户是成员
        if (!team.getLeaderId().equals(currentUserId)
                && !teamMemberRepository.existsByTeamIdAndUserId(teamId, currentUserId)) {
            throw new BusinessException("只有小队成员可以查看相册");
        }

        List<TeamPhoto> photos = teamPhotoRepository.findByTeamIdOrderByCreatedAtDesc(teamId);
        return photos.stream()
                .map(p -> toPhotoResponse(p, team, currentUserId))
                .collect(Collectors.toList());
    }

    /**
     * 上传照片到小队相册
     */
    @Transactional
    public TeamPhotoResponse uploadPhoto(Long teamId, Long currentUserId, String imageUrl, String description) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new BusinessException("小队不存在"));

        if (team.getStatus() != Team.TeamStatus.ACTIVE) {
            throw new BusinessException("小队已解散，无法上传照片");
        }

        // 验证用户是成员
        if (!team.getLeaderId().equals(currentUserId)
                && !teamMemberRepository.existsByTeamIdAndUserId(teamId, currentUserId)) {
            throw new BusinessException("只有小队成员可以上传照片");
        }

        if (imageUrl == null || imageUrl.isBlank()) {
            throw new BusinessException("图片URL不能为空");
        }

        // 外部URL自动下载到本地，避免防盗链/跨域问题
        String finalUrl;
        try {
            finalUrl = fileService.downloadFromUrl(imageUrl);
        } catch (IOException e) {
            log.error("下载外部图片失败: url={}, error={}", imageUrl, e.getMessage());
            throw new BusinessException("图片下载失败，请检查链接是否可直接访问，或使用本地上传");
        }

        TeamPhoto photo = TeamPhoto.builder()
                .teamId(teamId)
                .userId(currentUserId)
                .imageUrl(finalUrl)
                .description(description != null && !description.isBlank() ? description : null)
                .build();

        TeamPhoto saved = teamPhotoRepository.save(photo);
        log.info("用户 {} 上传照片到小队 {}: {}", currentUserId, teamId, saved.getId());
        return toPhotoResponse(saved, team, currentUserId);
    }

    /**
     * 删除小队相册照片
     */
    @Transactional
    public void deletePhoto(Long teamId, Long photoId, Long currentUserId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new BusinessException("小队不存在"));

        TeamPhoto photo = teamPhotoRepository.findById(photoId)
                .orElseThrow(() -> new BusinessException("照片不存在"));

        if (!photo.getTeamId().equals(teamId)) {
            throw new BusinessException("照片不属于该小队");
        }

        // 队长或管理员可删除任意照片，普通成员只能删除自己的照片
        boolean isLeaderOrAdmin = isLeaderOrAdmin(team, currentUserId);
        if (!isLeaderOrAdmin && !photo.getUserId().equals(currentUserId)) {
            throw new BusinessException("只能删除自己上传的照片");
        }

        teamPhotoRepository.delete(photo);
        log.info("用户 {} 删除小队 {} 的照片 {}", currentUserId, teamId, photoId);
    }

    // ==================== 解散小队 (US-031) ====================

    /**
     * 解散小队（仅队长可操作）
     */
    @Transactional
    @RedisLock(key = "team:disband:{teamId}")
    public void disbandTeam(Long teamId, Long currentUserId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new BusinessException("小队不存在"));

        if (!team.getLeaderId().equals(currentUserId)) {
            throw new BusinessException("只有队长可以解散小队");
        }

        if (team.getStatus() != Team.TeamStatus.ACTIVE) {
            throw new BusinessException("小队已解散");
        }

        // 1. 删除所有成员关系
        teamMemberRepository.deleteByTeamId(teamId);

        // 2. 清空相册
        teamPhotoRepository.deleteByTeamId(teamId);

        // 3. 清空待处理申请
        teamJoinRequestRepository.deleteByTeamId(teamId);

        // 4. 更新小队状态
        team.setStatus(Team.TeamStatus.DISBANDED);
        team.setMemberCount(0);
        teamRepository.save(team);

        log.info("用户 {} 解散了小队 {} (id={})", currentUserId, team.getName(), teamId);
    }

    // ==================== 角色管理 ====================

    /**
     * 队长任命管理员
     */
    @Transactional
    public void appointAdmin(Long teamId, Long leaderId, Long targetUserId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new BusinessException("小队不存在"));

        if (!team.getLeaderId().equals(leaderId)) {
            throw new BusinessException("只有队长可以任命管理员");
        }

        TeamMember member = teamMemberRepository.findByTeamIdAndUserId(teamId, targetUserId)
                .orElseThrow(() -> new BusinessException("该用户不是小队成员"));

        if (member.getRole() == TeamMember.MemberRole.LEADER) {
            throw new BusinessException("队长不能降级自己");
        }

        if (member.getRole() == TeamMember.MemberRole.ADMIN) {
            throw new BusinessException("该用户已经是管理员");
        }

        member.setRole(TeamMember.MemberRole.ADMIN);
        teamMemberRepository.save(member);
        log.info("队长 {} 任命用户 {} 为小队 {} 的管理员", leaderId, targetUserId, teamId);
    }

    /**
     * 队长免除管理员
     */
    @Transactional
    public void removeAdmin(Long teamId, Long leaderId, Long targetUserId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new BusinessException("小队不存在"));

        if (!team.getLeaderId().equals(leaderId)) {
            throw new BusinessException("只有队长可以免除管理员");
        }

        TeamMember member = teamMemberRepository.findByTeamIdAndUserId(teamId, targetUserId)
                .orElseThrow(() -> new BusinessException("该用户不是小队成员"));

        if (member.getRole() != TeamMember.MemberRole.ADMIN) {
            throw new BusinessException("该用户不是管理员");
        }

        member.setRole(TeamMember.MemberRole.MEMBER);
        teamMemberRepository.save(member);
        log.info("队长 {} 免除了用户 {} 在小队 {} 的管理员身份", leaderId, targetUserId, teamId);
    }

    /**
     * 踢出成员
     * - 队长可踢管理员和普通成员
     * - 管理员可踢普通成员
     * - 不可踢自己
     */
    @Transactional
    public void kickMember(Long teamId, Long operatorId, Long targetUserId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new BusinessException("小队不存在"));

        if (operatorId.equals(targetUserId)) {
            throw new BusinessException("不能踢出自己");
        }

        TeamMember operator = teamMemberRepository.findByTeamIdAndUserId(teamId, operatorId)
                .orElseThrow(() -> new BusinessException("您不是该小队成员"));

        TeamMember target = teamMemberRepository.findByTeamIdAndUserId(teamId, targetUserId)
                .orElseThrow(() -> new BusinessException("目标用户不是该小队成员"));

        // 队长不可被踢
        if (target.getRole() == TeamMember.MemberRole.LEADER) {
            throw new BusinessException("不能踢出队长");
        }

        // 权限检查
        if (operator.getRole() == TeamMember.MemberRole.LEADER) {
            // 队长可踢管理员和成员
            // (已排除LEADER和自身)
        } else if (operator.getRole() == TeamMember.MemberRole.ADMIN) {
            // 管理员只能踢普通成员
            if (target.getRole() != TeamMember.MemberRole.MEMBER) {
                throw new BusinessException("管理员只能踢出普通成员");
            }
        } else {
            throw new BusinessException("只有队长或管理员可以踢出成员");
        }

        User targetUser = userRepository.findById(targetUserId).orElse(null);
        String targetName = targetUser != null ? targetUser.getNickname() : "用户" + targetUserId;

        teamMemberRepository.delete(target);
        team.setMemberCount(Math.max(0, team.getMemberCount() - 1));
        teamRepository.save(team);

        // 发送系统消息
        sendTeamMessage(teamId, operatorId, targetName + " 被移出了小队", "SYSTEM", null);

        log.info("用户 {} 将 {} 踢出小队 {}", operatorId, targetUserId, teamId);
    }

    // ==================== 群公告 ====================

    /**
     * 更新群公告（队长或管理员）
     */
    @Transactional
    public void updateAnnouncement(Long teamId, Long userId, String announcement) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new BusinessException("小队不存在"));

        if (!isLeaderOrAdmin(team, userId)) {
            throw new BusinessException("只有队长或管理员可以编辑群公告");
        }

        if (announcement != null && announcement.length() > 500) {
            throw new BusinessException("公告内容不能超过500字");
        }

        team.setAnnouncement(announcement);
        teamRepository.save(team);

        // 通过统一消息通道发送
        String notice = (announcement != null && !announcement.isBlank())
                ? "📢 群公告：\n" + announcement
                : "📢 已清空群公告";
        sendTeamMessage(teamId, userId, notice, "ANNOUNCEMENT", null);

        log.info("用户 {} 更新了小队 {} 的群公告", userId, teamId);
    }

    // ==================== 群投票 ====================

    /**
     * 创建群投票（仅队长和管理员可发起）
     */
    @Transactional
    public VoteResponse createVote(Long teamId, Long userId, CreateVoteRequest req) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new BusinessException("小队不存在"));

        if (!isLeaderOrAdmin(team, userId)) {
            throw new BusinessException("只有队长或管理员可以发起投票");
        }

        if (!teamMemberRepository.existsByTeamIdAndUserId(teamId, userId)) {
            throw new BusinessException("您不是该小队成员");
        }

        if (req.getTitle() == null || req.getTitle().isBlank()) {
            throw new BusinessException("投票标题不能为空");
        }

        if (req.getOptions() == null || req.getOptions().size() < 2) {
            throw new BusinessException("至少需要2个选项");
        }

        if (req.getOptions().size() > 20) {
            throw new BusinessException("最多支持20个选项");
        }

        // 解析截止时间
        LocalDateTime deadline = null;
        if (req.getDeadline() != null && !req.getDeadline().isBlank()) {
            try {
                deadline = LocalDateTime.parse(req.getDeadline());
                if (!deadline.isAfter(LocalDateTime.now())) {
                    throw new BusinessException("截止时间必须晚于当前时间");
                }
            } catch (Exception e) {
                throw new BusinessException("截止时间格式不正确");
            }
        }

        // 构建选项JSON
        List<Map<String, Object>> optionList = new ArrayList<>();
        for (int i = 0; i < req.getOptions().size(); i++) {
            Map<String, Object> opt = new java.util.HashMap<>();
            opt.put("index", i);
            opt.put("text", req.getOptions().get(i));
            opt.put("count", 0);
            optionList.add(opt);
        }

        String optionsJson;
        try {
            optionsJson = objectMapper.writeValueAsString(optionList);
        } catch (JsonProcessingException e) {
            throw new BusinessException("选项格式错误");
        }

        TeamVote vote = TeamVote.builder()
                .teamId(teamId)
                .creatorId(userId)
                .title(req.getTitle())
                .options(optionsJson)
                .isMultiple(req.getIsMultiple() != null && req.getIsMultiple())
                .deadline(deadline)
                .status(TeamVote.VoteStatus.ACTIVE)
                .build();

        TeamVote saved = teamVoteRepository.save(vote);

        // 通过统一消息通道发送投票通知
        String voteMsg = "发起了投票：「" + req.getTitle() + "」";
        String metadata = "{\"voteId\":" + saved.getId() + "}";
        sendTeamMessage(teamId, userId, voteMsg, "VOTE", metadata);

        log.info("用户 {} 在小队 {} 创建了投票 {}", userId, teamId, saved.getId());
        return toVoteResponse(saved, userId);
    }

    /**
     * 参与投票
     */
    @Transactional
    public VoteResponse castVote(Long teamId, Long voteId, Long userId, CastVoteRequest req) {
        TeamVote vote = teamVoteRepository.findById(voteId)
                .orElseThrow(() -> new BusinessException("投票不存在"));

        if (!vote.getTeamId().equals(teamId)) {
            throw new BusinessException("投票不属于该小队");
        }

        if (!teamMemberRepository.existsByTeamIdAndUserId(teamId, userId)) {
            throw new BusinessException("您不是该小队成员");
        }

        if (vote.getStatus() != TeamVote.VoteStatus.ACTIVE) {
            throw new BusinessException("投票已结束");
        }

        // 检查是否过了截止时间
        if (vote.getDeadline() != null && LocalDateTime.now().isAfter(vote.getDeadline())) {
            vote.setStatus(TeamVote.VoteStatus.CLOSED);
            vote.setClosedAt(LocalDateTime.now());
            teamVoteRepository.save(vote);
            throw new BusinessException("投票已截止");
        }

        if (req.getOptionIndexes() == null || req.getOptionIndexes().isEmpty()) {
            throw new BusinessException("请选择投票选项");
        }

        // 解析当前选项
        List<Map<String, Object>> optionList;
        try {
            optionList = objectMapper.readValue(vote.getOptions(),
                    objectMapper.getTypeFactory().constructCollectionType(List.class, Map.class));
        } catch (JsonProcessingException e) {
            throw new BusinessException("投票数据异常");
        }

        // 校验选项索引
        for (int idx : req.getOptionIndexes()) {
            if (idx < 0 || idx >= optionList.size()) {
                throw new BusinessException("无效的选项");
            }
        }

        // 单选模式只允许选一个
        if (!vote.getIsMultiple() && req.getOptionIndexes().size() > 1) {
            throw new BusinessException("该投票为单选，只能选择一个选项");
        }

        // 删除用户之前的投票记录（允许改票/取消重投）
        List<TeamVoteRecord> existingRecords = teamVoteRecordRepository.findByVoteIdAndUserId(voteId, userId);
        if (!existingRecords.isEmpty()) {
            // 先减去旧的计数
            for (TeamVoteRecord rec : existingRecords) {
                Map<String, Object> opt = optionList.get(rec.getOptionIndex());
                opt.put("count", Math.max(0, ((Number) opt.get("count")).intValue() - 1));
            }
            teamVoteRecordRepository.deleteAll(existingRecords);
        }

        // 添加新记录
        for (int idx : req.getOptionIndexes()) {
            TeamVoteRecord record = TeamVoteRecord.builder()
                    .voteId(voteId)
                    .userId(userId)
                    .optionIndex(idx)
                    .build();
            teamVoteRecordRepository.save(record);

            // 更新计数
            Map<String, Object> opt = optionList.get(idx);
            opt.put("count", ((Number) opt.get("count")).intValue() + 1);
        }

        // 保存更新后的选项
        try {
            vote.setOptions(objectMapper.writeValueAsString(optionList));
        } catch (JsonProcessingException e) {
            throw new BusinessException("投票数据更新失败");
        }
        teamVoteRepository.save(vote);

        log.info("用户 {} 参与了投票 {}", userId, voteId);
        return toVoteResponse(vote, userId);
    }

    /**
     * 获取投票列表
     */
    public List<VoteResponse> getVotes(Long teamId, Long userId) {
        if (!teamMemberRepository.existsByTeamIdAndUserId(teamId, userId)) {
            throw new BusinessException("您不是该小队成员");
        }

        List<TeamVote> votes = teamVoteRepository.findByTeamIdOrderByCreatedAtDesc(teamId);
        return votes.stream()
                .map(v -> toVoteResponse(v, userId))
                .collect(Collectors.toList());
    }

    /**
     * 获取单个投票详情
     */
    public VoteResponse getVoteDetail(Long teamId, Long voteId, Long userId) {
        TeamVote vote = teamVoteRepository.findById(voteId)
                .orElseThrow(() -> new BusinessException("投票不存在"));

        if (!vote.getTeamId().equals(teamId)) {
            throw new BusinessException("投票不属于该小队");
        }

        if (!teamMemberRepository.existsByTeamIdAndUserId(teamId, userId)) {
            throw new BusinessException("您不是该小队成员");
        }

        return toVoteResponse(vote, userId);
    }

    /**
     * 关闭投票（创建者、队长或管理员）
     */
    @Transactional
    public void closeVote(Long teamId, Long voteId, Long userId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new BusinessException("小队不存在"));

        TeamVote vote = teamVoteRepository.findById(voteId)
                .orElseThrow(() -> new BusinessException("投票不存在"));

        if (!vote.getTeamId().equals(teamId)) {
            throw new BusinessException("投票不属于该小队");
        }

        // 创建者、队长或管理员可以关闭投票
        if (!vote.getCreatorId().equals(userId) && !team.getLeaderId().equals(userId)
                && !isAdmin(teamId, userId)) {
            throw new BusinessException("只有投票发起者、队长或管理员可以关闭投票");
        }

        if (vote.getStatus() != TeamVote.VoteStatus.ACTIVE) {
            throw new BusinessException("投票已经结束");
        }

        vote.setStatus(TeamVote.VoteStatus.CLOSED);
        vote.setClosedAt(LocalDateTime.now());
        teamVoteRepository.save(vote);

        // 通过统一消息通道发送
        sendTeamMessage(teamId, userId, "📊 关闭了投票：「" + vote.getTitle() + "」", "SYSTEM", null);

        log.info("用户 {} 关闭了小队 {} 的投票 {}", userId, teamId, voteId);
    }

    // ==================== 私有辅助方法 ====================

    /**
     * 判断用户是否是队长或管理员
     */
    private boolean isLeaderOrAdmin(Team team, Long userId) {
        if (team.getLeaderId().equals(userId)) {
            return true;
        }
        return isAdmin(team.getId(), userId);
    }

    /**
     * 判断用户是否是管理员
     */
    private boolean isAdmin(Long teamId, Long userId) {
        TeamMember member = teamMemberRepository.findByTeamIdAndUserId(teamId, userId).orElse(null);
        return member != null && member.getRole() == TeamMember.MemberRole.ADMIN;
    }

    private VoteResponse toVoteResponse(TeamVote vote, Long currentUserId) {
        // 解析选项
        List<VoteResponse.VoteOptionItem> optionItems = new ArrayList<>();
        try {
            List<Map<String, Object>> optionList = objectMapper.readValue(vote.getOptions(),
                    objectMapper.getTypeFactory().constructCollectionType(List.class, Map.class));
            for (Map<String, Object> opt : optionList) {
                optionItems.add(VoteResponse.VoteOptionItem.builder()
                        .index(((Number) opt.get("index")).intValue())
                        .text((String) opt.get("text"))
                        .count(((Number) opt.get("count")).intValue())
                        .build());
            }
        } catch (JsonProcessingException e) {
            // ignore
        }

        // 计算总票数
        int totalVotes = optionItems.stream().mapToInt(VoteResponse.VoteOptionItem::getCount).sum();

        // 检查当前用户是否已投票
        boolean hasVoted = false;
        if (currentUserId != null) {
            hasVoted = teamVoteRecordRepository.existsByVoteIdAndUserId(vote.getId(), currentUserId);
        }

        User creator = userRepository.findById(vote.getCreatorId()).orElse(null);

        return VoteResponse.builder()
                .id(vote.getId())
                .teamId(vote.getTeamId())
                .creatorId(vote.getCreatorId())
                .creatorNickname(creator != null ? creator.getNickname() : null)
                .creatorAvatar(creator != null ? creator.getAvatar() : null)
                .title(vote.getTitle())
                .options(optionItems)
                .isMultiple(vote.getIsMultiple())
                .status(vote.getStatus().name().toLowerCase())
                .totalVotes(totalVotes)
                .hasVoted(hasVoted)
                .deadline(vote.getDeadline())
                .createdAt(vote.getCreatedAt())
                .closedAt(vote.getClosedAt())
                .build();
    }

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
                .announcement(team.getAnnouncement())
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

    private TeamPhotoResponse toPhotoResponse(TeamPhoto photo, Team team, Long currentUserId) {
        User uploader = userRepository.findById(photo.getUserId()).orElse(null);
        boolean isLeaderOrAdmin = isLeaderOrAdmin(team, currentUserId);
        boolean isOwner = photo.getUserId().equals(currentUserId);

        return TeamPhotoResponse.builder()
                .id(photo.getId())
                .teamId(photo.getTeamId())
                .userId(photo.getUserId())
                .nickname(uploader != null ? uploader.getNickname() : null)
                .avatar(uploader != null ? uploader.getAvatar() : null)
                .imageUrl(photo.getImageUrl())
                .description(photo.getDescription())
                .createdAt(photo.getCreatedAt())
                .canDelete(isLeaderOrAdmin || isOwner)
                .build();
    }

    // ===================== 内部响应类型 =====================

    @Data @Builder
    public static class TeamMessageItem {
        private Long id;
        private Long teamId;
        private Long senderId;
        private String senderNickname;
        private String senderAvatar;
        private String content;
        private String type;
        private String metadata;
        private LocalDateTime sentAt;
    }

    @Data @Builder
    public static class TeamMessagePage {
        private List<TeamMessageItem> list;
        private TeamPagination pagination;
    }

    @Data @Builder
    public static class TeamPagination {
        private int page;
        private int size;
        private long total;
        private int pages;
    }

    @Data @Builder
    public static class AnnouncementPayload {
        private Long id;
        private Long teamId;
        private String content;
        private Long publisherId;
        private String publisherNickname;
        private String updatedAt;
    }
}
