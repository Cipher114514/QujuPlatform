package com.example.demo.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    @Pattern(regexp = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.com$", message = "邮箱格式不正确，需以.com结尾")
    private String email;

    @NotBlank(message = "密码不能为空")
    @Size(min = 8, message = "密码至少8位")
    @Pattern(regexp = "^(?=.*[a-zA-Z])(?=.*[0-9]).+$", message = "密码必须包含字母和数字")
    private String password;

    @NotBlank(message = "昵称不能为空")
    private String nickname;

    private String phone;

    /** 角色: user 或 business */
    @NotBlank(message = "角色不能为空")
    private String role;

    // 商家专用
    private String creditCode;
    private String businessLicense;
    private String address;
    private String businessFields;  // 服务领域描述
}
