package com.example.demo.dto;

import com.example.demo.entity.User;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class AdminUserResponse {
    private Long id;
    private String email;
    private String nickname;
    private String phone;
    private String avatar;
    private String bio;
    private String gender;
    private String birthday;
    private String tags;
    private String role;
    private String status;
    private String businessLicense;
    private String creditCode;
    private String address;
    private String businessFields;
    private String banReason;
    private LocalDateTime banUntil;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static AdminUserResponse from(User u) {
        return AdminUserResponse.builder()
                .id(u.getId())
                .email(u.getEmail())
                .nickname(u.getNickname())
                .phone(u.getPhone())
                .avatar(u.getAvatar())
                .bio(u.getBio())
                .gender(u.getGender())
                .birthday(u.getBirthday())
                .tags(u.getTags())
                .role(u.getRole().name())
                .status(u.getStatus().name())
                .businessLicense(u.getBusinessLicense())
                .creditCode(u.getCreditCode())
                .address(u.getAddress())
                .businessFields(u.getBusinessFields())
                .banReason(u.getBanReason())
                .banUntil(u.getBanUntil())
                .createdAt(u.getCreatedAt())
                .updatedAt(u.getUpdatedAt())
                .build();
    }
}
