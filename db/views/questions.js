const { queryFunc, jointoStr, isdef } = require('../../utils');

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
  queryTimuOperation(uid, tid) {
    let sql = `select * from timu_operation where tuserid = ? and tmid = ?`;
    return queryFunc(sql, uid, tid);
  },
  insertTimuOperations(uid, { tid, iszan, iscomment, iscollection }) {
    let sql = `insert into timu_operation(tuserid, tmid, iszan, iscomment, iscollection) values(?,?,?,?,?)`;
    return queryFunc(sql, uid, tid, iszan, iscomment, iscollection);
  },
  updateTimuQoreations(uid, info) {
    let tid = info.tid;
    delete info.tid;
    let str = jointoStr(info);
    let sql = `
      update timu_operation set ${str}
      where tuserid = ${uid} and tmid = ${tid};
    `
    return queryFunc(sql);
  },
  queryQuestOpt(userid, quesid) {
    let sql = `select * from ques_operation where userid = ? and quid = ?`;
    return queryFunc(sql, userid, quesid);
  },
  insertQuestOpt(userid, quesid) {
    let sql = `insert into ques_operation(userid,quid) values(?,?)`;
    return queryFunc(sql, userid, quesid);
  },
  updateQuestOpt(userid, {quesid, iszan, iscollection, iswork, finishtime, work_json}) {
    let str = '';
    str += !isdef(iszan) ? `iszan=${iszan},` : '';
    str += !isdef(iscollection) ? `iscollection=${iscollection},` : '';
    str += !isdef(iswork) ? `iswork=${iswork},` : '';
    str += !isdef(finishtime) ? `finishtime=${finishtime},`: '';
    str += !isdef(work_json) ? `work_json='${work_json}'`: '';
    if (str[str.length-1] === ',') {
      str = str.slice(0, str.length-1);
    }
    let sql = `
      update ques_operation set ${str}
      where userid = ${userid} and quid = ${quesid}
    `;
    return queryFunc(sql);
  },
  queryFinishedQuestUser(quesid) {
    let sql = `
      select u.uid, u.nickname, q.finishtime, q.iswork
      from ques_operation q inner join user u on q.userid = u.uid
      where quid = ? and finishtime is not null
    `;
    return queryFunc(sql, quesid);
  },

}

module.exports = questions;