const Router = require('@koa/router');
const moment = require('moment');
const questions = new Router({
  prefix: '/questions'
});
const { format, resBody, responseFormat, tokenFailure } = require('../utils');
const {
  createQuestionBank,
  insertQuesofCls,
  queryQuestionById,
  insertTimu,
  queryQuestionByUid,
  querySingles,
  queryMultis,
  queryShortAnswers,
  queryAboutUser,
  updateTimu,
  deleteTimu,
  queryTimus,
  queryTimuOperation,
  insertTimuOperations,
  updateTimuQoreations,
  queryQuestOpt,
  insertQuestOpt,
  updateQuestOpt,
  queryFinishedQuestUser,
  insertWrongTimus,
  queryMyWrongTimus,
  deleteMyWrongTimus,
  queryMyWrongTimuByTid,
  setQuestion,
  queryCollection,
  queryCollectTimuByQid,
  queryCurrMyGrade,
  queryCurrGradeTop10,
  queryCurrRankNum,
} = require('../db/views/questions');
const {
  querySinglesById,
  queryMultisById,
  queryFillsById,
} = require('../db/views/game')

const BaseUserAbout = function(userid, quid) {
  this.userid = userid;
  this.quid = quid;
  this.iszan = 0;
  this.iswork = 0;
  this.iscollection = 0;
}

questions.get('/qid', async ctx => {
  let { qid } = format(ctx.query);
  if (!qid) {
    return resBody(ctx, {
      status: 401,
      message: 'qid是必选参数'
    })
  }
  let [res] = responseFormat(await queryQuestionById(qid));
  return resBody(ctx, {
    message: '查询成功',
    data: res || {},
  })
})

questions.get('/list/uid', async (ctx) => {
  if (!tokenFailure(ctx.token, ctx)) return;
  let { limit, start } = format(ctx.query);
  let { uid } = ctx.info;
  let res = await queryQuestionByUid(uid, start, limit);
  return resBody(ctx, {
    message: '查询成功',
    data: {
      list: responseFormat(res)
    }
  })
})

questions.put('/create', async (ctx) => {
  if (!tokenFailure(ctx.token, ctx)) return;
  let { uid, rid } = ctx.info;
  let body = format(ctx.request.body, ['icon', 'createtime']);
  body.createtime = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
  if (rid === 1) {
    body.istoclass = 0;
  }
  if (body.istoclass === 1) {
    body.cls = body.cls.map(item => parseInt(item));
  }
  let res = await createQuestionBank(uid, body);
  let { insertId } = res;
  if (body.cls.length) {
    await insertQuesofCls(insertId, body.cls);
  }
  return resBody(ctx, {
    message: '创建成功',
    data: {
      qid: insertId
    }
  })
})

questions.put('/create/timu', async (ctx) => {
  if (!tokenFailure(ctx.token, ctx)) return;
  let {quesid: qid, list } = format(ctx.request.body);
  if (!list.length) {
    return resBody(ctx, {
      message: '列表为空，不需要创建题目',
    })
  }
  let [res] = await queryQuestionById(qid);
  if (!res) {
    return resBody(ctx, {
      status: 403,
      message: '该题库不存在'
    })
  }
  res = await insertTimu(qid, list);
  console.log(res);
  return resBody(ctx, {
    message: '题目创建完成',
    data: res
  })
})

questions.get('/timus', async (ctx) => {
  let { qid, start = 0, limit = 10 } = format(ctx.query);
  if (!qid) {
    return resBody(ctx, {
      status: 403,
      message: 'qid是必选参数'
    });
  }
  let [singles, multis, shortanswers] = await Promise.all([
    querySingles(qid, start, limit),
    queryMultis(qid, start, limit),
    queryShortAnswers(qid, start, limit)
  ]);
  singles.forEach(tm => {
    tm.res = tm.res.split('&&');
    tm.options = tm.options.split('&&');
  })
  multis.forEach(tm => {
    tm.res = tm.res.split('&&');
    tm.options = tm.options.split('&&');
  })
  shortanswers.forEach(tm => {
    tm.options = [];
    tm.res = [tm.res];
  })
  return resBody(ctx, {
    message: '查询成功',
    data: {
      singles: responseFormat(singles),
      multis: responseFormat(multis),
      shortanswers: responseFormat(shortanswers)
    }
  })
})

questions.get('/aboutuser', async ctx => {
  if (!tokenFailure(ctx.token, ctx)) return;
  let { uid } = format(ctx.info);
  let { qid } = format(ctx.query);
  if (!qid || !uid) {
    return resBody(ctx, {
      status: 403,
      message: 'qid和uid是必选参数'
    });
  }
  let res = await queryAboutUser(qid, uid);
  if (!res.length) {
    res.push(new BaseUserAbout(uid, qid));
  }
  return resBody(ctx, {
    message: '查询成功',
    data: res[0]
  });
})

