const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const cors = require('koa2-cors');
const jwt = require('jsonwebtoken');
const koaStatic = require('koa-static');
const path = require('path');

const home = require('./router/home');
const login = require('./router/login');
const profile = require('./router/profile');
const questions = require('./router/questions');
const comments = require('./router/comments');
const game = require('./router/game');
const { secret } = require('./utils');
const staticPath = './public';

const app = new Koa();

const check = async function(ctx, next) {
  let reg = /^\/login*?/
  let url = ctx.request.url;
  // 如果请求的 url 是登录相关的请求，则直接跳过检察，否则判断 token 是否过期
  if (reg.test(url)) {
    return next();
  }
  let token = ctx.request.headers['authorization'];
  await jwt.verify(token, secret, async (error, decoded) => {
    if (error) {
      // token 过期了
      ctx.token = '';
    } else {
      ctx.token = token;
      ctx.info = decoded.info;
    }
    // token 还没有过期，跳到下一个中间件去执行
    await next();
  })
}
// 设置静态资源访问路径
app.use(koaStatic(
  path.join(__dirname,  staticPath)
));
// 跨域设置
app.use(cors({
  origin: '*',
  allowHeaders: ['authorization', 'Content-Type']
}));

// post请求获取实体
app.use(bodyParser());

// 验证 token 是否过期
app.use(check);

// 设置基于首页的路由
app.use(login.routes()).use(login.allowedMethods());
app.use(home.routes()).use(home.allowedMethods());
app.use(profile.routes()).use(profile.allowedMethods());
app.use(questions.routes()).use(questions.allowedMethods());
app.use(comments.routes()).use(comments.allowedMethods());
app.use(game.routes()).use(game.allowedMethods());
app.listen(5000, () => {
  console.log('请访问: http://localhost:5000');
});
