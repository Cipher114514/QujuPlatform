# 第一次迭代 API 文档

## 一、基础信息

| 项目 | 说明 |
| ---- | ---- |
| 版本 | v0.1.0 |
| 迭代范围 | 第3-5天（6月29日-7月1日） |
| 基础URL | `/api/v1` |
| 认证方式 | JWT Token |

## 二、认证规范

### 2.1 Token格式

所有需要认证的接口，请求头需携带：

```
Authorization: Bearer <token>
```

### 2.2 响应格式

#### 成功响应

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

#### 失败响应

```json
{
  "code": 400,
  "message": "错误信息",
  "data": null
}
```

## 三、接口列表

### 3.1 用户注册与登录模块

#### 3.1.1 个人用户注册

- **路径**：`/auth/register`
- **方法**：POST
- **描述**：个人用户注册账号

**请求体**：

| 字段 | 类型 | 必填 | 说明 |
| ---- | ---- | ---- | ---- |
| email | string | 是 | 邮箱地址 |
| password | string | 是 | 密码（至少8位，包含字母和数字） |
| nickname | string | 是 | 用户昵称 |
| phone | string | 否 | 手机号 |

**成功响应**：

```json
{
  "code": 200,
  "message": "注册成功",
  "data": {
    "id": 1,
    "email": "user@example.com",
    "nickname": "用户昵称",
    "role": "user",
    "status": "active"
  }
}
```

**失败响应**：

```json
{
  "code": 400,
  "message": "该邮箱已被注册",
  "data": null
}
```

#### 3.1.2 商家用户注册

- **路径**：`/auth/register`
- **方法**：POST
- **描述**：商家用户注册账号

**请求体**：

| 字段 | 类型 | 必填 | 说明 |
| ---- | ---- | ---- | ---- |
| email | string | 是 | 邮箱地址 |
| password | string | 是 | 密码（至少8位，包含字母和数字） |
| nickname | string | 是 | 商家名称 |
| phone | string | 是 | 联系电话 |
| businessLicense | string | 是 | 营业执照图片URL或Base64 |
| address | string | 是 | 商家地址 |

**成功响应**：

```json
{
  "code": 200,
  "message": "注册成功，等待审核",
  "data": {
    "id": 2,
    "email": "business@example.com",
    "nickname": "商家名称",
    "role": "business",
    "status": "pending"
  }
}
```

#### 3.1.3 用户登录

- **路径**：`/auth/login`
- **方法**：POST
- **描述**：用户登录获取Token

**请求体**：

| 字段 | 类型 | 必填 | 说明 |
| ---- | ---- | ---- | ---- |
| email | string | 是 | 邮箱地址 |
| password | string | 是 | 密码 |
| rememberMe | boolean | 否 | 是否记住登录 |

**成功响应**：

```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "nickname": "用户昵称",
      "role": "user",
      "status": "active"
    }
  }
}
```

**失败响应**：

```json
{
  "code": 401,
  "message": "邮箱或密码错误",
  "data": null
}
```

### 3.2 个人资料管理模块

#### 3.2.1 获取个人资料

- **路径**：`/users/me`
- **方法**：GET
- **描述**：获取当前登录用户的个人资料

