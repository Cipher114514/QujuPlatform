package com.example.demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HandleTeamJoinRequest {

    @NotBlank(message = "操作类型不能为空")
    @Pattern(regexp = "approve|reject", message = "操作类型只能是approve或reject")
    private String action;
}
