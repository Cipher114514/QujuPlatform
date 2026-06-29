package com.example.demo.dto;

import lombok.Data;

@Data
public class UpdateUserRequest {
    private String nickname;
    private String phone;
    private String avatar;
    private String bio;
    private String gender;
    private String birthday;
    private String tags;
    // 商家字段
    private String address;
    private String businessLicense;
    private String businessFields;
}
