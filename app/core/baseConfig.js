// 一些基本配置项

// 默认头像
const avatarDefault = "/static/avatar/default.jpeg";

// 管理员
const admin = {
  username: "admin",
  userId: "000001",
};

// 公共群聊
const groupPublic = {
  groupName: "默认群聊",
  groupId: "g000001",
  msg: "Hello",
};

// 群聊储存字段
const storeMsgKey = ["msgType", "msg", "msgId", "fromUsername", "fromUserId", "createTime"];

// 获取群聊名称
const getGroupName = (groupName, members) => {
  if (groupName) return groupName;
  if (members.length < 4) return members.map(item => item.username).join("、");
  return `${members.slice(0, 3).map(item => item.username).join("、")}...`;
};

// 获取好友请求状态值对应文本
const getFriendStatusText = (friendStatus) => {
  let map = new Map();
  map.set("0", "未添加");
  map.set("1", "已添加");
  map.set("2", "待对方确认");
  map.set("3", "待您确认");
  map.set("4", "已拒绝");
  return map.get(friendStatus);
};

// 创建单聊ID
const createSingleId = (fromUserId, toUserId) => {
  return `${Math.min(fromUserId, toUserId)}${Math.max(fromUserId, toUserId)}`;
};

// 创建消息ID
const createMsgId = (randomLen = 4) => {
  return `${new Date().getTime()}${Math.floor(Math.random() * Math.pow(10, randomLen))}`;
};

module.exports = {
  avatarDefault,
  admin,
  groupPublic,
  storeMsgKey,
  getGroupName,
  getFriendStatusText,
  createSingleId,
  createMsgId,
};
