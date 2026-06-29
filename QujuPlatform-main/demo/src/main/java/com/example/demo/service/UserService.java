package com.example.demo.service;

import com.example.demo.dto.UpdateUserRequest;
import com.example.demo.dto.UserProfileResponse;
import com.example.demo.entity.User;
import com.example.demo.exception.BusinessException;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public UserProfileResponse getProfile(User currentUser) {
        return toResponse(currentUser);
    }

    public UserProfileResponse updateProfile(User currentUser, UpdateUserRequest req) {
        if (req.getNickname() != null && !req.getNickname().equals(currentUser.getNickname())) {
            if (userRepository.existsByNickname(req.getNickname())) {
                throw new BusinessException("该昵称已被使用");
            }
            currentUser.setNickname(req.getNickname());
        }
        if (req.getPhone() != null) currentUser.setPhone(req.getPhone());
        if (req.getAvatar() != null) currentUser.setAvatar(req.getAvatar());
        if (req.getBio() != null) currentUser.setBio(req.getBio());
        if (req.getGender() != null) currentUser.setGender(req.getGender());
        if (req.getBirthday() != null) currentUser.setBirthday(req.getBirthday());
        if (req.getTags() != null) currentUser.setTags(req.getTags());
        if (req.getAddress() != null) currentUser.setAddress(req.getAddress());
        if (req.getBusinessLicense() != null) currentUser.setBusinessLicense(req.getBusinessLicense());
        if (req.getBusinessFields() != null) currentUser.setBusinessFields(req.getBusinessFields());

        return toResponse(userRepository.save(currentUser));
    }

    private UserProfileResponse toResponse(User u) {
        return UserProfileResponse.builder()
                .id(u.getId()).email(u.getEmail()).nickname(u.getNickname())
                .phone(u.getPhone()).avatar(u.getAvatar()).bio(u.getBio())
                .gender(u.getGender()).birthday(u.getBirthday()).tags(u.getTags())
                .role(u.getRole().name().toLowerCase()).status(u.getStatus().name().toLowerCase())
                .businessLicense(u.getBusinessLicense()).address(u.getAddress())
                .businessFields(u.getBusinessFields())
                .createdAt(u.getCreatedAt() != null ? u.getCreatedAt().toString() : null)
                .build();
    }
}
