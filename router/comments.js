const Router = require('@koa/router')
const Comments = new Router({
  prefix: '/comments',
})
const { tokenFailure, resBody, format, isdef, responseFormat } = require('../utils')
const {
  getQuesCommentList,
  getAllReplyComments,
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
  let res = arr.map(comment => {
    comment.targetInfo = {};
    if (comment.targetid !== cid) {
      let index = arr.findIndex(com => com.cid === comment.targetid);
      comment.targetInfo = arr[index];
    }
    return comment;
  })

  return resBody(ctx, {
    message: '查询成功',
    data: res,
  })
})

module.exports = Comments
