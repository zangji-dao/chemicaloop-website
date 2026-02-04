package com.chemicaloop.admin.controller;

import com.chemicaloop.admin.service.AdminUserService;
import com.chemicaloop.admin.utils.Result;
import com.chemicaloop.admin.vo.LoginRequest;
import com.chemicaloop.admin.vo.LoginResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;

/**
 * 登录控制器
 */
@Slf4j
@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "*", maxAge = 3600)
public class LoginController {

    @Autowired
    private AdminUserService adminUserService;

    /**
     * 用户登录
     */
    @PostMapping("/login")
    public Result<LoginResponse> login(@Validated @RequestBody LoginRequest loginRequest) {
        log.info("用户登录请求: username={}", loginRequest.getUsername());

        try {
            LoginResponse loginResponse = adminUserService.login(loginRequest);
            return Result.success("登录成功", loginResponse);
        } catch (RuntimeException e) {
            log.error("登录失败: {}", e.getMessage());
            return Result.error(e.getMessage());
        }
    }

    /**
     * 验证Token
     */
    @GetMapping("/validate")
    public Result<Boolean> validateToken(HttpServletRequest request) {
        String token = request.getHeader("Authorization");

        if (token == null || token.isEmpty()) {
            return Result.paramError("Token不能为空");
        }

        // 去掉 "Bearer " 前缀
        if (token.startsWith("Bearer ")) {
            token = token.substring(7);
        }

        try {
            boolean isValid = adminUserService.validateToken(token);
            return Result.success(isValid);
        } catch (Exception e) {
            log.error("Token验证失败: {}", e.getMessage());
            return Result.error("Token无效");
        }
    }

    /**
     * 登出（前端删除Token即可，此接口仅用于记录日志）
     */
    @PostMapping("/logout")
    public Result<Void> logout(HttpServletRequest request) {
        String token = request.getHeader("Authorization");
        log.info("用户登出: token={}", token);
        return Result.success("登出成功");
    }
}
