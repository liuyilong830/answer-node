const { queryFunc, jointoStr } = require('../../utils');

const questions = {
  deleteQuestionByClassid(classid) {
    let sql = `delete from ques_cls where cid = ?`;
    return queryFunc(sql, classid);
  },
  queryQuestionById(qid) {
    let sql = `select * from questions where qid = ?`;
    return queryFunc(sql, qid);
  },
  queryQuestionByUid(uid, start, limit) {
    let sql = `select * from questions where uid = ? limit ${start}, ${limit}`;
    return queryFunc(sql, uid);
  },
  createQuestionBank(uid, info) {
    let sql = `
      insert into questions(uid, qname, description, ishidden, istoclass, icon, createtime) 
      values(?,?,?,?,?,?,?)
    `
    let {qname, description, ishidden, istoclass, icon, createtime} = info;
    return queryFunc(sql, uid, qname, description, ishidden, istoclass, icon, createtime);
  },
  insertQuesofCls(qid, cls) {
    let str = '';
    cls.forEach(cid => {
      str += `(${qid},${cid}),`
    })
    str = str.slice(0, str.length-1);
    let sql = `insert into ques_cls(qid, cid) values${str}`;
    return queryFunc(sql);
  },
  insertTimu(qid, list) {
    let str = '';
    list.forEach(t => {
      let tname = t.tname;
      let description = t.description;
      let tnum = t.tnum || 0;
      let res = Array.isArray(t.res) ? t.res.join('&&') : t.res;
      let options = t.options.join('&&');
      str += `(${qid},'${tname}','${description}',${tnum},'${res}','${options}'),`
    })
    str = str.slice(0, str.length-1);
    let sql = `insert into timu(quesid,tname,description,tnum,res,options) values${str}`;
    console.log(sql);
    return queryFunc(sql);
  },
  queryTimus(qid) {
    let sql = `select * from timu where quesid = ?`;
    return queryFunc(sql, qid);
  },
  queryAboutUser(qid, uid) {
    let sql = `
      select iszan, iswork, iscollection
      from ques_operation 
      where quid = ? and userid = ?
    `;
    return queryFunc(sql, qid, uid);
  },
  querySingles(qid, start = 0, limit = 10) {
    let sql = `
      select * 
      from timu 
      where quesid = ? and tnum != 0 and instr(res, '&&') = 0 limit ${start}, ${limit}
    `;
    return queryFunc(sql, qid);
  },
  queryMultis(qid, start = 0, limit = 10) {
    let sql = `
      select * 
      from timu 
      where quesid = ? and tnum != 0 and instr(res, '&&') != 0 limit ${start}, ${limit}
    `;
    return queryFunc(sql, qid);
  },
  queryShortAnswers(qid, start = 0, limit = 10) {
    let sql = `
      select * 
      from timu 
      where quesid = ? and tnum = 0 limit ${start}, ${limit}
    `;
    return queryFunc(sql, qid);
  },
  updateTimu(timu) {
    let { tid, quesid, tname, tnum, options, res, description } = timu;
    let str = jointoStr({tname, tnum, options, res, description});
    let sql = `
      update timu set ${str}
      where tid=${tid} and quesid= ${quesid}
    `
    return queryFunc(sql);
  },
  deleteTimu(tid, quesid) {
    let sql = `delete from timu where tid = ? and quesid = ?`;
    return queryFunc(sql, tid, quesid);
  },
}

module.exports = questions;