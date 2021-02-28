const { queryFunc } = require('../../utils');
const moment = require('moment');

const game = {
  queryDanList() {
    let sql = 'select * from dan_rank';
    return queryFunc(sql);
  },
  queryUserAboutRank(uid) {
    let sql = `
      select uid, nickname, avatar, level, all_integral, curr_integral, rankcount
      from user where uid = ?
    `;
    return queryFunc(sql, uid);
  },
  queryRankList(start = 0, limit = 10) {
    let sql = `
      select * from user
      where curr_integral != 0
      order by curr_integral desc, rankcount asc limit ${start}, ${limit}
    `;
    return queryFunc(sql);
  },
  queryRankListAll() {
    let sql = `
      select * from user
      where curr_integral != 0
      order by curr_integral desc, rankcount asc
    `;
    return queryFunc(sql);
  },
  queryAppointmentGame(uid, start = 0, limit = 10) {
    let sql = `
      select * 
      from rank_game r inner join challenge_record c on r.rankid = c.rankid
      where c.chuserid = ?
      order by r.status asc limit ${start}, ${limit}
    `;
    return queryFunc(sql, uid);
  },
  queryAllGames(start = 0, limit = 10) {
    let sql = `select * from rank_game limit ${start}, ${limit}`
    return queryFunc(sql);
  },
  queryAppointmentOtherGames(uid, start = 0, limit = 10) {
    let sql = `
      select * 
      from rank_game
      where rankid not in (
        select c.rankid
        from challenge_record c inner join rank_game r on c.rankid = r.rankid
        where c.chuserid = ?
      )
      order by starttime asc limit ${start}, ${limit}
    `;
    return queryFunc(sql, uid);
  },
  insertChallengeRecord(rankid, uid) {
    let sql = `
      insert into challenge_record(rankid, chuserid)
      values(${rankid}, ${uid})
    `;
    return queryFunc(sql);
  },
  deleteChallengeRecord(rankid, uid) {
    let sql = `
      delete from challenge_record where rankid = ${rankid} and chuserid = ${uid}
    `;
    return queryFunc(sql);
  },
  queryDoingGames(uid) {
    let sql = `
      select * 
      from rank_game r inner join challenge_record c on r.rankid = c.rankid
      where c.chuserid = ? and r.status = 1
    `;
    return queryFunc(sql, uid);
  },
  isDoingGame(uid, challengeid) {
    let sql = `
      select * 
      from rank_game r inner join challenge_record c on r.rankid = c.rankid
      where c.chuserid = ? and c.challengeid = ? and r.status in (1,3) and c.finishtime is null
    `;
    return queryFunc(sql, uid, challengeid);
  },
  updateChallengeRecord(uid, challengeid, info) {
    let str = '';
    let keyStr = ['finishtime', 'json']
    let keyint = ['res_count', 'fail_count', 'time', 'score', 'isjoin'];
    let keyinsert = ['visible_count'];
    let keys = Object.keys(info);
    for (let i = 0; i < keys.length; i++) {
      let key = keys[i];
      if (keyStr.includes(key)) {
        str += `${key}='${info[key]}',`;
      } else if (keyint.includes(key)) {
        str += `${key}=${info[key]},`;
      } else if (keyinsert.includes(key)) {
        str += `${key}=${key}+${info[key]},`;
      }
    }
    str = str.slice(0, str.length-1);
    let sql = `
      update challenge_record set ${str}
      where challengeid = ${challengeid} and chuserid = ${uid}
    `;
    return queryFunc(sql);
  },
  queryGameById(rankid, uid) {
    let sql = `
      select * 
      from rank_game r inner join challenge_record c on r.rankid = c.rankid
      where r.rankid = ? and c.chuserid = ?
    `;
    return queryFunc(sql, rankid, uid);
  },
  queryChallengeRecordById(challengeid) {
    let sql = `select * from challenge_record where challengeid = ${challengeid}`;
    return queryFunc(sql);
  },
  queryCollectTimuByRid(rankid) {
    let sql = `
      select *
      from collect_timu c
      where c.r_id = ?
    `;
    return queryFunc(sql, rankid);
  },
  querySinglesById(sid) {
    let sql = `
      select singleid as id,name,img,options,res,description,options_count,score,uid,nickname,avatar
      from singles s inner join user u on s.single_uid = u.uid
      where singleid = ?
    `;
    return queryFunc(sql, sid);
  },
  queryMultisById(mid) {
    let sql = `
      select multiid as id,name,img,options,res,description,options_count,res_count,score,uid,nickname,avatar
      from multis m inner join user u on m.multi_uid = u.uid
      where multiid = ?
    `;
    return queryFunc(sql, mid);
  },
  queryFillsById(fid) {
    let sql = `
      select fillid as id,name,img,res_json,description,res_count,score,uid,nickname,avatar
      from fills f inner join user u on f.fill_uid = u.uid
      where fillid = ?`;
    return queryFunc(sql, fid);
  },
  queryAllSingles(start = 0, limit = 10) {
    let sql = `
      select singleid as id,name,img,options,res,description,options_count,score,uid,nickname,avatar
      from singles s inner join user u on s.single_uid = u.uid
      limit ${start}, ${limit}
    `;
    return queryFunc(sql);
  },
  queryAllMultis(start = 0, limit = 10) {
    let sql = `
      select multiid as id,name,img,options,res,description,options_count,res_count,score,uid,nickname,avatar
      from multis m inner join user u on m.multi_uid = u.uid
      limit ${start}, ${limit}
    `;
    return queryFunc(sql);
  },
  queryAllFills(start = 0, limit = 10) {
    let sql = `
      select fillid as id,name,img,res_json,description,res_count,score,uid,nickname,avatar
      from fills f inner join user u on f.fill_uid = u.uid
      limit ${start}, ${limit}
    `;
    return queryFunc(sql);
  },
  updateGameInfo(rankid, info) {
    let keys = Object.keys(info);
    let intKeys = ['status'];
    let insertKeys = ['reservation_num'];
    let str = '';
    keys.forEach(key => {
      if (intKeys.includes(key)) {
        str += `${key}=${info[key]}`;
      } else if (insertKeys.includes(key)) {
        str += `${key}=${key}+${info[key]}`
      }
    })
    let sql = `
      update rank_game set ${str}
      where rankid = ?
    `;
    return queryFunc(sql, rankid);
  },
  updateUserAboutGame(uid, info) {
    let keys = Object.keys(info);
    if (!keys.length) return;
    let insertKeys = ['all_integral', 'curr_integral', 'rankcount'];
    let str = '';
    keys.forEach(key => {
      if (insertKeys.includes(key)) {
        str += `${key}=${key}+${info[key]},`;
      }
    })
    str = str.slice(0, str.length-1);
    let sql = `
      update user set ${str}
      where uid = ${uid}
    `;
    return queryFunc(sql);
  },
  queryAppoinmentUserById(rankid) {
    let sql = `
      select * 
      from challenge_record
      where rankid = ? and isjoin = 1 and visible_count < allow_visible_count
      order by score desc, visible_count asc, time asc
    `;
    return queryFunc(sql, rankid);
  },
  queryGameByRankid(rankid) {
    let sql = `select * from rank_game where rankid = ?`;
    return queryFunc(sql, rankid);
  },
  insertReward({issue_uid,gameid,name,integral,reward_uid,description}) {
    let createtime = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
    let sql = `
      insert into reward(issue_uid,gameid,name,integral,reward_uid,description,createtime)
      values(${issue_uid},${gameid},"${name}",${integral},${reward_uid},"${description}","${createtime}")
    `;
    console.log(sql);
    return queryFunc(sql);
  },
  queryMyRewards(uid) {
    let sql = `
      select * from reward where reward_uid = ? order by isreceive asc
    `;
    return queryFunc(sql, uid);
  },
  receiveIntegral(id, uid) {
    let sql = `
      update reward set isreceive=1
      where rewardid = ? and reward_uid = ?
    `;
    return queryFunc(sql, id, uid);
  },
  insertSingleTimu(uid, timu) {
    let { name, img, options, res, description, options_count, score } = timu;
    let sql = `
      insert into singles(single_uid,${name ? 'name' : 'img'},options,res,description,options_count,score)
      values(${uid},"${name || img}","${options}","${res}","${description}",${options_count},${score})
    `;
    return queryFunc(sql);
  },
  insertMultiTimu(uid, timu) {
    let { name, img, options, res, description, options_count, res_count, score } = timu;
    let sql = `
      insert into multis(multi_uid,${name ? 'name' : 'img'},options,res,description,options_count,res_count,score)
      values(${uid},"${name || img}","${options}","${res}","${description}",${options_count},${res_count},${score})
    `;
    return queryFunc(sql);
  },
  insertFillTimu(uid, timu) {
    let { name, img, res_json, description, res_count, score } = timu;
    let sql = `
      insert into fills(fill_uid,${name ? 'name' : 'img'},res_json,description,res_count,score)
      values(${uid},"${name || img}",'${res_json}',"${description}",${res_count},${score})
    `;
    return queryFunc(sql);
  },
  queryOptionalGame(uid) {
    let sql = `
      SELECT *
      from rank_game
      where TIMESTAMPDIFF(SECOND, NOW() , starttime) > 3600 and creater = ${uid}
    `;
    return queryFunc(sql);
  },
  insertCollectGame(rankid, id, type) {
    let typeid = type === 'single' ? 's_id' : (type === 'multi' ? 'm_id' : 'f_id');
    let sql = `
      insert into collect_timu(r_id, ${typeid})
      values(${rankid},${id})
    `;
    return queryFunc(sql);
  },
  insertGame(uid, info) {
    let { rname,description,createtime,starttime,endtime,latetime,prompttime,winning_count,rewards } = info;
    let format = 'YYYY-MM-DD HH:mm:ss';
    let sql = `
      insert into rank_game(rname,description,createtime,starttime,endtime,creater,latetime,prompttime,winning_count,rewards)
      values(
        "${rname}",
        "${description}",
        "${moment(createtime).format(format)}",
        "${moment(starttime).format(format)}",
        "${moment(endtime).format(format)}",
        ${uid},
        "${moment(latetime).format(format)}",
        "${moment(prompttime).format(format)}",
        ${winning_count},
        "${rewards}"
      )
    `;
    return queryFunc(sql);
  },
  queryAuditGame(start = 0, limit = 10) {
    let sql = `
      select *
      from rank_game
      where status = 4 or status = 5
      order by status asc limit ${start}, ${limit}
    `;
    return queryFunc(sql);
  },
  queryRankReward(rankid) {
    let sql = `
      select *
      from challenge_record c inner join user u on c.chuserid = u.uid
      where rankid = ${rankid} and score != 0
      order by score desc, time asc limit 0, 3
    `;
    return queryFunc(sql);
  },
  queryMyRewardByRankid(rankid, uid) {
    let sql = `
      select * from reward where gameid = ? and reward_uid = ?
    `;
    return queryFunc(sql, rankid, uid);
  },
}

module.exports = game;
