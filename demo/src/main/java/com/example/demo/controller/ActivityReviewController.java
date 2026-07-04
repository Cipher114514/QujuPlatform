package com.example.demo.controller;

import com.example.demo.common.Result;
import com.example.demo.dto.*;
import com.example.demo.entity.User;
import com.example.demo.service.ReviewService;
import com.example.demo.service.RetrospectService;
import com.example.demo.service.FileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/activities")
@RequiredArgsConstructor
public class ActivityReviewController {

    private final ReviewService reviewService;
    private final RetrospectService retrospectService;
    private final FileService fileService;

    /** 提交评价 */
    @PostMapping("/{id}/review")
    public Result<ReviewResponse> createReview(@PathVariable Long id,
                                                @Valid @RequestBody CreateReviewRequest req,
                                                @AuthenticationPrincipal User currentUser) {
        return Result.ok("评价成功", reviewService.createReview(id, currentUser.getId(), req));
    }

    /** 获取评价列表 */
    @GetMapping("/{id}/reviews")
    public Result<Page<ReviewResponse>> getReviews(@PathVariable Long id,
                                                    @RequestParam(defaultValue = "0") int page,
                                                    @RequestParam(defaultValue = "10") int size) {
        return Result.ok(reviewService.getReviews(id, page, size));
    }

    /** 获取平均评分 */
    @GetMapping("/{id}/review/avg")
    public Result<AvgRatingResponse> getAvgRating(@PathVariable Long id) {
        return Result.ok(reviewService.getAvgRating(id));
    }

    /** 删除自己的评价 */
    @DeleteMapping("/{id}/review")
    public Result<Void> deleteReview(@PathVariable Long id,
                                      @AuthenticationPrincipal User currentUser) {
        reviewService.deleteReview(id, currentUser.getId());
        return Result.ok(null);
    }

    /** 活动复盘统计 */
    @GetMapping("/{id}/retrospect")
    public Result<RetrospectResponse> getRetrospect(@PathVariable Long id) {
        return Result.ok(retrospectService.getRetrospect(id));
    }

    /** 花絮列表 */
    @GetMapping("/{id}/retrospect/gallery")
    public Result<Page<GalleryItemResponse>> getGallery(@PathVariable Long id,
                                                         @RequestParam(defaultValue = "0") int page,
                                                         @RequestParam(defaultValue = "12") int size) {
        return Result.ok(retrospectService.getGallery(id, page, size));
    }

    /** 上传花絮 */
    @PostMapping("/{id}/retrospect/gallery")
    public Result<GalleryItemResponse> addGallery(@PathVariable Long id,
                                                   @Valid @RequestBody GalleryUploadRequest req,
                                                   @AuthenticationPrincipal User currentUser) {
        return Result.ok("上传成功", retrospectService.addGallery(id, currentUser.getId(), req.getImageUrl()));
    }

    /** 删除花絮 */
    @DeleteMapping("/{id}/retrospect/gallery/{galleryId}")
    public Result<Void> deleteGallery(@PathVariable Long id,
                                       @PathVariable Long galleryId,
                                       @AuthenticationPrincipal User currentUser) {
        retrospectService.deleteGallery(id, galleryId, currentUser.getId());
        return Result.ok();
    }

    /** 参与者详情（用于悬停显示名单） */
    @GetMapping("/{id}/retrospect/details")
    public Result<RetrospectDetailResponse> getRetrospectDetails(@PathVariable Long id) {
        return Result.ok(retrospectService.getRetrospectDetails(id));
    }

    /** 文件上传花絮 */
    @PostMapping("/{id}/retrospect/gallery/upload")
    public Result<GalleryItemResponse> uploadGalleryFile(@PathVariable Long id,
                                                          @RequestParam("file") MultipartFile file,
                                                          @AuthenticationPrincipal User currentUser) throws IOException {
        String url = fileService.upload(file, "gallery");
        return Result.ok("上传成功", retrospectService.addGallery(id, currentUser.getId(), url));
    }
}
