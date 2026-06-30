package com.example.demo.dto;

import lombok.Data;

@Data
public class UpdateUserRoleRequest {
    private String role;  // USER, BUSINESS, ADMIN
}
