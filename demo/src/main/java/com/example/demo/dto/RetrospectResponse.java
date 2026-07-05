package com.example.demo.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder
public class RetrospectResponse {
    private long totalRegistrations;
    private long checkedInCount;
    private long confirmedCount;
    private long cancelledCount;
    private BigDecimal checkInRate;
}