**成功响应**：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "email": "user@example.com",
    "nickname": "用户昵称",
    "phone": "13800138000",
    "avatar": "https://example.com/avatar.jpg",
    "bio": "个人简介",
    "role": "user",
    "status": "active",
    "createdAt": "2026-06-29T08:00:00Z"
  }
}
```

#### 3.2.2 修改个人资料

- **路径**：`/users/me`
- **方法**：PUT
- **描述**：修改个人用户资料

**请求体**：

| 字段 | 类型 | 必填 | 说明 |
| ---- | ---- | ---- | ---- |
| nickname | string | 否 | 用户昵称 |
| phone | string | 否 | 手机号 |
| avatar | string | 否 | 头像URL |
| bio | string | 否 | 个人简介 |

**成功响应**：

```json
{
  "code": 200,
  "message": "更新成功",
  "data": {
    "id": 1,
    "nickname": "新昵称",
    "phone": "13900139000",
    "avatar": "https://example.com/new-avatar.jpg",
    "bio": "新简介"
  }
}
```

#### 3.2.3 修改商家资料

- **路径**：`/users/me/business`
- **方法**：PUT
- **描述**：修改商家用户资料

**请求体**：

| 字段 | 类型 | 必填 | 说明 |
| ---- | ---- | ---- | ---- |
| nickname | string | 否 | 商家名称 |
| phone | string | 否 | 联系电话 |
| address | string | 否 | 商家地址 |
| businessLicense | string | 否 | 营业执照图片 |
| description | string | 否 | 商家描述 |

**成功响应**：

```json
{
  "code": 200,
  "message": "更新成功",
  "data": {
    "id": 2,
    "nickname": "新商家名称",
    "phone": "13900139000",
    "address": "新地址",
    "description": "新描述"
  }
}
```

### 3.3 活动创建模块

#### 3.3.1 创建活动

- **路径**：`/activities`
- **方法**：POST
- **描述**：手动创建活动

**请求体**：

| 字段 | 类型 | 必填 | 说明 |
| ---- | ---- | ---- | ---- |
| title | string | 是 | 活动标题 |
| description | string | 是 | 活动描述 |
| category | string | 是 | 活动分类（运动健身、户外徒步、桌游聚会等） |
| startTime | string | 是 | 开始时间（ISO格式） |
| endTime | string | 是 | 结束时间（ISO格式） |
| location | string | 是 | 活动地点（文本描述） |
| maxParticipants | number | 是 | 最大参与人数 |
| fee | number | 否 | 活动费用（默认0） |
| tags | array | 否 | 标签数组 |
| images | array | 否 | 活动图片URL数组 |

**成功响应**：

```json
{
  "code": 200,
  "message": "创建成功",
  "data": {
    "id": 1,
    "title": "活动标题",
    "description": "活动描述",
    "category": "运动健身",
    "startTime": "2026-07-08T09:00:00Z",
    "endTime": "2026-07-08T12:00:00Z",
    "location": "北京市朝阳区",
    "maxParticipants": 20,
    "fee": 0,
    "status": "pending",
    "creatorId": 2,
    "createdAt": "2026-06-29T10:00:00Z"
  }
}
```

#### 3.3.2 AI活动策划

- **路径**：`/activities/ai-generate`
- **方法**：POST
- **描述**：AI生成活动内容（迭代1简化：使用预设模板）

**请求体**：

| 字段 | 类型 | 必填 | 说明 |
| ---- | ---- | ---- | ---- |
| topic | string | 是 | 活动主题 |
| category | string | 是 | 活动分类 |

**成功响应**：

```json
{
  "code": 200,
  "message": "生成成功",
  "data": {
    "title": "生成的活动标题",
    "description": "生成的活动描述",
    "tags": ["标签1", "标签2"],
    "suggestedLocation": "建议地点"
  }
}
```

#### 3.3.3 获取活动模板

- **路径**：`/activities/templates`
- **方法**：GET
- **描述**：获取活动模板列表

**成功响应**：

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "name": "运动健身",
      "category": "sports",
      "icon": "🏃",
      "titleTemplate": "{主题}活动",
      "descriptionTemplate": "一起参与{主题}活动，锻炼身体！"
    }
  ]
}
```

#### 3.3.4 克隆活动

- **路径**：`/activities/:id/clone`
- **方法**：POST
- **描述**：克隆已有活动

**路径参数**：

| 参数 | 类型 | 说明 |
| ---- | ---- | ---- |
| id | number | 活动ID |

**成功响应**：

```json
{
  "code": 200,
  "message": "克隆成功",
  "data": {
    "id": 2,
    "title": "活动标题（克隆）",
    "description": "活动描述",
    "status": "pending"
  }
}
```

### 3.4 活动发现模块

#### 3.4.1 获取活动列表

- **路径**：`/activities`
- **方法**：GET
- **描述**：获取活动信息流

**查询参数**：

| 参数 | 类型 | 必填 | 说明 |
| ---- | ---- | ---- | ---- |
| page | number | 否 | 页码（默认1） |
| size | number | 否 | 每页数量（默认10） |
| category | string | 否 | 活动分类筛选 |
| sort | string | 否 | 排序方式（最新：latest，热门：popular） |

