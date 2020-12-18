const fs = require('fs');
const path = require('path');
const Router = require('@koa/router');
const multer = require('koa-multer');
const { tokenFailure, responseFormat, resBody, format } = require('../utils');
const home = new Router();

/*const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/img/');
  },
  filename: function (req, file , cb) {
    let filename = decodeURI(file.originalname);
    cb(null, Date.now() + '-' + filename);
  }
});
const upload = multer({ storage });*/
const uploadImg = multer({ dest: 'public/img/' });
const {
  questionsList,
} = require('../db/views/home');
const {
  getUser,
} = require('../db/views/profile');

home.get('/islogin', async (ctx) => {
  if (!tokenFailure(ctx.token, ctx)) return;
  let { uid } = ctx.info;
  let [res] = await getUser(uid);
  res = responseFormat(res);
  delete res.password;
  return resBody(ctx, {
    message: '已经登录过了',
    data: {...res, token: ctx.token }
  })
})

/**
 * 获取所有被公开的题库（ishidden属性为 false）
 * 权限： 不需要登录
 */
home.get('/questions/list', async (ctx) => {
  ctx.response.type = 'json';
  const { limit, start } = responseFormat(ctx.query);
  let res = await questionsList(limit, start);
  res = responseFormat(res);
  return resBody(ctx, {
    message: '查询成功',
    data: {
      count: res.length,
      list: res
    }
  })
})

home.post('/upload/img', async (ctx, next) => {
  if (!tokenFailure(ctx.token, ctx)) return;
  await next();
}, uploadImg.single('file'), ctx => {
  let { filename, size, path, originalname } = ctx.req.file;
  let newfilename = Date.now() + '-' + originalname;
  let oldpath = path;
  let newpath = oldpath.replace(filename, newfilename);
  fs.renameSync(oldpath, newpath);
  return resBody(ctx, {
    message: '上传文件成功',
    data: {
      filename: newfilename,
      size,
      path: 'http://localhost:5000/img/' + newfilename,
    }
  })
})

home.delete('/delete/img', async (ctx) => {
  if (!tokenFailure(ctx.token, ctx)) return;
  let { filename } = format(ctx.query);
  let filepath = path.join(process.cwd(), `public/img/${filename}`);
  fs.unlinkSync(filepath);
  return resBody(ctx, {
    message: '删除成功',
  })
})

module.exports = home;
