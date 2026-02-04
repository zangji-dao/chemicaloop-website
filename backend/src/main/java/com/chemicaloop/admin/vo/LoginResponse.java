package com.chemicaloop.admin.vo;

import lombok.Data;

import java.io.Serializable;

/**
 * 登录响应VO
 */
@Data
public class LoginResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * Token
     */
    private String token;

    /**
     * 用户ID
     */
    private Long userId;

    /**
     * 用户名
     */
    private String username;

    /**
     * 真实姓名
     */
    private String realName;

    public LoginResponse() {
    }

    public LoginResponse(String token, Long userId, String username, String realName) {
        this.token = token;
        this.userId = userId;
        this.username = username;
        this.realName = realName;
    }
}