**成功响应**：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "title": "活动标题",
        "description": "活动描述",
        "category": "运动健身",
        "startTime": "2026-07-08T09:00:00Z",
        "location": "北京市朝阳区",
        "maxParticipants": 20,
        "currentParticipants": 5,
        "fee": 0,
        "status": "active",
        "coverImage": "https://example.com/cover.jpg",
        "creator": {
          "id": 2,
          "nickname": "商家名称",
          "avatar": "https://example.com/avatar.jpg"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "size": 10,
      "total": 100,
      "pages": 10
    }
  }
}
```

#### 3.4.2 搜索活动

- **路径**：`/activities/search`
- **方法**：GET
- **描述**：搜索活动

**查询参数**：

| 参数 | 类型 | 必填 | 说明 |
| ---- | ---- | ---- | ---- |
| keyword | string | 是 | 搜索关键词 |
| page | number | 否 | 页码（默认1） |
| size | number | 否 | 每页数量（默认10） |

**成功响应**：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [],
    "pagination": {}
  }
}
```

#### 3.4.3 获取活动详情

- **路径**：`/activities/:id`
- **方法**：GET
- **描述**：获取活动详情

**路径参数**：

| 参数 | 类型 | 说明 |
| ---- | ---- | ---- |
| id | number | 活动ID |

**成功响应**：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "title": "活动标题",
    "description": "活动描述",
    "category": "运动健身",
    "startTime": "2026-07-08T09:00:00Z",
    "endTime": "2026-07-08T12:00:00Z",
    "location": "北京市朝阳区",
    "maxParticipants": 20,
    "currentParticipants": 5,
    "fee": 0,
    "status": "active",
    "tags": ["标签1", "标签2"],
    "images": ["https://example.com/image1.jpg"],
    "creator": {
      "id": 2,
      "nickname": "商家名称",
      "avatar": "https://example.com/avatar.jpg"
    },
    "myRegistration": null,
    "createdAt": "2026-06-29T10:00:00Z"
  }
}
```

### 3.5 活动报名模块

#### 3.5.1 报名参加活动

- **路径**：`/activities/:id/register`
- **方法**：POST
- **描述**：报名参加活动

**路径参数**：

| 参数 | 类型 | 说明 |
| ---- | ---- | ---- |
| id | number | 活动ID |

**请求体**：

| 字段 | 类型 | 必填 | 说明 |
| ---- | ---- | ---- | ---- |
| participants | number | 否 | 参与人数（默认1） |

**成功响应**：

```json
{
  "code": 200,
  "message": "报名成功",
  "data": {
    "id": 1,
    "activityId": 1,
    "userId": 1,
    "status": "confirmed",
    "participants": 1,
    "registeredAt": "2026-06-29T11:00:00Z"
  }
}
```

**失败响应（已满员）**：

```json
{
  "code": 400,
  "message": "活动已满员",
  "data": null
}
```

#### 3.5.2 取消报名

- **路径**：`/activities/:id/register`
- **方法**：DELETE
- **描述**：取消活动报名

**路径参数**：

| 参数 | 类型 | 说明 |
| ---- | ---- | ---- |
| id | number | 活动ID |

**成功响应**：

```json
{
  "code": 200,
  "message": "取消报名成功",
  "data": null
}
```

#### 3.5.3 获取报名记录

- **路径**：`/activities/:id/registrations`
- **方法**：GET
- **描述**：获取活动报名记录（活动创建者查看）

**路径参数**：

| 参数 | 类型 | 说明 |
| ---- | ---- | ---- |
| id | number | 活动ID |

**成功响应**：

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "userId": 1,
      "user": {
        "nickname": "用户昵称",
        "avatar": "https://example.com/avatar.jpg"
      },
      "status": "confirmed",
      "participants": 1,
      "registeredAt": "2026-06-29T11:00:00Z"
    }
  ]
}
```

#### 3.5.4 获取我的报名列表

- **路径**：`/users/me/registrations`
- **方法**：GET
- **描述**：获取当前用户的报名列表

**查询参数**：

| 参数 | 类型 | 必填 | 说明 |
| ---- | ---- | ---- | ---- |
| status | string | 否 | 状态筛选（confirmed/pending/cancelled/waiting） |

