package com.example.demo.controller;

import com.example.demo.common.Result;
import com.example.demo.dto.*;
import com.example.demo.entity.Activity;
import com.example.demo.entity.Team;
import com.example.demo.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    // ==================== 统计 ====================

    @GetMapping("/stats")
    public Result<AdminStatsResponse> getStats() {
        return Result.ok(adminService.getStats());
    }

    // ==================== 用户管理 ====================

    @GetMapping("/users")
    public Result<Page<AdminUserResponse>> listUsers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return Result.ok(adminService.listUsers(keyword, role, status, page, size));
    }

    @GetMapping("/users/{id}")
    public Result<AdminUserResponse> getUserDetail(@PathVariable Long id) {
        return Result.ok(adminService.getUserDetail(id));
    }

    @PutMapping("/users/{id}/role")
    public Result<AdminUserResponse> updateUserRole(@PathVariable Long id,
                                                     @RequestBody UpdateUserRoleRequest req) {
        return Result.ok("角色已更新", adminService.updateUserRole(id, req));
    }

    @PutMapping("/users/{id}/ban")
    public Result<AdminUserResponse> banUser(@PathVariable Long id,
                                              @RequestBody BanUserRequest req) {
        return Result.ok("已封禁用户", adminService.banUser(id, req));
    }

    @PutMapping("/users/{id}/unban")
    public Result<AdminUserResponse> unbanUser(@PathVariable Long id) {
        return Result.ok("已解封用户", adminService.unbanUser(id));
    }

    // ==================== 商家审批 ====================

    @GetMapping("/businesses/pending")
    public Result<Page<AdminUserResponse>> listPendingBusinesses(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return Result.ok(adminService.listUsers(null, "BUSINESS", "PENDING", page, size));
    }

    @PutMapping("/businesses/{id}/approve")
    public Result<AdminUserResponse> approveBusiness(@PathVariable Long id) {
        return Result.ok("商家已审批通过", adminService.approveBusiness(id));
    }

    @DeleteMapping("/businesses/{id}")
    public Result<Void> rejectBusiness(@PathVariable Long id) {
        adminService.rejectBusiness(id);
        return Result.ok();
    }

    // ==================== 活动管理 ====================

    @GetMapping("/activities")
    public Result<Page<Activity>> listActivities(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return Result.ok(adminService.listAllActivities(keyword, status, page, size));
    }

    @PutMapping("/activities/{id}/cancel")
    public Result<Activity> cancelActivity(@PathVariable Long id) {
        return Result.ok("活动已下架", adminService.cancelActivity(id));
    }

    @DeleteMapping("/activities/{id}")
    public Result<Void> deleteActivity(@PathVariable Long id) {
        adminService.deleteActivity(id);
        return Result.ok();
    }

    @PutMapping("/activities/{id}/restore")
    public Result<Activity> restoreActivity(@PathVariable Long id) {
        return Result.ok("活动已恢复", adminService.restoreActivity(id));
    }

    // ==================== 小队管理 ====================

    @GetMapping("/teams")
    public Result<Page<Team>> listTeams(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return Result.ok(adminService.listAllTeams(keyword, status, page, size));
    }

    @GetMapping("/teams/{id}")
    public Result<java.util.Map<String, Object>> getTeamDetail(@PathVariable Long id) {
        return Result.ok(adminService.getTeamDetail(id));
    }

    @PutMapping("/teams/{id}/disable")
    public Result<Team> disableTeam(@PathVariable Long id,
                                     @RequestBody DisableTeamRequest req) {
        return Result.ok("小队已停用", adminService.disableTeam(id, req));
    }

    @PutMapping("/teams/{id}/restore")
    public Result<Team> restoreTeam(@PathVariable Long id) {
        return Result.ok("小队已恢复", adminService.restoreTeam(id));
    }
}
