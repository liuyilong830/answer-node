const Router = require('@koa/router');
const Game = new Router({
  prefix: '/game'
})
const { resBody, responseFormat, format, tokenFailure } = require('../utils')

const {
  queryDanList,
  queryUserAboutRank,
  queryRankList,
} = require('../db/views/game');

Game.get('/danlist', async ctx => {
  let res = await queryDanList();
  return resBody(ctx, {
    message: '查询成功',
    data: res,
  })
})

Game.get('/user/rank', async ctx => {
  if (!tokenFailure(ctx.token, ctx)) return;
  let { uid } = ctx.info;
  let [res] = await queryUserAboutRank(uid);
  return resBody(ctx, {
    message: '查询成功',
    data: responseFormat(res),
  })
})

Game.get('/ranklist/top3', async ctx => {
  let res = await queryRankList(0, 3);
  return resBody(ctx, {
    data: responseFormat(res),
  })
})

Game.get('/ranklist/all', async ctx => {
  let { start, limit } = format(ctx.query);
  let res = await queryRankList(start, limit);
  return resBody(ctx, {
    data: responseFormat(res),
  })
})

module.exports = Game;
