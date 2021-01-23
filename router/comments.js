const Router = require('@koa/router')
const Comments = new Router({
  prefix: '/comments',
})
const moment = require('moment')
const { tokenFailure, resBody, format, isdef, responseFormat } = require('../utils')
const {
  getQuesCommentList,
  getAllReplyComments,
  queryCommentById,
  createComment,
  deleteCommentByCid,
  updateCommentCount,
  queryCommentByCidAndUid,
  queryChildComment,
} = require('../db/views/comments')

Comments.get('/queslist', async ctx => {
  let { quesid, start = 0, limit = 10 } = format(ctx.query);
  if (isdef(quesid)) {
    return resBody(ctx, {
      status: 401,
      message: 'quesid是必选参数'
    });
  }
  let arr = await getQuesCommentList(quesid, start, limit);
  return resBody(ctx, {
    message: '查询成功',
    data: responseFormat(arr)
  })
})

Comments.get('/allreply', async ctx => {
  let { cid, start = 0, limit = 10 } = format(ctx.query);
  if (isdef(cid)) {
    return resBody(ctx, {
      status: 401,
      message: 'cid是必选参数'
    });
  }
  let arr = responseFormat(await getAllReplyComments(cid, start, limit));
  let res = [];
  for (let i = 0; i < arr.length; i++) {
    let comment = arr[i];
    comment.targetInfo = {}
    if (comment.targetid) {
      let [info] = responseFormat(await queryCommentById(comment.targetid));
      comment.targetInfo = info;
    }
    res.push(comment);
  }

  return resBody(ctx, {
    message: '查询成功',
    data: res,
  })
})

Comments.post('/create', async ctx => {
  if (!tokenFailure(ctx.token, ctx)) return;
  let body = format(ctx.request.body);
  let { uid } = ctx.info;
  (['questionid', 'timuid', 'fromid', 'targetid']).forEach(key => {
    if (!body[key]) {
      body[key] = null
    }
  })
  if (!body.questionid && !body.timuid) {
    return resBody(ctx, {
      status: 401,
      message: `timuid和questionid是互斥且必须有其一的参数`
    });
  }
  body.createtime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
  if (body.fromid && body.targetid) {
    await updateCommentCount(body.fromid, 1)
    if (body.targetid !== body.fromid) {
      await updateCommentCount(body.targetid, 1)
    }
  }
  let { insertId } = await createComment(uid, body);
  let [res] = responseFormat(await queryCommentById(insertId));
  res.targetInfo = {};
  if (res.targetid) {
    res.targetInfo = responseFormat(await queryCommentById(res.targetid))[0]
  }
  return resBody(ctx, {
    message: '评论成功',
    data: res,
  })
})

Comments.delete('/delete', async ctx => {
  if (!tokenFailure(ctx.token, ctx)) return;
  let { uid } = ctx.info;
  let { cid } = format(ctx.query);
  if (!cid) {
    return resBody(ctx, {
      status: 401,
      message: 'cid是必须的参数'
    });
  }
  let [com] = (await queryCommentByCidAndUid(cid, uid));
  if (!com) {
    return resBody(ctx, {
      message: '没有该评论'
    });
  }

  let index = 0;
  let stack = [];
  function Temp(cid) {
    this.cid = cid;
    this.child = [];
  }
  let beforeid = null;
  stack.push(new Temp(cid));
  while (stack.length) {
    let obj = stack.pop();
    if (obj.child && obj.child[0] === beforeid) {
      index++;
      beforeid = obj.cid;
      deleteCommentByCid(obj.cid);
      continue;
    }
    let arr = await queryChildComment(obj.cid);
    obj.child = arr.map(item => item.cid);
    if (obj.child.length) {
      stack.push(obj);
      obj.child.forEach(cid => {
        stack.push(new Temp(cid));
      })
    } else {
      index++;
      beforeid = obj.cid;
      deleteCommentByCid(obj.cid);
    }
  }
  if (com.fromid) {
    updateCommentCount(com.fromid, -index);
  }

  return resBody(ctx, {
    message: '删除成功',
    count: index,
  })
})

module.exports = Comments
