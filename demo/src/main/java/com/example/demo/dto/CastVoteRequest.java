package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CastVoteRequest {
    /** 选项索引列表（单选传单个，多选传多个） */
    private java.util.List<Integer> optionIndexes;
}
