package com.chemicaloop.admin.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.chemicaloop.admin.entity.AdminUser;
import com.chemicaloop.admin.vo.LoginRequest;
import com.chemicaloop.admin.vo.LoginResponse;

/**
 * 管理员用户Service接口
 */
public interface AdminUserService extends IService<AdminUser> {

    /**
     * 用户登录
     * @param loginRequest 登录请求
     * @return 登录响应
     */
    LoginResponse login(LoginRequest loginRequest);

    /**
     * 根据用户名查询用户
     * @param username 用户名
     * @return 用户信息
     */
    AdminUser getByUsername(String username);

    /**
     * 验证Token
     * @param token Token
     * @return 是否有效
     */
    Boolean validateToken(String token);
}
