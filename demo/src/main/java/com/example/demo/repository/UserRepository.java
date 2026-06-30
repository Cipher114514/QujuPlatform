package com.example.demo.repository;

import com.example.demo.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByNickname(String nickname);
    boolean existsByEmail(String email);
    boolean existsByNickname(String nickname);
    boolean existsByBusinessLicense(String businessLicense);

    /** 昵称模糊搜索（用于添加好友时查找用户） */
    List<User> findByNicknameContainingIgnoreCase(String keyword);

    // ---- 管理员查询 ----

    long countByStatus(User.UserStatus status);
    long countByRole(User.UserRole role);
    long countByRoleAndStatus(User.UserRole role, User.UserStatus status);

    @Query("SELECT u FROM User u WHERE " +
           "(:keyword IS NULL OR u.nickname LIKE %:keyword% OR u.email LIKE %:keyword%) " +
           "AND (:role IS NULL OR u.role = :role) " +
           "AND (:status IS NULL OR u.status = :status) " +
           "ORDER BY u.id ASC")
    Page<User> adminSearchUsers(@Param("keyword") String keyword,
                                 @Param("role") User.UserRole role,
                                 @Param("status") User.UserStatus status,
                                 Pageable pageable);
}
