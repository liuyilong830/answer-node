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
} = require('../db/views/questions');

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

module.exports = questions;