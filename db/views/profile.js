const { queryFunc, jointoStr } = require('../../utils');

const profile = {
  joinCids(uid, createdids) {
    let sql = `
      select classid
      from classofstu
      where sid = ? and classid not in(${createdids.join(',')})
    `
    return queryFunc(sql, uid);
  },
  joinClass(cids) {
    let sql = `
      select c.classid, c.classname, c.classavatar, c.description, c.createtime, u.uid, u.sname, u.nickname, u.avatar, u.rid, count(c.classid) as count
      from class c inner join user u on c.createid = u.uid inner join classofstu f on f.classid = c.classid
      where c.classid in(${cids.join(',')})
      group by c.classid
    `
    return queryFunc(sql);
  },
  isjoin(uid, classid) {
    let sql = `select * from classofstu where sid = ? and classid = ?`;
    return queryFunc(sql, uid, classid);
  },
  createdClass(uid) {
    let sql = `
      select c.classid, u.uid, c.classname, c.classavatar, c.description, c.createtime, u.sname, u.nickname, u.avatar, u.rid, count(f.sid) as count
      from class c inner join user u on c.createid = u.uid left join classofstu f on c.classid = f.classid
      where c.createid = ?
      group by c.classid
      order by c.createtime desc
    `
    return queryFunc(sql, uid);
  },
  tocreateClass(options) {
    let sql = `
      insert into class(createid, description, classname, createtime)
      values (?,?,?,?)
    `;
    let {createid, description, classname, createtime} = options;
    return queryFunc(sql, createid, description, classname, createtime)
  },
  queryClass(classid) {
    let sql = `
      select c.classid, u.uid, c.classname, c.classavatar, c.description, c.createtime, u.sname, u.nickname, u.avatar, u.rid, count(f.sid) as count
      from class c inner join user u on c.createid = u.uid left join classofstu f on c.classid = f.classid
      ${classid ? 'where c.classid = ?' : ''}
      group by classid
    `;
    return queryFunc(sql, classid);
  },
  getUser(createid) {
    let sql = 'select * from user where uid = ?';
    return queryFunc(sql, createid);
  },
  updateClass(options) {
    let clsid = options.classid;
    delete options.classid;
    let str = jointoStr(options);
    let sql = `
      update class set ${str}
      where classid = ?
    `
    return queryFunc(sql, clsid);
  },
  deleteClass(classid, uid) {
    let sql = 'delete from class where classid = ? and createid = ?';
    return queryFunc(sql, classid, uid);
  },
  deleteClassPeople(classid, uid) {
    let sql = `delete from classofstu where classid = ? ${uid === undefined ? '' : `and sid = ${uid}`}`;
    return queryFunc(sql, classid);
  },
  queryClassByUid(uid, classid) {
    let sql1 = `
      SELECT q.qid, q.qname, q.description, q.icon, q.createtime, q.workcount, q.score, q.zancount, q.istoclass, u.nickname, u.avatar, u.sname, u.sex, u.uid
      FROM questions q inner join user u on q.uid = u.uid
      where ishidden != 1 and istoclass != 1 and q.uid = ?
    `
    let sql2 = `
      SELECT q.qid, q.qname, q.description, q.icon, q.createtime, q.workcount, q.score, q.zancount, q.istoclass, u.nickname, u.avatar, u.sname, u.sex, u.uid
      FROM questions q inner join user u on q.uid = u.uid inner join ques_cls s on q.qid = s.qid
      where ishidden != 1 and istoclass = 1 and q.uid = ? and s.cid = ?
    `
    return Promise.all([queryFunc(sql2, uid, classid), queryFunc(sql1, uid)]);
  },
  queryClassPeople(classid) {
    let sql = `
      select uid, sname, nickname, sex, avatar
      from classofstu f inner join user u on f.sid = u.uid
      where f.classid = ?
    `
    return queryFunc(sql, classid);
  },
  appendClassPeople(classid, uid) {
    let sql = `
      insert into classofstu(classid, sid) values(?, ?)
    `
    return queryFunc(sql, classid, uid);
  },
  updateUser(options, uid) {
    let str = jointoStr(options);
    let sql = `update user set ${str} where uid = ?`
    return queryFunc(sql, uid);
  },
}

module.exports = profile;