questions.get('/timus/singles', async ctx => {
  let { qid, start, limit } = format(ctx.query);
  if (!qid) {
    return resBody(ctx, {
      status: 403,
      message: 'qid是必选参数'
    });
  }
  let singles = responseFormat(await querySingles(qid, start, limit));
  singles.forEach(tm => {
    tm.res = tm.res.split('&&');
    tm.options = tm.options.split('&&');
  });
  return resBody(ctx, {
    message: '查询成功',
    data: {
      singles,
    }
  })
})

questions.get('/timus/multis', async ctx => {
  let { qid, start, limit } = format(ctx.query);
  if (!qid) {
    return resBody(ctx, {
      status: 403,
      message: 'qid是必选参数'
    });
  }
  let multis = responseFormat(await queryMultis(qid, start, limit));
  multis.forEach(tm => {
    tm.res = tm.res.split('&&');
    tm.options = tm.options.split('&&');
  });
  return resBody(ctx, {
    message: '查询成功',
    data: {
      multis,
    }
  })
})

questions.get('/timus/shortanswers', async ctx => {
  let { qid, start, limit } = format(ctx.query);
  if (!qid) {
    return resBody(ctx, {
      status: 403,
      message: 'qid是必选参数'
    });
  }
  let shortanswers = responseFormat(await queryShortAnswers(qid, start, limit));
  shortanswers.forEach(tm => {
    tm.options = [];
    tm.res = [tm.res];
  });
  return resBody(ctx, {
    message: '查询成功',
    data: {
      shortanswers,
    }
  })
})

questions.patch('/timus/update', async ctx => {
  let body = format(ctx.request.body);
  let res = await updateTimu(body);
  console.log(res);
  return resBody(ctx, {
    message: '更新完成',
    data: res,
  })
})

questions.delete('/timus/delete', async ctx => {
  if (!tokenFailure(ctx.token, ctx)) return;
  let { tid, quesid } = format(ctx.query);
  console.log(tid, quesid);
  if (!tid || !quesid) {
    return resBody(ctx, {
      message: 'tid和quesid都是必选参数'
    })
  }
  let res = await deleteTimu(tid, quesid);
  return resBody(ctx, {
    message: '删除成功',
    data: res,
  })
})

