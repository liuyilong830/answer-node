const Router = require('@koa/router');
const { tokenFailure, responseFormat, resBody } = require('../utils');
const home = new Router();

const {
  questionsList,
} = require('../db/views/home');
const {
  getUser,
} = require('../db/views/profile');

home.get('/islogin', async (ctx) => {
  if (!tokenFailure(ctx.token, ctx)) return;
  let { uid } = ctx.info;
  let [res] = await getUser(uid);
  res = responseFormat(res);
  delete res.password;
  return resBody(ctx, {
    message: '已经登录过了',
    data: {...res, token: ctx.token }
  })
})

/**
 * 获取所有被公开的题库（ishidden属性为 false）
 * 权限： 不需要登录
 */
home.get('/questions/list', async (ctx) => {
  ctx.response.type = 'json';
  const { limit, start } = responseFormat(ctx.query);
  let res = await questionsList(limit, start);
  res = responseFormat(res);
  return resBody(ctx, {
    message: '查询成功',
    data: {
      count: res.length,
      list: res
    }
  })
})

module.exports = home;
