const Router = require('@koa/router');
const moment = require('moment');
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
  insertChallengeRecord,
  deleteChallengeRecord,
  queryDoingGames,
  updateChallengeRecord,
  isDoingGame,
  queryGameById,
  queryChallengeRecordById,
  queryCollectTimuByRid,
  querySinglesById,
  queryMultisById,
  queryFillsById,
  updateGameInfo,
  updateUserAboutGame,
  queryAppoinmentUserById,
  queryGameByRankid,
  insertReward,
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

let gameAndJobMap = new Map();

Game.get('/appointment', async ctx => {
  if (!tokenFailure(ctx.token, ctx)) return;
  let { start, limit } = format(ctx.query);
  let { uid } = ctx.info;
  let res = await queryAppointmentGame(uid, start, limit);
  /* 暂时在这处理，今后需要移植到新增 game的接口中在新增成功之后就进行注册定时任务 */
  res.forEach(item => {
    let { latetime, endtime, starttime, prompttime, rankid, rname } = item;
    if (gameAndJobMap.has(rankid)) return;
    if (Date.now() - new Date(starttime).getTime() > 0) return;
    let job = new schedule.scheduleJob(new Date(starttime), () => {
      console.log(`${rankid}到达了开始时间`);
      updateGameInfo(rankid, { status: 1 });
      job = new schedule.scheduleJob(new Date(latetime), () => {
        console.log(`${rankid}到达了迟到禁止入场时间`);
        updateGameInfo(rankid, { status: 3 });
        job = new schedule.scheduleJob(new Date(prompttime), () => {
          console.log(`${rankid}到达了通知挑战赛还剩多少分钟`);
          // 发送通知
          job = new schedule.scheduleJob(new Date(endtime), () => {
            console.log(`${rankid}到达了结束时间`);
            updateGameInfo(rankid, { status: 4 });
            job = new schedule.scheduleJob(new Date(Date.now() + 10000), async () => {
              console.log(`${rankid}发放奖励时间`);
              let [game] = await queryGameByRankid(rankid);
              let { winning_count, rewards, creater } = game;
              rewards = rewards.split('&&');
              let queue = await queryAppoinmentUserById(rankid);
              let i = 0;
              while (i < winning_count && queue.length) {
                let { chuserid } = queue.shift();
                let obj = {
                  issue_uid: creater,
                  name: `${rname}排名奖励`,
                  integral: parseInt(rewards[i]),
                  reward_uid: chuserid,
                  description: '希望再接再厉',
                  createtime: moment(Date.now()).format('YYYY-MM-DD HH:mm:ss'),
                }
                await insertReward(obj);
                i++;
              }
              updateGameInfo(rankid, { status: 5 });
              job.cancel();
              gameAndJobMap.delete(rankid);
            })
          })
        })
      })
    });
    gameAndJobMap.set(rankid, job);
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
    let res = await updateGameInfo(rankid, { reservation_num: num })
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
  let body = format(ctx.request.body, ['finishtime']);
  let { challengeid } = body;
  if (!challengeid) {
    return resBody(ctx, {
      status: 403,
      message: 'challengeid是必须的'
    })
  }
  if (body.finishtime) {
    body.finishtime = moment(parseInt(body.finishtime)).format('YYYY-MM-DD HH:mm:ss')
  }
  let { uid } = ctx.info;
  let res = null;
  if (Object.keys(body).length > 1) {
    res = await updateChallengeRecord(uid, challengeid, body);
  }
  return resBody(ctx, {
    message: '操作成功',
    data: res,
  })
})

Game.get('/isdoing', async ctx => {
  if (!tokenFailure(ctx.token, ctx)) return;
  let { challengeid } = format(ctx.query);
  if (!challengeid) {
    return resBody(ctx, {
      message: 'challengeid是必须的',
      status: 403,
    })
  }
  let { uid } = ctx.info;
  let [res] = await isDoingGame(uid, challengeid);
  return resBody(ctx, {
    message: '查询成功',
    data: !!res,
  })
})

Game.get('/byid', async ctx => {
  if (!tokenFailure(ctx.token, ctx)) return;
  let { rankid } = format(ctx.query);
  if (!rankid) {
    return resBody(ctx, {
      message: 'rankid是必须的',
      status: 403,
    })
  }
  let { uid } = ctx.info;
  let res = responseFormat(await queryGameById(rankid, uid));
  return resBody(ctx, {
    message: '查询成功',
    data: res,
  })
})

Game.patch('/set/visible_count', async ctx => {
  if (!tokenFailure(ctx.token, ctx)) return;
  let { challengeid } = format(ctx.request.body);
  let { uid } = ctx.info;
  let [res] = await queryChallengeRecordById(challengeid);
  let { visible_count, allow_visible_count } = res;
  if (visible_count >= allow_visible_count) {
    // 已经超过允许的跳出次数，该判定为舞弊
    return resBody(ctx, {
      message: '超出限制次数，作为舞弊处理',
      data: {
        count: -1
      }
    });
  } else {
    await updateChallengeRecord(uid, challengeid, {visible_count: 1});
    return resBody(ctx, {
      message: '操作成功',
      data: {
        count: allow_visible_count - visible_count - 1,
      }
    });
  }
})

Game.get('/timulist', async ctx => {
  let { rankid } = format(ctx.query);
  let arr = await queryCollectTimuByRid(rankid);
  let timus = {
    singles: [],
    multis: [],
    fills: [],
  };
  for (let i = 0; i < arr.length; i++) {
    let temp;
    let res;
    if (arr[i].s_id) {
      temp = responseFormat((await querySinglesById(arr[i].s_id))[0]);
      temp.options = temp.options.split('&&');
      temp.res = temp.res.split('&&');
      res = timus.singles;
    } else if (arr[i].m_id) {
      temp = responseFormat((await queryMultisById(arr[i].m_id))[0]);
      temp.options = temp.options.split('&&');
      temp.res = temp.res.split('&&');
      res = timus.multis;
    } else if (arr[i].f_id) {
      temp = responseFormat((await queryFillsById(arr[i].f_id))[0]);
      temp.res_json = JSON.parse(temp.res_json);
      res = timus.fills;
    }
    res.push(temp);
  }
  return resBody(ctx, {
    message: '查询成功',
    data: timus,
  })
})

Game.post('/isright/timu', async ctx => {
  if (!tokenFailure(ctx.token, ctx)) return;
  let { tag, id, result } = format(ctx.request.body);
  if (!['single', 'multi', 'fill'].includes(tag)) {
    return resBody(ctx, {
      message: '标志必须为single、multi、fill这三种中的一个',
      status: 403,
    })
  }
  let flag = false;
  if (tag === 'single') {
    let [timu] = await querySinglesById(id);
    flag = timu.res === result[0];
  } else if (tag === 'multi') {
    let [timu] = await queryMultisById(id);
    let res = timu.res.split('&&');
    flag = result.every(item => res.includes(item));
  } else if (tag === 'fill') {
    let [timu] = await queryFillsById(id);
    let obj = JSON.parse(timu.res_json);
    let keys = Object.keys(obj);
    flag = result.map((item,i) => {
      return obj[keys[i]].includes(item);
    })
  }
  return resBody(ctx, {
    message: '查询成功',
    data: flag,
  })
})

Game.patch('/user/aboutgame', async ctx => {
  if (!tokenFailure(ctx.token, ctx)) return;
  let info = format(ctx.request.body);
  let { uid } = ctx.info;
  let res = await updateUserAboutGame(uid, info);
  return resBody(ctx, {
    message: '操作成功',
    data: res,
  })
})

module.exports = Game;
