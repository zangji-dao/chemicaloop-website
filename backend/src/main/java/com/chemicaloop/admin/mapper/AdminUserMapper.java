package com.chemicaloop.admin.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.chemicaloop.admin.entity.AdminUser;
import org.apache.ibatis.annotations.Mapper;

/**
 * 管理员用户Mapper接口
 */
@Mapper
public interface AdminUserMapper extends BaseMapper<AdminUser> {

}