**成功响应**：

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "activity": {
        "id": 1,
        "title": "活动标题",
        "startTime": "2026-07-08T09:00:00Z",
        "location": "北京市朝阳区"
      },
      "status": "confirmed",
      "participants": 1,
      "registeredAt": "2026-06-29T11:00:00Z"
    }
  ]
}
```

#### 3.5.5 加入等待队列

- **路径**：`/activities/:id/waitlist`
- **方法**：POST
- **描述**：活动已满员时加入等待队列

**路径参数**：

| 参数 | 类型 | 说明 |
| ---- | ---- | ---- |
| id | number | 活动ID |

**成功响应**：

```json
{
  "code": 200,
  "message": "已加入等待队列",
  "data": {
    "id": 1,
    "activityId": 1,
    "userId": 1,
    "status": "waiting",
    "queuePosition": 1,
    "joinedAt": "2026-06-29T11:30:00Z"
  }
}
```

#### 3.5.6 获取等待队列

- **路径**：`/activities/:id/waitlist`
- **方法**：GET
- **描述**：获取活动等待队列（活动创建者查看）

**路径参数**：

| 参数 | 类型 | 说明 |
| ---- | ---- | ---- |
| id | number | 活动ID |

**成功响应**：

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "userId": 1,
      "user": {
        "nickname": "用户昵称",
        "avatar": "https://example.com/avatar.jpg"
      },
      "queuePosition": 1,
      "joinedAt": "2026-06-29T11:30:00Z"
    }
  ]
}
```

#### 3.5.7 退出等待队列

- **路径**：`/activities/:id/waitlist`
- **方法**：DELETE
- **描述**：退出等待队列

**路径参数**：

| 参数 | 类型 | 说明 |
| ---- | ---- | ---- |
| id | number | 活动ID |

**成功响应**：

```json
{
  "code": 200,
  "message": "已退出等待队列",
  "data": null
}
```

### 3.6 好友管理模块

#### 3.6.1 添加好友

- **路径**：`/friends`
- **方法**：POST
- **描述**：发送好友请求

**请求体**：

| 字段 | 类型 | 必填 | 说明 |
| ---- | ---- | ---- | ---- |
| userId | number | 是 | 目标用户ID |

**成功响应**：

```json
{
  "code": 200,
  "message": "好友请求已发送",
  "data": {
    "id": 1,
    "fromUserId": 1,
    "toUserId": 2,
    "status": "pending",
    "createdAt": "2026-06-29T12:00:00Z"
  }
}
```

#### 3.6.2 处理好友请求

- **路径**：`/friends/:id`
- **方法**：PUT
- **描述**：接受或拒绝好友请求

**路径参数**：

| 参数 | 类型 | 说明 |
| ---- | ---- | ---- |
| id | number | 好友请求ID |

**请求体**：

| 字段 | 类型 | 必填 | 说明 |
| ---- | ---- | ---- | ---- |
| status | string | 是 | 处理结果（accept/reject） |

**成功响应**：

```json
{
  "code": 200,
  "message": "处理成功",
  "data": {
    "id": 1,
    "status": "accepted"
  }
}
```

#### 3.6.3 获取好友列表

- **路径**：`/friends`
- **方法**：GET
- **描述**：获取好友列表

**成功响应**：

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 2,
      "nickname": "好友昵称",
      "avatar": "https://example.com/avatar.jpg",
      "status": "online",
      "friendSince": "2026-06-29T12:00:00Z"
    }
  ]
}
```

#### 3.6.4 删除好友

- **路径**：`/friends/:userId`
- **方法**：DELETE
- **描述**：删除好友

**路径参数**：

| 参数 | 类型 | 说明 |
| ---- | ---- | ---- |
| userId | number | 好友用户ID |

**成功响应**：

```json
{
  "code": 200,
  "message": "删除成功",
  "data": null
}
```

#### 3.6.5 关注用户

- **路径**：`/follow`
- **方法**：POST
- **描述**：关注用户

**请求体**：

| 字段 | 类型 | 必填 | 说明 |
| ---- | ---- | ---- | ---- |
| userId | number | 是 | 目标用户ID |

**成功响应**：

```json
{
  "code": 200,
  "message": "关注成功",
  "data": {
    "id": 1,
    "followerId": 1,
    "followingId": 2,
    "createdAt": "2026-06-29T13:00:00Z"
  }
}
```

#### 3.6.6 取消关注

- **路径**：`/follow/:userId`
- **方法**：DELETE
- **描述**：取消关注

**路径参数**：

| 参数 | 类型 | 说明 |
| ---- | ---- | ---- |
| userId | number | 目标用户ID |

**成功响应**：

```json
{
  "code": 200,
  "message": "取消关注成功",
  "data": null
}
```

### 3.7 即时通讯模块

#### 3.7.1 获取会话列表

- **路径**：`/messages/conversations`
- **方法**：GET
- **描述**：获取消息会话列表

**成功响应**：

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "conversationId": 1,
      "targetUser": {
        "id": 2,
        "nickname": "好友昵称",
        "avatar": "https://example.com/avatar.jpg",
        "status": "online"
      },
      "lastMessage": "最后一条消息内容",
      "unreadCount": 2,
      "updatedAt": "2026-06-29T14:00:00Z"
    }
  ]
}
```

