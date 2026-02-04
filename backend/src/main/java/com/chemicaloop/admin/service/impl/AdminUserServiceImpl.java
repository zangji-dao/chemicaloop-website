package com.chemicaloop.admin.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.chemicaloop.admin.entity.AdminUser;
import com.chemicaloop.admin.mapper.AdminUserMapper;
import com.chemicaloop.admin.service.AdminUserService;
import com.chemicaloop.admin.utils.JwtUtil;
import com.chemicaloop.admin.vo.LoginRequest;
import com.chemicaloop.admin.vo.LoginResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * 管理员用户Service实现类
 */
@Service
public class AdminUserServiceImpl extends ServiceImpl<AdminUserMapper, AdminUser> implements AdminUserService {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @Override
    public LoginResponse login(LoginRequest loginRequest) {
        // 根据用户名查询用户
        AdminUser adminUser = getByUsername(loginRequest.getUsername());

        // 用户不存在
        if (adminUser == null) {
            throw new RuntimeException("用户名或密码错误");
        }

        // 验证密码
        if (!passwordEncoder.matches(loginRequest.getPassword(), adminUser.getPassword())) {
            throw new RuntimeException("用户名或密码错误");
        }

        // 检查用户状态
        if (adminUser.getStatus() == 0) {
            throw new RuntimeException("账户已被禁用，请联系管理员");
        }

        // 生成Token
        String token = jwtUtil.generateToken(adminUser.getId(), adminUser.getUsername());

        // 更新最后登录时间和IP
        adminUser.setLastLoginTime(LocalDateTime.now());
        updateById(adminUser);

        // 返回登录响应
        return new LoginResponse(token, adminUser.getId(), adminUser.getUsername(), adminUser.getRealName());
    }

    @Override
    public AdminUser getByUsername(String username) {
        LambdaQueryWrapper<AdminUser> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(AdminUser::getUsername, username);
        return getOne(queryWrapper);
    }

    @Override
    public Boolean validateToken(String token) {
        try {
            return jwtUtil.validateToken(token);
        } catch (Exception e) {
            return false;
        }
    }
}
