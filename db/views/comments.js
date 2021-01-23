const { queryFunc, jointoStr } = require('../../utils')

const comments = {
  getQuesCommentList(qid, start = 0, limit = 10) {
    let sql = `
      select *
      from comments c inner join user u on c.usid = u.uid
      where questionid = ? and c.fromid is null and c.targetid is null limit ${start}, ${limit}
    `;
    return queryFunc(sql, qid);
  },
  getAllReplyComments(cid, start, limit) {
    let sql = `
      select *
      from comments c inner join user u on c.usid = u.uid
      where c.fromid = ?
      order by c.createtime asc limit ${start}, ${limit}
    `;
    return queryFunc(sql, cid);
  },
  queryCommentById(cid) {
    let sql = `
      select *
      from comments c inner join user u on c.usid = u.uid
      where c.cid = ?
    `
    return queryFunc(sql, cid);
  },
  createComment(uid, info) {
    let keys = Object.keys(info).filter(key => info[key]);
    let str = keys.join(',');
    let values = "";
    keys.forEach(key => {
      let s = info[key]
      if (typeof s === 'string') {
        s = `'${s}'`
      }
      values += s + ',';
    })
    values = values.slice(0, values.length-1)
    let sql = `
      insert into comments(usid,${str}) 
      values(${uid},${values})
    `;
    return queryFunc(sql);
  },
  updateCommentCount(cid, num = 0) {
    let sql = `
      update comments set count=count+${num}
      where cid = ?
    `;
    return queryFunc(sql, cid);
  },
  deleteCommentByCid(cid) {
    let sql = `
      delete from comments
      where cid = ?
    `;
    return queryFunc(sql, cid);
  },
  queryCommentByCidAndUid(cid, uid) {
    let sql = `
      select *
      from comments
      where cid = ? and usid = ?
    `
    return queryFunc(sql, cid, uid);
  },
  queryChildComment(cid) {
    let sql = `
      select *
      from comments
      where targetid = ?
      order by createtime asc
    `
    return queryFunc(sql, cid);
  },
}

module.exports = comments;