questions.get('/timus/all', async ctx => {
  if (!tokenFailure(ctx.token, ctx)) return;
  let { quesid } = format(ctx.query);
  if (!quesid) {
    return resBody(ctx, {
      message: 'quesid是必选参数'
    })
  }
  let arr = await queryCollectTimuByQid(quesid);
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

questions.get('/timu/operations', async ctx => {
  if (!tokenFailure(ctx.token, ctx)) return;
  let { uid } = ctx.info;
  let { tid } = format(ctx.query);
  if (!uid || !tid) {
    return resBody(ctx, {
      status: 403,
      message: `${!uid ? 'uid' : 'tid'}是必选参数`
    });
  }
  let res = await queryTimuOperation(uid, tid);
  if (!res.length) {
    return resBody(ctx, {
      message: '该用户没有相关这个题目的操作'
    });
  }
  return resBody(ctx, {
    message: '查询成功',
    data: res[0]
  })
})

questions.post('/timu/set/operations', async ctx => {
  if (!tokenFailure(ctx.token, ctx)) return;
  let { uid } = ctx.info;
  let info = format(ctx.request.body);
  let { tid } = info;
  if (!uid || !tid) {
    return resBody(ctx, {
      status: 403,
      message: `${!uid ? 'uid' : 'tid'}是必选参数`
    });
  }
  let arr = await queryTimuOperation(uid, tid);
  let res = null;
  if (!arr.length) {
    // 创建一条数据
    res = await insertTimuOperations(uid, info);
  } else {
    // 更新一条数据
    res = await updateTimuQoreations(uid, info);
  }
  return resBody(ctx, {
    message: '设置成功',
    data: res,
  })
})

questions.get('/operations', async ctx => {
  if (!tokenFailure(ctx.token, ctx)) return;
  let { uid } = ctx.info;
  let { quesid } = format(ctx.query);
  if (!uid || !quesid) {
    return resBody(ctx, {
      status: 403,
      message: `${uid ? 'quesid' : 'uid'}是必选参数`
    });
  }
  let res = await queryQuestOpt(uid, quesid);
  if (!res.length) {
    return resBody(ctx, {
      message: '该用户没有相关这个题库的操作'
    });
  }
  return resBody(ctx, {
    message: '查询成功',
    data: res[0]
  })
})

questions.post('/set/operations', async ctx => {
  if (!tokenFailure(ctx.token, ctx)) return;
  let { uid } = ctx.info;
  let body = format(ctx.request.body);
  if (!uid || !body.quesid) {
    return resBody(ctx, {
      status: 403,
      message: `${uid ? 'quesid' : 'uid'}是必选参数`
    });
  }
  let arr = await queryQuestOpt(uid, body.quesid);
  let res = null;
  if (!arr.length) {
    await insertQuestOpt(uid, body.quesid);
  }
  res = await updateQuestOpt(uid, body);
  return resBody(ctx, {
    message: '更新成功',
    data: res
  });
})

questions.get('/ranklist/user', async ctx => {
  if (!tokenFailure(ctx.token, ctx)) return;
  let { quesid } = format(ctx.query);
  if (!quesid) {
    return resBody(ctx, {
      status: 403,
      message: 'quesid是必选参数'
    });
  }
  let res = await queryFinishedQuestUser(quesid);
  return resBody(ctx, {
    message: '查询成功',
    data: res
  });
})

questions.post('/wrongtimu/insert', async ctx => {
  if (!tokenFailure(ctx.token, ctx)) return;
  let { list } = format(ctx.request.body);
  let { uid } = ctx.info;
  let res = await insertWrongTimus(uid, list);
  return resBody(ctx, {
    message: '批量插入数据成功',
    data: res,
  })
})

questions.get('/wrongtimu', async ctx => {
  if (!tokenFailure(ctx.token, ctx)) return;
  let { uid } = ctx.info;
  let arr = await queryMyWrongTimus(uid);
  let res = [];
  let map = {};
  arr.forEach(tm => {
    let temp = null;
    if (map[tm.quesid] >= 0) {
      temp = res[map[tm.quesid]];
    } else {
      map[tm.quesid] = res.length;
      temp = [];
      res.push(temp);
    }
    tm.options = tm.options.split('&&');
    tm.suc_res = tm.suc_res.split('&&');
    tm.fail_res = tm.fail_res.split('&&');
    temp.push(tm);
  })
  return resBody(ctx, {
    message: '查询成功',
    data: responseFormat(res),
  })
})

questions.delete('/wrongtimu/del', async ctx => {
  if (!tokenFailure(ctx.token, ctx)) return;
  let { tid } = format(ctx.query);
  if (!tid) {
    return resBody(ctx, {
      status: 401,
      message: 'tid是必须的参数'
    })
  }
  let { uid } = ctx.info;
  let [tm] = await queryMyWrongTimuByTid(uid, tid);
  if (!tm) {
    return resBody(ctx, {
      message: '删除成功',
    })
  }
  await deleteMyWrongTimus(uid, tid);
  return resBody(ctx, {
    message: '删除成功',
  })
})

questions.patch('/update', async ctx => {
  if (!tokenFailure(ctx.token, ctx)) return;
  let { qid, info } = format(ctx.request.body);
  if (!qid) {
    return resBody(ctx, {
      status: 401,
      message: 'qid是必须的参数'
    });
  }
  let res = {};
  if (info) {
    res = await setQuestion(qid, info);
  }
  return resBody(ctx, {
    message: '更新成功',
    data: res,
  })
})

questions.get('/collections', async ctx => {
  if (!tokenFailure(ctx.token, ctx)) return;
  let { istimu } = ctx.query;
  let { uid } = ctx.info;
  let res;
  if (istimu === 'true') {
    res = await queryCollection(uid, true);
    res = res.map(item => {
      item.options = item.options.split('&&');
      item.res = item.res.split('&&');
      return responseFormat(item);
    })
  } else {
    res = responseFormat(await queryCollection(uid, false))
  }
  return resBody(ctx, {
    message: '查询成功',
    data: res,
  })
})

questions.get('/curr/rankTop10', async ctx => {
  if (!tokenFailure(ctx.token, ctx)) return;
  let { qid } = format(ctx.query);
  if (!qid) {
    return resBody(ctx, {
      status: 403,
      message: 'qid是必选参数'
    })
  }

  let res = await queryCurrGradeTop10(qid);

  return resBody(ctx, {
    message: '成功',
    data: res,
  })
})

questions.get('/curr/mygrade', async ctx => {
  if (!tokenFailure(ctx.token, ctx)) return;
  let { qid } = format(ctx.query);
  if (!qid) {
    return resBody(ctx, {
      status: 403,
      message: 'qid是必选参数'
    })
  }
  let { uid } = ctx.info;
  let [res] = await queryCurrMyGrade(uid, qid);
  let [info] = await queryCurrRankNum(qid);
  return resBody(ctx, {
    message: '成功',
    data: {
      ...res,
      count: info.count,
    },
  })
})

module.exports = questions;