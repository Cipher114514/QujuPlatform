package com.example.demo.controller;

import com.example.demo.common.Result;
import com.example.demo.dto.UpdateUserRequest;
import com.example.demo.dto.UserProfileResponse;
import com.example.demo.entity.User;
import com.example.demo.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public Result<UserProfileResponse> getProfile(@AuthenticationPrincipal User currentUser) {
        return Result.ok(userService.getProfile(currentUser));
    }

    @PutMapping("/me")
    public Result<UserProfileResponse> updateProfile(@AuthenticationPrincipal User currentUser,
                                                      @RequestBody UpdateUserRequest req) {
        return Result.ok("更新成功", userService.updateProfile(currentUser, req));
    }
}
