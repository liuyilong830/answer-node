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
  queryMyRewards,
  receiveIntegral,
  queryAllFills,
  queryAllMultis,
  queryAllSingles,
  insertSingleTimu,
  insertMultiTimu,
  insertFillTimu,
  queryOptionalGame,
  insertCollectGame,
  insertGame,
  queryAuditGame,
  queryRankReward,
  queryMyRewardByRankid,
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

function registerTimeJob(games = []) {
  games.forEach(item => {
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
          })
        })
      })
    });
    gameAndJobMap.set(rankid, job);
  })
}

Game.get('/appointment', async ctx => {
  if (!tokenFailure(ctx.token, ctx)) return;
  let { start, limit } = format(ctx.query);
  let { uid } = ctx.info;
  let res = await queryAppointmentGame(uid, start, limit);
  /* 暂时在这处理，今后需要移植到新增 game的接口中在新增成功之后就进行注册定时任务 */
  registerTimeJob(res);
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

Game.get('/myrewards', async ctx => {
  if (!tokenFailure(ctx.token, ctx)) return;
  let { uid } = ctx.info;
  let res = await queryMyRewards(uid);
  return resBody(ctx, {
    message: '查询成功',
    data: res,
  })
})

Game.post('/receive/integral', async ctx => {
  if (!tokenFailure(ctx.token, ctx)) return;
  let { id, num = 0 } = format(ctx.request.body);
  let { uid } = ctx.info;
  await updateUserAboutGame(uid, {
    all_integral: num,
    curr_integral: num,
  })
  let res = await receiveIntegral(id, uid);
  return resBody(ctx, {
    message: '成功',
    data: res,
  })
})

Game.get('/typetimu', async ctx => {
  let { type, start, limit } = format(ctx.query);
  let res = [];
  if (type === 'singles') {
    res = await queryAllSingles(start, limit);
    res = res.map(temp => {
      temp.options = temp.options.split('&&');
      temp.res = temp.res.split('&&');
      return temp;
    })
  } else if (type === 'multis') {
    res = await queryAllMultis(start, limit);
    res = res.map(temp => {
      temp.options = temp.options.split('&&');
      temp.res = temp.res.split('&&');
      return temp;
    })
  } else if (type === 'fills') {
    res = await queryAllFills(start, limit);
    res = res.map(temp => {
      temp.res_json = JSON.parse(temp.res_json);
      return temp;
    })
  }
  return resBody(ctx, {
    message: '成功',
    data: responseFormat(res),
  })
})

Game.put('/insert/typetimu', async ctx => {
  if (!tokenFailure(ctx.token, ctx)) return;
  let { type, timu } = format(ctx.request.body);
  let { uid } = ctx.info;
  let res = {};
  if (type === 'single') {
    timu.res = timu.res.join('&&');
    timu.options = timu.options.join('&&');
    res = await insertSingleTimu(uid, timu);
  } else if (type === 'multi') {
    timu.res = timu.res.join('&&');
    timu.options = timu.options.join('&&');
    res = await insertMultiTimu(uid, timu);
  } else if (type === 'fill') {
    timu.res_json = JSON.stringify(timu.res_json);
    res = await insertFillTimu(uid, timu);
  }
  return resBody(ctx, {
    message: '成功',
    data: res,
  })
})

Game.get('/optional', async ctx => {
  if (!tokenFailure(ctx.token, ctx)) return;
  let { uid } = ctx.info;
  let res = responseFormat(await queryOptionalGame(uid));
  return resBody(ctx, {
    message: '成功',
    data: res,
  })
})

Game.put('/collect/gameandtimu', async ctx => {
  if (!tokenFailure(ctx.token, ctx)) return;
  let { rankid, id, type } = format(ctx.request.body);
  if (!rankid || !id || !type) {
    return resBody(ctx, {
      message: 'rankid、id、type都是必选参数',
      status: 403
    })
  }
  let res = await insertCollectGame(rankid, id, type);
  return resBody(ctx, {
    message: '成功',
    data: res,
  })
})

Game.put('/insert', async ctx => {
  if (!tokenFailure(ctx.token, ctx)) return;
  let body = format(ctx.request.body);
  let { uid } = ctx.info;
  let res = await insertGame(uid, body);
  let arr = await queryGameByRankid(res.insertId);
  // 添加好挑战赛之后，就需要给挑战赛绑定定时任务
  registerTimeJob(arr);
  return resBody(ctx, {
    message: '操作成功',
    data: res,
  })
})

Game.get('/audit', async ctx => {
  let { start = 0, limit = 10 } = format(ctx.query);
  let res = responseFormat(await queryAuditGame(start, limit));
  return resBody(ctx, {
    message: '成功',
    data: res,
  })
})

Game.get('/id', async ctx => {
  let { rankid } = format(ctx.query);
  if (!rankid) {
    return resBody(ctx, {
      message: 'rankid是必须的',
      status: 403,
    })
  }
  let [res] = (await queryGameByRankid(rankid)).map(item => {
    item.rewards = item.rewards.split('&&').map(num => Number(num));
    return item;
  });

  return resBody(ctx, {
    message: '成功',
    data: responseFormat(res),
  })
})

Game.get('/rank/reward', async ctx => {
  let { rankid } = format(ctx.query);
  if (!rankid) {
    return resBody(ctx, {
      message: 'rankid是必须的',
      status: 403,
    })
  }
  let res = await queryRankReward(rankid);
  let arr = res.map(item => {
    let { uid } = item;
    return queryMyRewardByRankid(rankid, uid);
  })
  ;(await Promise.all(arr)).forEach((item, i) => {
    res[i].isreceive = item.length ? true : false;
  })

  return resBody(ctx, {
    message: '成功',
    data: responseFormat(res, ['isreceive']),
  })
})

Game.put('/sendReward', async ctx => {
  if (!tokenFailure(ctx.token, ctx)) return;
  let { name,integral,reward_uid,description, gameid } = format(ctx.request.body);
  if (!name || !integral || !reward_uid || !description || !gameid) {
    return resBody(ctx, {
      message: '请确保参数都传入正确',
      status: 403,
    })
  }
  let { uid: issue_uid } = ctx.info;
  let res = await insertReward({
    issue_uid,name,integral,reward_uid,description,gameid
  });
  return resBody(ctx, {
    message: '成功',
    data: res,
  })
})

module.exports = Game;
