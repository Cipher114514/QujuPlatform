package com.example.demo.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class RetrospectDetailResponse {
    private List<UserBriefResponse> checkedInUsers;
    private List<UserBriefResponse> confirmedUsers;
    private List<UserBriefResponse> cancelledUsers;
}