#### 3.7.2 获取消息列表

- **路径**：`/messages/conversations/:conversationId`
- **方法**：GET
- **描述**：获取会话消息列表

**路径参数**：

| 参数 | 类型 | 说明 |
| ---- | ---- | ---- |
| conversationId | number | 会话ID |

**查询参数**：

| 参数 | 类型 | 必填 | 说明 |
| ---- | ---- | ---- | ---- |
| page | number | 否 | 页码（默认1） |
| size | number | 否 | 每页数量（默认20） |

**成功响应**：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "senderId": 1,
        "content": "消息内容",
        "status": "read",
        "sentAt": "2026-06-29T14:00:00Z"
      }
    ],
    "pagination": {}
  }
}
```

#### 3.7.3 发送消息

- **路径**：`/messages`
- **方法**：POST
- **描述**：发送消息

**请求体**：

| 字段 | 类型 | 必填 | 说明 |
| ---- | ---- | ---- | ---- |
| targetUserId | number | 是 | 目标用户ID |
| content | string | 是 | 消息内容（文本） |

**成功响应**：

```json
{
  "code": 200,
  "message": "发送成功",
  "data": {
    "id": 1,
    "senderId": 1,
    "targetUserId": 2,
    "content": "消息内容",
    "status": "delivered",
    "sentAt": "2026-06-29T14:00:00Z"
  }
}
```

#### 3.7.4 标记消息已读

- **路径**：`/messages/conversations/:conversationId/read`
- **方法**：PUT
- **描述**：标记会话消息已读

**路径参数**：

| 参数 | 类型 | 说明 |
| ---- | ---- | ---- |
| conversationId | number | 会话ID |

**成功响应**：

```json
{
  "code": 200,
  "message": "标记已读成功",
  "data": null
}
```

### 3.8 文件上传模块

#### 3.8.1 上传文件

- **路径**：`/upload`
- **方法**：POST
- **描述**：上传文件（支持头像、营业执照、活动图片等）

**请求体**（multipart/form-data）：

| 字段 | 类型 | 必填 | 说明 |
| ---- | ---- | ---- | ---- |
| file | File | 是 | 文件 |
| type | string | 是 | 文件类型（avatar/business_license/activity/image） |

**成功响应**：

```json
{
  "code": 200,
  "message": "上传成功",
  "data": {
    "id": 1,
    "url": "https://example.com/upload/1.jpg",
    "filename": "avatar.jpg",
    "size": 102400,
    "type": "avatar",
    "uploadedAt": "2026-06-29T15:00:00Z"
  }
}
```

### 3.9 WebSocket协议

#### 3.9.1 连接地址

```
ws://localhost:8080/ws?token=<JWT_TOKEN>
```

#### 3.9.2 消息格式

**客户端发送消息**：

```json
{
  "type": "send_message",
  "payload": {
    "targetUserId": 2,
    "content": "消息内容"
  }
}
```

**服务端推送消息**：

```json
{
  "type": "receive_message",
  "payload": {
    "id": 1,
    "senderId": 2,
    "sender": {
      "nickname": "发送者昵称",
      "avatar": "https://example.com/avatar.jpg"
    },
    "content": "消息内容",
    "sentAt": "2026-06-29T15:30:00Z"
  }
}
```

#### 3.9.3 消息类型

| 类型 | 说明 |
| ---- | ---- |
| send_message | 发送消息 |
| receive_message | 收到消息 |
| message_status | 消息状态变更 |
| conversation_update | 会话更新 |
| heartbeat | 心跳检测 |

#### 3.9.4 心跳机制

- 客户端每30秒发送心跳消息
- 服务端收到后立即回复
- 超过90秒未收到心跳，服务端主动断开连接

**心跳消息**：

```json
{
  "type": "heartbeat",
  "payload": {
    "timestamp": 1687989000000
  }
}
```

## 四、错误码

| 错误码 | 说明 |
| ------ | ---- |
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权/Token无效 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |