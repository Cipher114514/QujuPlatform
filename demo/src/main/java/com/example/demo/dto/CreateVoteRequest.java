package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateVoteRequest {
    /** 投票标题 */
    private String title;
    /** 选项文本列表 */
    private List<String> options;
    /** 是否允许多选 */
    private Boolean isMultiple;
    /** 截止时间（ISO格式，可选） */
    private String deadline;
}
