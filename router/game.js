const Router = require('@koa/router');
const schedule = require('node-schedule');
const Game = new Router({
  prefix: '/game'
})
const { resBody, responseFormat, format, tokenFailure } = require('../utils')

const {
  queryDanList,
  queryUserAboutRank,
  queryRankList,
  queryRankListAll,
  queryAppointmentGame,
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

let cacheRankList = null;
let job = null;
function scheduleTask() {
  if (!cacheRankList && !job) {
    job = new schedule.scheduleJob({ hour: 8, minute: 0, second: 0 }, async function () {
      cacheRankList = responseFormat(await queryRankListAll());
    })
  }
}
scheduleTask();

Game.get('/ranklist/top3', async ctx => {
  if (Array.isArray(cacheRankList)) {
    return resBody(ctx, {
      message: '从缓存中读取',
      data: cacheRankList.filter((item, i) => i < 3),
    })
  }
  cacheRankList = await queryRankListAll();
  return resBody(ctx, {
    data: responseFormat(cacheRankList.filter((item, i) => i < 3)),
  })
})

Game.get('/ranklist/all', async ctx => {
  if (Array.isArray(cacheRankList)) {
    return resBody(ctx, {
      message: '从缓存中读取',
      data: cacheRankList,
    })
  }
  let { start, limit } = format(ctx.query);
  cacheRankList = await queryRankList(start, limit);
  return resBody(ctx, {
    data: responseFormat(cacheRankList),
  })
})

Game.get('/appointment', async ctx => {
  if (!tokenFailure(ctx.token, ctx)) return;
  let { start, limit } = format(ctx.query);
  let { uid } = ctx.info;
  let res = await queryAppointmentGame(uid, start, limit);
  return resBody(ctx, {
    message: '查询成功',
    data: res,
  })
})

module.exports = Game;
