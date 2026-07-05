package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiGenerateResponse {
    private String title;
    private String description;
    private List<String> tags;
    private String suggestedLocation;
}
