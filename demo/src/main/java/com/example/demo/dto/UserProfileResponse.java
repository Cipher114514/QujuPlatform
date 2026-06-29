package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {
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
    private String address;
    private String businessFields;
    private String createdAt;
}
