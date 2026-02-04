import request from '../utils/request'

/**
 * 用户登录
 * @param {Object} data - 登录数据 { username, password }
 * @returns {Promise}
 */
export function login(data) {
  return request({
    url: '/auth/login',
    method: 'post',
    data
  })
}

/**
 * 验证 Token
 * @returns {Promise}
 */
export function validateToken() {
  return request({
    url: '/auth/validate',
    method: 'get'
  })
}

/**
 * 登出
 * @returns {Promise}
 */
export function logout() {
  return request({
    url: '/auth/logout',
    method: 'post'
  })
}
