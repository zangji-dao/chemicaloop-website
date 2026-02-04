package com.chemicaloop.admin;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * Admin后端主启动类
 */
@SpringBootApplication
@MapperScan("com.chemicaloop.admin.mapper")
public class AdminBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(AdminBackendApplication.class, args);
        System.out.println("========================================");
        System.out.println("Admin Backend 启动成功！");
        System.out.println("访问地址: http://localhost:8080/api");
        System.out.println("========================================");
    }

    /**
     * 密码加密器
     */
    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
