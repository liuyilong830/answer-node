/*
 Navicat Premium Data Transfer

 Source Server         : nodejs
 Source Server Type    : MySQL
 Source Server Version : 80019
 Source Host           : localhost:3306
 Source Schema         : answer

 Target Server Type    : MySQL
 Target Server Version : 80019
 File Encoding         : 65001

 Date: 08/01/2021 22:06:28
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for class
-- ----------------------------
DROP TABLE IF EXISTS `class`;
CREATE TABLE `class`  (
  `classid` int(0) NOT NULL AUTO_INCREMENT COMMENT '班级id',
  `createid` int(0) NOT NULL COMMENT '创始人id，外键',
  `description` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '班级描述',
  `classname` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '班级名称',
  `classavatar` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT 'def-avatar.png' COMMENT '班级头像',
  `createtime` datetime(0) NOT NULL COMMENT '创建的时间',
  PRIMARY KEY (`classid`) USING BTREE,
  INDEX `createid`(`createid`) USING BTREE,
  CONSTRAINT `createid` FOREIGN KEY (`createid`) REFERENCES `user` (`uid`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 22 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of class
-- ----------------------------
INSERT INTO `class` VALUES (1, 10002, '班级gogogo冲冲冲', '17软件工程1班', 'def-avatar.png', '2020-12-02 13:16:35');
INSERT INTO `class` VALUES (21, 10005, '的分工及王文荣撒大幅度', '阿狸说', 'def-avatar.png', '2020-12-13 16:42:22');
INSERT INTO `class` VALUES (22, 10005, '打工我瓦尔加人法地飞洒安慰撒旦法水温塞水电费我没', '我诶发上来的', 'def-avatar.png', '2020-12-13 16:45:54');

-- ----------------------------
-- Table structure for classofstu
-- ----------------------------
DROP TABLE IF EXISTS `classofstu`;
CREATE TABLE `classofstu`  (
  `classid` int(0) NOT NULL COMMENT '班级id，外键',
  `sid` int(0) NOT NULL COMMENT '加入班级的学生id，外键',
  INDEX `classid`(`classid`) USING BTREE,
  INDEX `sid`(`sid`) USING BTREE,
  CONSTRAINT `classid` FOREIGN KEY (`classid`) REFERENCES `class` (`classid`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `sid` FOREIGN KEY (`sid`) REFERENCES `user` (`uid`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of classofstu
-- ----------------------------
INSERT INTO `classofstu` VALUES (1, 10000);
INSERT INTO `classofstu` VALUES (1, 10001);
INSERT INTO `classofstu` VALUES (1, 10006);
INSERT INTO `classofstu` VALUES (1, 10007);
INSERT INTO `classofstu` VALUES (21, 10005);
INSERT INTO `classofstu` VALUES (22, 10005);
INSERT INTO `classofstu` VALUES (1, 10002);
INSERT INTO `classofstu` VALUES (1, 10005);

-- ----------------------------
-- Table structure for ques_cls
-- ----------------------------
DROP TABLE IF EXISTS `ques_cls`;
CREATE TABLE `ques_cls`  (
  `qid` int(0) NOT NULL COMMENT '题库id，外键',
  `cid` int(0) NOT NULL COMMENT '班级id，外键',
  INDEX `qid`(`qid`) USING BTREE,
  INDEX `cid`(`cid`) USING BTREE,
  CONSTRAINT `cid` FOREIGN KEY (`cid`) REFERENCES `class` (`classid`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `qid` FOREIGN KEY (`qid`) REFERENCES `questions` (`qid`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of ques_cls
-- ----------------------------
INSERT INTO `ques_cls` VALUES (1, 1);

-- ----------------------------
-- Table structure for ques_operation
-- ----------------------------
DROP TABLE IF EXISTS `ques_operation`;
CREATE TABLE `ques_operation`  (
  `userid` int(0) NOT NULL COMMENT '用户id，外键',
  `quid` int(0) NOT NULL COMMENT '题库id，外键',
  `iszan` tinyint(0) NOT NULL DEFAULT 0 COMMENT '是否已经点赞，0为false，1为true',
  `iswork` tinyint(0) NOT NULL DEFAULT 0 COMMENT '是否参与过答题',
  `iscollection` tinyint(0) NOT NULL DEFAULT 0 COMMENT '是否收藏过',
  INDEX `userid`(`userid`) USING BTREE,
  INDEX `quid`(`quid`) USING BTREE,
  CONSTRAINT `quid` FOREIGN KEY (`quid`) REFERENCES `questions` (`qid`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `userid` FOREIGN KEY (`userid`) REFERENCES `user` (`uid`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of ques_operation
-- ----------------------------
INSERT INTO `ques_operation` VALUES (10002, 19, 1, 0, 1);

-- ----------------------------
-- Table structure for questions
-- ----------------------------
DROP TABLE IF EXISTS `questions`;
CREATE TABLE `questions`  (
  `qid` int(0) NOT NULL AUTO_INCREMENT COMMENT '题库id，主键',
  `qname` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '题库名称',
  `description` varchar(1020) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '题库描述',
  `mode` int(0) NOT NULL DEFAULT 1 COMMENT '题库的答题方式，1为做一改一；2为全部做完才校验',
  `ishidden` tinyint(0) NOT NULL DEFAULT 0 COMMENT '题库是否被隐藏',
  `uid` int(0) NOT NULL COMMENT '题库的创建人id，外键',
  `icon` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '题库图标',
  `istoclass` tinyint(0) NOT NULL DEFAULT 1 COMMENT '题库是否展示在班级内',
  `workcount` int(0) NOT NULL DEFAULT 0 COMMENT '刷完题库的人数',
  `score` double NOT NULL DEFAULT 0 COMMENT '题库评价总分数',
  `zancount` int(0) NOT NULL DEFAULT 0 COMMENT '点赞人数',
  `comcount` int(0) NOT NULL DEFAULT 0 COMMENT '评论数量',
  `collcount` int(0) NOT NULL DEFAULT 0 COMMENT '收藏数量',
  `createtime` datetime(0) NOT NULL ON UPDATE CURRENT_TIMESTAMP(0) COMMENT '创建时间',
  PRIMARY KEY (`qid`, `collcount`) USING BTREE,
  INDEX `uid`(`uid`) USING BTREE,
  CONSTRAINT `uid` FOREIGN KEY (`uid`) REFERENCES `user` (`uid`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of questions
-- ----------------------------
INSERT INTO `questions` VALUES (1, '前端', '前端基础知识总结', 1, 0, 10002, 'banner4.png', 1, 0, 0, 0, 0, 0, '2020-12-18 15:05:24');
INSERT INTO `questions` VALUES (2, 'javascript课程', 'javascript笔面试重点、难点、易错点题库', 1, 0, 10000, 'banner2.jpg', 0, 0, 0, 0, 0, 0, '2020-12-18 15:05:27');
INSERT INTO `questions` VALUES (3, '新大学英语', '你背了很多英语单词，你掌握了英语语法规则，你可能会写出语法正确的句子。其实，英语学习不仅仅是那些字、词、句，而应该是这些字词句传承的内容和思想。学习英语就是通过英语去探索一个世界，认识更好的自己，传递一种思想和文化。来吧，我们一起用英语开启我们的探索之旅！', 1, 1, 10000, 'questions2.jpg', 0, 0, 0, 0, 0, 0, '2020-12-18 15:05:32');
INSERT INTO `questions` VALUES (4, '数据结构', '学了一门编程语言不知道能干啥？来学数据结构就对啦！ 学会编程相当于会砌猪圈的泥瓦匠，学完数据结构就会盖个双层小楼啦~ 同时还可以一窥构筑摩天大厦的奇门武功！ 欢迎勤奋的小白活泼乱入！十周修炼，得入门径，一代大侠，从此出发 —— 快来吧~ ^_^', 1, 0, 10000, 'questions3.jpg', 0, 0, 0, 0, 0, 0, '2020-12-18 15:05:35');
INSERT INTO `questions` VALUES (5, 'java', '用对象思考，用类来写作。Java语言是一种面向对象语言，是业界使用最为广泛的语言，十二年前就占据了1/4的编程语言份额，到今天仍然以1/5的比例站在编程语言排行榜的前列。Java是优秀的面向对象编程语言，特别适合构建多人协作的大型软件产品。', 1, 0, 10001, 'questions4.jpg', 0, 0, 0, 0, 0, 0, '2020-12-18 15:05:39');
INSERT INTO `questions` VALUES (6, 'python', '“我们正步入一个数据或许比软件更重要的新时代。——Tim O\'Reilly” 运用数据是精准刻画事物、呈现发展规律的主要手段，分析数据展示规律，把思想变得更精细！ ——“弹指之间·享受创新”，通过8周学习，你将掌握利用Python语言表示、清洗、统计和展示数据的能力。', 1, 0, 10003, 'questions5.jpg', 0, 0, 0, 0, 0, 0, '2020-12-18 15:05:44');
INSERT INTO `questions` VALUES (7, 'c语言程序设计进阶', 'C语言有许多独特的地方。从1970年代诞生起，它的历史使命就是编写系统程序，它被设计成非常贴近底层、贴近硬件。它的很多独特的设计都是为了能够准确地反映硬件操作。但是历史又和C语言开了一个玩笑，它被当作了第一个通用型语言，曾经广泛地用于各种场合，解决各种问题。它有哪些神秘之处呢？', 1, 0, 10006, 'questions6.jpg', 0, 0, 0, 0, 0, 0, '2020-12-18 15:05:48');
INSERT INTO `questions` VALUES (8, '【慕课堂】开放精品慕课资源，助力新学期校内教学', '用简单的方式，让每个课堂更精彩。 我们希望每个老师，可以通过这门课程，快速掌握【慕课堂智能教学工具】，对【可视化数据监控学习行为】，及时调整教学设计，实现【线上线下一体化课堂管理】，让老师的教学更轻松更高效！', 1, 0, 10002, 'questions7.jpg', 0, 0, 0, 0, 0, 0, '2020-12-18 15:05:51');
INSERT INTO `questions` VALUES (9, '“互联网+”时代教师个人知识管理', '互联网时代，知识的半衰期越来越短。教师在面对海量的信息时，对信息进行快速搜索、收集、关联、加工、集成并在教学中应用的能力相对缺乏。本课程旨在为教师提供个人知识管理的解决思路、方法和工具，帮助老师快速建构自己的知识体系，并能在教学与科研中灵活应用。', 1, 0, 10002, 'questions8.jpg', 0, 0, 0, 0, 0, 0, '2020-12-18 15:05:56');
INSERT INTO `questions` VALUES (10, '教师情绪管理', '教师情绪管理是有效课堂教学与师生良好沟通的重要前提，也是促进教师心理健康的重要手段。本课程通过对教师现实压力与情绪困扰的剖析，为教师提供情绪管理的基本知识和技能，激发教师积极有效的行为，从而提升教师的自我效能、成就感与幸福感，最终获得生活和工作上的超越和自我实现！', 1, 0, 10003, 'questions9.jpg', 0, 0, 0, 0, 0, 0, '2020-12-18 15:05:58');
INSERT INTO `questions` VALUES (11, '心理学：我知无不言，它妙不可言', '心理学的入门课，带你系统学习科学心理学。 不鸡汤、不口水、够专业、接地气，有理论讲解、有经典案例、有最新研究； 通俗易懂、有趣实用、有味儿止渴； 别忘了关注专栏课程关系攻略​', 1, 0, 10007, 'ques10.jpg', 0, 0, 0, 0, 0, 0, '2020-12-18 15:06:00');
INSERT INTO `questions` VALUES (12, '农药学', '农药是人类与有害生物斗争的法宝，更是世界粮食安全生产和人类健康生活的保障，在病、虫、草、鼠等有害生物的综合治理中具有不可替代的作用。《农药学》是植保专业本科生的专业核心课，同时也是农学、园艺和林学等专业的必修或选修课，具有农业化学与生物学、环境科学、农学等学科交叉特点，兼备理论性和实践性，对从事农药研发、推广应用、流通管理等领域的专业人员和科技工作者也具有较强的学习和参考价值。开启农药学课程学习，中国农业大学植物保护学院二级教授领衔教学团队，将带你一起领略农药学这一交叉学科的风采！', 1, 0, 10006, 'ques11.jpg', 0, 0, 0, 0, 0, 0, '2020-12-18 15:06:03');
INSERT INTO `questions` VALUES (13, '动物解剖学', '本MOOC课程的特色与亮点：抽象知识点的可视化、枯燥知识点的生活化以及专业知识点的职业化，兼具科学性与趣味性。本MOOC课程通过大量解剖操作视频实现抽象知识点的可视化；同时，授课老师的讲解过程结合了大量生活体验和兽医临床案例，实现枯燥知识点的生活化与职业化。同学们可以在轻松愉快的氛围中学好《动物解剖学》，同时，也可以在生活中体会到解剖学的乐趣。\r\n\r\n授课老师为浙江大学动物科学学院的李剑副教授、浙江大学医学院的孙秉贵教授和河南科技大学动物科技学院的张自强副教授。', 1, 0, 10006, 'ques12.jpg', 0, 0, 0, 0, 0, 0, '2020-12-18 15:06:05');
INSERT INTO `questions` VALUES (19, '科学防“疫', '科学抗疫是一门从流行病学角度分析新冠疫情这一突发性公共卫生事件的课程，从突发公共卫生事件的概念到冠状病毒的介绍、新冠肺炎的临床诊断、传染病流行与控制再到新冠疫情的防控、新冠疫苗的研发进展，向我们详细介绍了如何科学有效的开展防疫工作。为个人与家庭、卫生行政机构、公共卫生机构以及各级医疗单位提供了科学防疫的依据。', 1, 0, 10002, '1608294630164-81A197497BD622E38D77096BDE143D6B (1).jpg', 0, 0, 0, 0, 0, 0, '2020-12-18 21:01:03');
INSERT INTO `questions` VALUES (29, '电气工程基础（上）', '本课程作为电气工程及其自动化专业的大类专业基础平台课程，源于武汉大学电气学院所承担的教育部“电气信息类专业人才培养方案和课程体系及教学内容改革的研究与实践”教改课题（2002年获国家教学成果二等奖）所提出的电气信息类专业整合、构建专业大平台课程、探索电气工程学科人才培养新模式的研究成果。本课程的设立依托教育部教学改革项目的研究成果，打破了当时传统专业教研室教学与学科不交叉的两种壁垒，率先在国内开展了学科平台课程整合研究。课程组对电气工程基础课程内容和教学方式进行了深入研究，并以研究成果为基础，开展了多年的教学工作。本课程立足“新工科”，结合多年的教学成果和经验，将大类专业基础平台课程的特点定位于支持宽口径、大专业的人才培养要求，将电气工程与自动化五个专业方向所要求学生掌握的基础知识进行了有机整合。通过学习，能够有效提升同学们电气工程学科基础知识，了解行业前沿动态，为进一步深造打下坚实基础。', 1, 0, 10002, '1609303432687-EB06193720C75163DC8D42F51F4022AF.jpg', 0, 0, 0, 0, 0, 0, '2020-12-30 12:45:02');

-- ----------------------------
-- Table structure for root
-- ----------------------------
DROP TABLE IF EXISTS `root`;
CREATE TABLE `root`  (
  `rid` int(0) NOT NULL AUTO_INCREMENT COMMENT '权限id',
  `rname` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '权限描述',
  PRIMARY KEY (`rid`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of root
-- ----------------------------
INSERT INTO `root` VALUES (1, '教师');
INSERT INTO `root` VALUES (2, '学员');

-- ----------------------------
-- Table structure for timu
-- ----------------------------
DROP TABLE IF EXISTS `timu`;
CREATE TABLE `timu`  (
  `tid` int(0) NOT NULL AUTO_INCREMENT COMMENT '题目id，主键',
  `quesid` int(0) NOT NULL COMMENT '题库id，外键',
  `tname` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '题目名称',
  `description` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '题目解析',
  `tnum` int(0) NOT NULL COMMENT '题目选项数量（0为简单题，2~8为选择题）',
  `res` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '题目答案',
  `options` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '题目选项（只有选择题才有值）',
  PRIMARY KEY (`tid`) USING BTREE,
  INDEX `quesid`(`quesid`) USING BTREE,
  CONSTRAINT `quesid` FOREIGN KEY (`quesid`) REFERENCES `questions` (`qid`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 15 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of timu
-- ----------------------------
INSERT INTO `timu` VALUES (1, 19, '选择题1', '', 2, '选项2，正确', '选项1，错误&&选项2，正确');
INSERT INTO `timu` VALUES (2, 19, '选择题2', '没有为什么', 3, '选项3，正确', '选项1，错误&&选项2，错误&&选项3，正确');
INSERT INTO `timu` VALUES (3, 19, '选择题3', '都告诉你答案了，猪头', 4, '选项1，正确&&选项2，正确', '选项1，正确&&选项2，正确&&选项3，错误&&选项4，错误');
INSERT INTO `timu` VALUES (5, 19, '简答题2', '因为所以，科学道理，天文地理，懒得理你。', 0, '哈哈哈哈哈', '');
INSERT INTO `timu` VALUES (7, 29, '单选题1', '', 2, '正确', '正确&&错误');
INSERT INTO `timu` VALUES (8, 29, '多选题1', '答案都告诉你了总不能错吧', 4, '正确&&正确', '正确&&正确&&错误&&错误');
INSERT INTO `timu` VALUES (11, 19, '阿萨德', '设置了的房间', 0, '哦乌尔', '');
INSERT INTO `timu` VALUES (12, 19, '福哦按额发', '世纪东方', 0, '手打了附近', '');
INSERT INTO `timu` VALUES (13, 19, '你是猪吗', '你是准的蠢吗？？', 2, '不是', '是&&不是');
INSERT INTO `timu` VALUES (15, 19, '1 + 1 = ？', '哈哈哈', 2, '2', '2&&3');

-- ----------------------------
-- Table structure for user
-- ----------------------------
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user`  (
  `uid` int(0) NOT NULL AUTO_INCREMENT COMMENT '用户的id，主键',
  `sname` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '院校的名称',
  `nickname` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '昵称',
  `sex` int(0) NOT NULL COMMENT '性别，0是男1是女',
  `birthday` datetime(0) NOT NULL COMMENT '生日',
  `signature` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '个性签名',
  `avatar` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL COMMENT '头像',
  `phone` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '注册时手机号',
  `fans` int(0) NOT NULL DEFAULT 0 COMMENT '粉丝数量',
  `foucs` int(0) NOT NULL DEFAULT 0 COMMENT '关注人数',
  `zan` int(0) NOT NULL DEFAULT 0 COMMENT '点赞数量',
  `password` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '密码',
  `rid` int(0) NOT NULL COMMENT '权限id，外键',
  PRIMARY KEY (`uid`) USING BTREE,
  INDEX `rid`(`rid`) USING BTREE,
  CONSTRAINT `rid` FOREIGN KEY (`rid`) REFERENCES `root` (`rid`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of user
-- ----------------------------
INSERT INTO `user` VALUES (10000, '湖南信息学院', '大树', 0, '1999-08-30 00:00:00', '你的坚持总有一天会反过来拥抱你。。。', 'redbook.png', '15073382436', 0, 0, 0, '111111', 2);
INSERT INTO `user` VALUES (10001, '湖南信息学院', '周佳怡', 1, '2001-10-30 00:00:00', '啦啦啦啦好美味！', 'redbook.png', '13700000000', 0, 0, 0, '111111', 2);
INSERT INTO `user` VALUES (10002, '湖南信息学院', '张三', 0, '1981-07-07 00:00:00', '的方式了估计打算了会计法懂我。', '1607680793683-def-avatar.png', '13800000000', 0, 0, 0, '111111', 1);
INSERT INTO `user` VALUES (10003, '复旦大学', '李四', 0, '1973-06-22 00:00:00', NULL, 'redbook.png', '13800000001', 0, 0, 0, '111111', 1);
INSERT INTO `user` VALUES (10004, '北京大学', '王五', 0, '1994-07-19 00:00:00', NULL, 'def-avatar.png', '13800000002', 0, 0, 0, '111111', 2);
INSERT INTO `user` VALUES (10005, '清华大学', '老六', 0, '1978-06-09 00:00:00', '沙拉酱的广佛安慰积分次额挖掘GV阿斯顿发送到风味鸡撒旦教佛啊飞机费阿萨iSee附近啊阿斯顿几覅飞过就答复拉空的积分啊', 'def-avatar.png', '13800000003', 0, 0, 0, '111111', 1);
INSERT INTO `user` VALUES (10006, '中国人民大学', '王麻子', 0, '1997-09-09 00:00:00', NULL, 'redbook.png', '13800000004', 0, 0, 0, '111111', 2);
INSERT INTO `user` VALUES (10007, '中央戏剧学院', 'jack', 1, '2000-11-23 00:00:00', '冲冲冲', 'def-avatar.png', '15073382435', 0, 0, 0, '111111', 2);

SET FOREIGN_KEY_CHECKS = 1;
