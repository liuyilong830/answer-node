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
} = require('../db/views/questions');

const BaseUserAbout = function(userid, quid) {
  this.userid = userid;
  this.quid = quid;
  this.iszan = 0;
  this.iswork = 0;
  this.iscollection = 0;
}

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
  body.createtime = moment(parseInt(body.createtime)).format('YYYY-MM-DD HH:mm:ss');
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
  if (!tokenFailure(ctx.token, ctx)) return;
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
  if (!tokenFailure(ctx.token, ctx)) return;
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
  if (!tokenFailure(ctx.token, ctx)) return;
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
  if (!tokenFailure(ctx.token, ctx)) return;
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

module.exports = questions;