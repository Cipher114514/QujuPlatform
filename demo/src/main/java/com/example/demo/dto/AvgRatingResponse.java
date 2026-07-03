package com.example.demo.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder
public class AvgRatingResponse {
    private BigDecimal avgRating;
    private long totalCount;
}
