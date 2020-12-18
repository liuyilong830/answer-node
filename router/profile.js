const Router = require('@koa/router');
const { tokenFailure, format, responseFormat, resBody } = require('../utils');
const profile = new Router({
  prefix: '/profile'
});

const {
  joinClass,
  createdClass,
  joinCids,
  tocreateClass,
  queryClass,
  getUser,
  updateClass,
  deleteClass,
  deleteClassPeople,
  queryClassByUid,
  queryClassPeople,
  updateUser,
  appendClassPeople,
  isjoin,
} = require('../db/views/profile');
const {
  deleteQuestionByClassid,
} = require('../db/views/questions');

profile.get('/class', async (ctx) => {
  if (!tokenFailure(ctx.token, ctx)) return;
  let { uid, rid } = ctx.info;
  let creates = [];
  let joins = [];
  if (rid === 1) {
    creates = await createdClass(uid);
    creates = responseFormat(creates);
  }
  let createdids = creates.map(cls => cls.classid);
  let cids = await joinCids(uid, createdids);
  if (cids.length) {
    joins = await joinClass(cids.map(item => item.classid));
    joins = responseFormat(joins);
  }
  return resBody(ctx, {
    message: '查询成功',
    data: {
      joins,
      creates
    }
  })
})

profile.get('/class/mycreated', async (ctx) => {
  if (!tokenFailure(ctx.token, ctx)) return;
  let { uid, rid } = ctx.info;
  let creates = [];
  if (rid === 1) {
    creates = responseFormat(await createdClass(uid));
  }
  return resBody(ctx, {
    message: '查询成功',
    data: creates
  })
})
/**
 * 作用：创建一个班级，并返回该班级的相关信息
 * path: /create/class
 * 参数：createid, description, classname
 */
profile.put('/class/create', async (ctx) => {
  if (!tokenFailure(ctx.token, ctx)) return;
  let { uid, rid } = ctx.info;
  if (rid !== 1) {
    return resBody(ctx, {
      status: 403,
      message: '该身份没有此权限'
    })
  }
  let temp = format({...ctx.request.body});
  temp.createtime = new Date();
  temp.createid = uid;
  let [user] = await getUser(uid);
  if (!user) {
    return resBody(ctx, {
      status: 403,
      message: '该用户不存在'
    })
  }
  let ins = await tocreateClass(temp);
  await appendClassPeople(ins.insertId, uid);
  let [res] = await queryClass(ins.insertId);
  res = responseFormat(res);
  return resBody(ctx, {
    status: 200,
    message: '创建班级成功',
    data: res,
  })
})

/**
 * 作用：用来更新班级数据的变化
 * path: /class/update
 * 参数：必选参数 => classid；
 *      可选参数 => description, classname, classavatar
 */
profile.patch('/class/update', async (ctx) => {
  if (!tokenFailure(ctx.token, ctx)) return;
  let body = format(ctx.request.body, ['birthday']);
  if (typeof body.classid !== 'number' || body.classid.toString() === 'NaN') {
    return resBody(ctx, {
      status: 403,
      message: '必须指定正确的班级id才能进行更新'
    })
  }
  let res = await updateClass(body);
  if (res.fieldCount > 0) {
    resBody(ctx, {
      status: 403,
      message: '请求发生了一些错误'
    })
  } else {
    resBody(ctx, {
      message: '更新数据成功',
      data: res
    })
  }
})

profile.delete('/class/delete', async (ctx) => {
  if (!tokenFailure(ctx.token, ctx)) return;
  let { uid, rid } = ctx.info;
  if (rid !== 1) {
    return resBody(ctx, {
      status: 403,
      message: '该身份没有此权限'
    })
  }
  let { classid } = format(ctx.query);
  if (!classid) {
    return resBody(ctx, {
      status: 403,
      message: '没有找到该班级'
    })
  }
  await deleteClassPeople(classid);
  await deleteQuestionByClassid(classid);
  let res = await deleteClass(classid, uid);
  resBody(ctx, {
    message: '删除成功',
    data: res
  })
})

profile.get('/class/questions', async (ctx) => {
  if (!tokenFailure(ctx.token, ctx)) return;
  let { uid, classid } = format(ctx.query);
  if (!uid || !classid) {
    return resBody(ctx, {
      status: 403,
      message: `${!uid ? 'uid' : 'classid'}是必选参数`
    })
  }
  let res = await queryClassByUid(uid, classid);
  res = responseFormat(res.flat());
  return resBody(ctx, {
    message: '查询成功',
    data: {
      creates: res,
    }
  })
})

profile.get('/class/people', async (ctx) => {
  if (!tokenFailure(ctx.token, ctx)) return;
  let { classid } = format(ctx.query);
  if (!classid) {
    return resBody(ctx, {
      status: 403,
      message: `classid是必选参数`
    })
  }
  let res = await queryClassPeople(classid);
  res = responseFormat(res);
  return resBody(ctx, {
    message: '查询成功',
    data: {
      people: res,
    }
  })
})

profile.post('/class/append', async ctx => {
  if (!tokenFailure(ctx.token, ctx)) return;
  let { classid } = format(ctx.request.body);
  let { uid } = ctx.info;
  if ((await isjoin(uid, classid)).length > 0) {
    return resBody(ctx, {
      message: '你已经加入过该班级了'
    })
  }
  let res = await appendClassPeople(classid, uid);
  console.log(res);
  return resBody(ctx, {
    message: '成功新增一名学员',
    data: res
  })
})

profile.patch('/user/update', async (ctx) => {
  if (!tokenFailure(ctx.token, ctx)) return;
  let { uid } = ctx.info;
  let body = format(ctx.request.body, ['birthday']);
  let res = await updateUser(body, parseInt(uid));
  if (res.fieldCount > 0) {
    resBody(ctx, {
      status: 403,
      message: '请求发生了一些错误'
    })
  } else {
    resBody(ctx, {
      message: '更新数据成功',
      data: res
    })
  }
})

profile.get('/class/list', async ctx => {
  let res = await queryClass();
  res = responseFormat(res);
  return resBody(ctx, {
    message: '查询成功',
    data: {
      list: res
    }
  })
})

module.exports = profile;
