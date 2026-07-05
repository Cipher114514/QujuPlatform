package com.example.demo.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class CreateActivityRequest {

    @NotBlank(message = "活动名称不能为空")
    @Size(max = 30, message = "活动名称不能超过30字")
    private String title;

    @NotBlank(message = "活动简介不能为空")
    @Size(max = 500, message = "活动简介不能超过500字")
    private String description;

    @NotBlank(message = "活动分类不能为空")
    private String category;

    @NotNull(message = "活动开始时间不能为空")
    private LocalDateTime startTime;

    @NotNull(message = "活动结束时间不能为空")
    private LocalDateTime endTime;

    @NotBlank(message = "活动地点不能为空")
    private String location;

    @NotNull(message = "人数上限不能为空")
    @Min(value = 1, message = "人数上限必须大于0")
    @Max(value = 100000, message = "人数上限不能超过100000")
    private Integer maxParticipants;

    @NotNull(message = "报名截止时间不能为空")
    private LocalDateTime registrationDeadline;

    private BigDecimal fee;
    private List<String> tags;
    private String coverImage;
    private List<String> images;
    private Double latitude;
    private Double longitude;
}
