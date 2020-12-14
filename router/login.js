const Router = require('@koa/router');
const login = new Router({
  prefix: '/login'
});
const jwt = require('jsonwebtoken');

const { secret, responseFormat, format, identityInfo, resBody } = require('../utils');
const {
  isExistPhone,
  toLogin,
  toRegister,
} = require('../db/views/login');
let token = '';

login.post('/byphone', async (ctx) => {
  ctx.response.type = 'json';
  let { phone, password } = format(ctx.request.body);
  let res = await toLogin(phone, password);
  if (!res.length) {
    return resBody(ctx, {
      status: 403,
      message: '账号或密码错误',
    })
  }
  res = responseFormat(res[0])
  delete res.password;
  // 生成 token，返回用户的个人信息, token 维持一天（86400s）
  let user = identityInfo(res);
  token = jwt.sign({
    exp: Math.floor(Date.now() / 1000) + 86400,
    info: user
  }, secret)
  return resBody(ctx, {
    message: '登录成功',
    data: { ...res, token }
  })
})

login.get('/exist/phone', async (ctx) => {
  let { phone } = format(ctx.query);
  let res = await isExistPhone(phone);
  if (!res.length) {
    return resBody(ctx, {
      exist: false,
      message: '该手机号尚未注册过',
    })
  }
  let { rid } = res[0];
  return resBody(ctx, {
    exist: true,
    message: '该手机号已经存在',
    data: {
      phone,
      root: rid
    }
  })
})

login.post('/toregister', async (ctx) => {
  ctx.response.type = 'json';
  let body = format(ctx.request.body);
  await toRegister(body);
  let { phone, password } = body;
  let res = await toLogin(phone, password);
  res = responseFormat(res[0])
  delete res.password;
  let user = identityInfo(res);
  // 生成 token，返回用户的个人信息, token 维持一天（86400s）
  token = jwt.sign({
    exp: Math.floor(Date.now() / 1000) + 86400,
    info: user
  }, secret);

  if (res.length) {
    return resBody(ctx, {
      message: '注册成功',
      data: { ...res[0], token, birthday: new Date(res[0].birthday).getTime() }
    })
  }
})

module.exports = login;