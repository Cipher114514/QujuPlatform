package com.example.demo.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateTeamRequest {

    @NotBlank(message = "小队名称不能为空")
    @Size(max = 20, message = "小队名称不能超过20字")
    private String name;

    @Size(max = 200, message = "小队简介不能超过200字")
    private String description;

    @NotEmpty(message = "至少选择1个兴趣标签")
    @Size(min = 1, max = 5, message = "兴趣标签为1-5个")
    private List<String> tags;

    @NotNull(message = "必须选择小队类型")
    private Boolean isPublic;
}
