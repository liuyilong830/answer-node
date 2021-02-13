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
  queryAppointmentOtherGames,
  queryAllGames,
  updateGameAppointment,
  insertChallengeRecord,
  deleteChallengeRecord,
  queryDoingGames,
  updateChallengeRecord,
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
      data: responseFormat(cacheRankList.filter((item, i) => i < 3)),
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
      data: responseFormat(cacheRankList),
    })
  }
  let { start, limit } = format(ctx.query);
  cacheRankList = await queryRankList(start, limit);
  return resBody(ctx, {
    data: responseFormat(cacheRankList),
  })
})

let gameAndJobMap = {};
Game.get('/appointment', async ctx => {
  if (!tokenFailure(ctx.token, ctx)) return;
  let { start, limit } = format(ctx.query);
  let { uid } = ctx.info;
  let res = await queryAppointmentGame(uid, start, limit);
  res.forEach(item => {
    let { latetime, endtime, starttime, prompttime, challengeid } = item;
    if (gameAndJobMap[challengeid]) return;
    if (Date.now() - new Date(starttime).getTime() > 0) return;
    let job = new schedule.scheduleJob(new Date(starttime), () => {
      updateChallengeRecord(uid, challengeid, { status: 1 });
      job = new schedule.scheduleJob(new Date(latetime), () => {
        updateChallengeRecord(uid, challengeid, { status: 3 });
        job = new schedule.scheduleJob(new Date(prompttime), () => {
          // 发送通知
          job = new schedule.scheduleJob(new Date(endtime), () => {
            updateChallengeRecord(uid, challengeid, { status: 4 });
            job.cancel();
            delete gameAndJobMap[challengeid];
          })
        })
      })
    });
    gameAndJobMap[challengeid] = job;
  })
  return resBody(ctx, {
    message: '查询成功',
    data: res,
  })
})

Game.get('/all/list', async ctx => {
  let { start, limit } = format(ctx.query);
  let res = [];
  if (!tokenFailure(ctx.token, ctx)) {
    // 未登录，则获取所有的挑战赛
    res = await queryAllGames(start, limit);
  } else {
    let { uid } = ctx.info;
    res = await queryAppointmentOtherGames(uid, start, limit);
  }
  return resBody(ctx, {
    message: '查询成功',
    data: responseFormat(res),
  })
})

Game.patch('/set/appointment', async ctx => {
  if (!tokenFailure(ctx.token, ctx)) return;
  let { num, rankid } = format(ctx.request.body);
  let { uid } = ctx.info;
  if (!rankid) {
    return resBody(ctx, {
      message: 'rankid是必须的',
      status: 401,
    })
  }
  let info = {};
  if (num === 1) {
    info = await insertChallengeRecord(rankid, uid);
  } else if (num === -1) {
    info = await deleteChallengeRecord(rankid, uid);
  }
  let { fieldCount } = info;
  if (fieldCount === 0) {
    let res = await updateGameAppointment(rankid, num);
    return resBody(ctx, {
      message: '操作成功',
      data: res,
    })
  } else {
    await num === 1 ? deleteChallengeRecord(rankid, uid) : insertChallengeRecord(rankid, uid);
    return resBody(ctx, {
      message: '服务器出现了一点小问题',
      status: 401
    })
  }
})

Game.get('/doinglist', async ctx => {
  if (!tokenFailure(ctx.token, ctx)) return;
  let { uid } = ctx.info;
  let res = await queryDoingGames(uid);
  return resBody(ctx, {
    message: '查询成功',
    data: res,
  })
})

Game.patch('/set/challenge_record', async ctx => {
  if (!tokenFailure(ctx.token, ctx)) return;
  let body = format(ctx.request.body);
  let { challengeid } = body;
  if (!challengeid) {
    return resBody(ctx, {
      status: 403,
      message: 'challengeid是必须的'
    })
  }
  let { uid } = ctx.info;
  let res = null;
  if (Object.keys(body).length > 1) {
    // res = await updateChallengeRecord(uid, challengeid, body);
  }
  return resBody(ctx, {
    message: '操作成功',
    data: res,
  })
})

module.exports = Game;
