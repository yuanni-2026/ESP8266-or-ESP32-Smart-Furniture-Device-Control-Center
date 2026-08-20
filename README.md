# 智能家具 IoT 设备管理平台

> 基于 **Docker + MongoDB + Python Flask** 的 ESP8266/ESP32 智能家具设备增删改查（CRUD）管理系统，具有科技感深色主题 Web 界面。

---

## 📋 目录

- [项目简介](#项目简介)
- [效果预览](#效果预览)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [环境要求](#环境要求)
- [快速开始](#快速开始)
  - [1. 启动 Docker MongoDB](#1-启动-docker-mongodb)
  - [2. 初始化数据库和示例数据](#2-初始化数据库和示例数据)
  - [3. 安装 Python 依赖](#3-安装-python-依赖)
  - [4. 启动应用](#4-启动应用)
- [API 接口文档](#api-接口文档)
- [代码详解](#代码详解)
  - [后端 app.py](#后端-apppy)
  - [前端页面](#前端页面)
- [数据库设计](#数据库设计)
- [Docker MongoDB 常用管理命令](#docker-mongodb-常用管理命令)
- [Mongo Express 可视化管理工具](#mongo-express-可视化管理工具)
- [常见问题](#常见问题)

---

## 项目简介

本项目是一个面向**家庭智能家具场景**的 IoT 设备管理平台，用于管理部署在各类智能家具（升降桌、衣柜、沙发、智能床、鞋柜等）中的 ESP8266 / ESP32 模组设备。

系统提供完整的 **增删改查（CRUD）** 功能，所有数据实际存储在 **Docker 容器中运行的 MongoDB** 数据库里。前端采用深色科技感风格，支持设备卡片展示、实时搜索、在线/离线状态监控等。

### 核心功能

| 功能 | 说明 |
|------|------|
| 📋 **设备列表** | 卡片式展示所有智能家具设备，含芯片型号、房间、IP、固件等信息 |
| ➕ **新增设备** | 通过表单添加新的 ESP8266/ESP32 设备，支持功能特性标签 |
| ✏️ **编辑设备** | 修改设备名称、状态、固件、功能等信息（device_id 不可修改） |
| 🗑️ **删除设备** | 按 device_id 删除设备，带二次确认 |
| 🔍 **实时搜索** | 支持按设备ID、名称、芯片、房间、家具类型多字段模糊搜索 |
| 📊 **统计面板** | 实时显示设备总数、在线/离线数量、覆盖房间数 |
| 🟢 **健康检查** | 自动检测 MongoDB 连接状态 |
| 🎨 **多主题切换** | 10套主题（5深色+5浅色）一键切换，localStorage 持久化记忆 |

---

## 效果预览

### 用户端控制中心

浅色主题（简约白）下的设备管理界面，顶部支持10套主题一键切换，包含统计面板、设备卡片、搜索、新增/编辑/删除等完整功能。

![用户端控制中心](Res/01-用户端控制中心.png)

### MongoDB 数据可视化（Mongo Express）

通过 Mongo Express 网页端直接查看和操作 Docker 中 MongoDB 的 `smart_home` 数据库 `devices` 集合，支持文档的增删改查、索引管理、条件查询等。

![MongoDB数据查看](Res/02-mongdb数据查看.png)

---

## 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| **数据库** | MongoDB（Docker 容器） | 7.0 |
| **容器化** | Docker | 29.x |
| **后端框架** | Flask | 3.0.3 |
| **数据库驱动** | PyMongo | 4.8.0 |
| **前端** | 原生 HTML5 + CSS3 + JavaScript（ES6+） | - |
| **运行环境** | Python | 3.13 |

---

## 项目结构

```
mongodb-docker/
├── README.md              # 项目说明文档（本文件）
├── requirements.txt       # Python 依赖清单
├── app.py                 # Flask 后端主程序（CRUD API）
├── templates/
│   └── index.html         # 前端页面模板（科技感设备管理界面）
└── static/
    ├── css/
    │   └── style.css      # 科技感深色主题样式
    └── js/
        └── app.js         # 前端交互逻辑（CRUD 操作、搜索、渲染）
```

---

## 环境要求

- **操作系统**：macOS / Linux / Windows
- **Docker**：已安装并启动（Docker Desktop 或 Docker Engine）
- **Python**：3.8 及以上（推荐 3.10+）
- **pip**：Python 包管理器
- **端口**：27017（MongoDB）、5001（Web 应用，可修改）

---

## 快速开始

### 1. 启动 Docker MongoDB

#### 方式一：使用 docker run 命令（推荐）

```bash
# 拉取 MongoDB 7.0 镜像
docker pull mongo:7.0

# 启动 MongoDB 容器
docker run -d \
  --name mongodb \
  --restart unless-stopped \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=admin123 \
  -v mongodb_data:/data/db \
  mongo:7.0
```

**参数说明：**

| 参数 | 说明 |
|------|------|
| `--name mongodb` | 容器名称 |
| `--restart unless-stopped` | 开机自动重启 |
| `-p 27017:27017` | 端口映射（主机:容器） |
| `-e MONGO_INITDB_ROOT_USERNAME=admin` | 管理员用户名 |
| `-e MONGO_INITDB_ROOT_PASSWORD=admin123` | 管理员密码 |
| `-v mongodb_data:/data/db` | 数据卷持久化（容器删除后数据不丢失） |

#### 方式二：使用 docker-compose（可选）

创建 `docker-compose.yml`：

```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:7.0
    container_name: mongodb
    restart: unless-stopped
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: admin123
    volumes:
      - mongodb_data:/data/db

volumes:
  mongodb_data:
```

启动：
```bash
docker-compose up -d
```

#### 验证 MongoDB 运行状态

```bash
docker ps --filter name=mongodb
# 应看到 STATUS 为 Up
```

---

### 2. 初始化数据库和示例数据

进入 MongoDB 容器的 mongosh 交互终端，创建应用专用数据库和用户，并插入示例数据：

```bash
docker exec -it mongodb mongosh -u admin -p admin123 --authenticationDatabase admin
```

在 mongosh 中执行以下脚本：

```javascript
// 切换到 smart_home 数据库
use smart_home;

// 创建应用专用用户（只读读写权限）
db.createUser({
  user: "smarthome",
  pwd: "smart123",
  roles: [{ role: "readWrite", db: "smart_home" }]
});

// 插入示例设备数据
db.devices.insertMany([
  {
    device_id: "ESP32-001",
    name: "智能升降桌控制器",
    chip: "ESP32-S3",
    room: "书房",
    furniture_type: "升降桌",
    status: "online",
    ip: "192.168.1.101",
    firmware: "v2.1.0",
    features: ["高度调节", "久坐提醒", "蓝牙联动"],
    created_at: new Date("2026-01-15T10:00:00Z")
  },
  {
    device_id: "ESP8266-001",
    name: "智能衣柜温湿度监测",
    chip: "ESP8266-12F",
    room: "主卧",
    furniture_type: "衣柜",
    status: "online",
    ip: "192.168.1.102",
    firmware: "v1.5.3",
    features: ["温湿度监测", "除湿联动", "异常报警"],
    created_at: new Date("2026-02-20T14:30:00Z")
  },
  {
    device_id: "ESP32-002",
    name: "智能沙发按摩控制",
    chip: "ESP32-WROOM",
    room: "客厅",
    furniture_type: "沙发",
    status: "offline",
    ip: "192.168.1.103",
    firmware: "v3.0.1",
    features: ["按摩模式", "加热控制", "语音控制"],
    created_at: new Date("2026-03-10T09:15:00Z")
  }
]);

// 验证数据
db.devices.find().pretty();
```

输入 `exit` 退出 mongosh。

> **💡 一键初始化脚本**：也可以将上述脚本保存为 `.js` 文件，通过 `docker exec -i mongodb mongosh -u admin -p admin123 --authenticationDatabase admin < init.js` 一次性执行。

---

### 3. 安装 Python 依赖

```bash
# 进入项目目录
cd /path/to/mongodb-docker

# （推荐）创建虚拟环境
python3 -m venv venv
source venv/bin/activate   # macOS/Linux
# venv\Scripts\activate    # Windows

# 安装依赖
pip install -r requirements.txt
```

`requirements.txt` 内容：
```
Flask==3.0.3
pymongo==4.8.0
```

---

### 4. 启动应用

```bash
python3 app.py
```

启动成功后会看到：

```
============================================================
  智能家具设备管理系统启动中...
  MongoDB 连接: localhost:27017/smart_home
  访问地址: http://localhost:5001
============================================================
 * Running on http://127.0.0.1:5001
```

打开浏览器访问 **http://localhost:5001** 即可看到科技感设备管理界面。

#### 环境变量配置（可选）

应用支持通过环境变量自定义 MongoDB 连接参数：

| 环境变量 | 默认值 | 说明 |
|----------|--------|------|
| `MONGO_HOST` | `localhost` | MongoDB 主机地址 |
| `MONGO_PORT` | `27017` | MongoDB 端口 |
| `MONGO_USER` | `smarthome` | 数据库用户名 |
| `MONGO_PASS` | `smart123` | 数据库密码 |
| `MONGO_DB` | `smart_home` | 数据库名称 |

示例：
```bash
MONGO_HOST=192.168.1.100 MONGO_PORT=27018 python3 app.py
```

---

## API 接口文档

所有接口均基于 RESTful 风格，返回 JSON 格式数据。

### 基础信息

- **Base URL**：`http://localhost:5001`
- **Content-Type**：`application/json`

### 接口列表

#### 1. 健康检查

```
GET /api/health
```

检查 MongoDB 连接状态。

**响应示例：**
```json
{
  "status": "healthy",
  "mongodb": "connected",
  "database": "smart_home"
}
```

---

#### 2. 获取设备列表（Read - 列表）

```
GET /api/devices?keyword=搜索关键词
```

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `keyword` | string | 否 | 模糊搜索关键词（匹配 device_id/name/chip/room/furniture_type） |

**响应示例：**
```json
{
  "total": 3,
  "devices": [
    {
      "id": "6a86ab67cc325f9f854d7a08",
      "device_id": "ESP32-001",
      "name": "智能升降桌控制器",
      "chip": "ESP32-S3",
      "room": "书房",
      "furniture_type": "升降桌",
      "status": "online",
      "ip": "192.168.1.101",
      "firmware": "v2.1.0",
      "features": ["高度调节", "久坐提醒", "蓝牙联动"],
      "created_at": "2026-01-15T10:00:00"
    }
  ]
}
```

---

#### 3. 获取单个设备（Read - 详情）

```
GET /api/devices/{device_id}
```

**路径参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| `device_id` | string | 设备唯一标识（如 ESP32-001） |

**响应示例：**
```json
{
  "device": {
    "id": "6a86ab67cc325f9f854d7a08",
    "device_id": "ESP32-001",
    "name": "智能升降桌控制器",
    "chip": "ESP32-S3",
    "room": "书房",
    "furniture_type": "升降桌",
    "status": "online",
    "ip": "192.168.1.101",
    "firmware": "v2.1.0",
    "features": ["高度调节", "久坐提醒", "蓝牙联动"],
    "created_at": "2026-01-15T10:00:00"
  }
}
```

**错误响应（404）：**
```json
{
  "error": "设备不存在"
}
```

---

#### 4. 新增设备（Create）

```
POST /api/devices
```

**请求体：**

```json
{
  "device_id": "ESP32-003",
  "name": "智能床睡眠监测",
  "chip": "ESP32-S3",
  "room": "主卧",
  "furniture_type": "床",
  "status": "online",
  "ip": "192.168.1.104",
  "firmware": "v1.0.0",
  "features": ["睡眠监测", "鼾声识别", "自动调节"]
}
```

**字段说明：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `device_id` | string | ✅ | 设备唯一ID，不可重复 |
| `name` | string | ✅ | 设备名称 |
| `chip` | string | 否 | 芯片型号（默认 ESP32） |
| `room` | string | 否 | 所在房间 |
| `furniture_type` | string | 否 | 家具类型 |
| `status` | string | 否 | 状态：online/offline（默认 offline） |
| `ip` | string | 否 | 设备IP地址 |
| `firmware` | string | 否 | 固件版本（默认 v1.0.0） |
| `features` | array | 否 | 功能特性列表 |

**成功响应（201）：**
```json
{
  "message": "设备创建成功",
  "device": { ... }
}
```

**错误响应（409）：**
```json
{
  "error": "设备ID ESP32-003 已存在"
}
```

---

#### 5. 更新设备（Update）

```
PUT /api/devices/{device_id}
```

**路径参数：** `device_id` - 要更新的设备ID

**请求体（仅需传入要修改的字段）：**

```json
{
  "name": "智能床睡眠监测-升级版",
  "status": "offline",
  "firmware": "v2.0.0",
  "features": ["睡眠监测", "鼾声识别", "自动调节", "心率监测"]
}
```

> **注意**：`device_id` 和 `created_at` 不可修改。

**成功响应：**
```json
{
  "message": "设备更新成功",
  "device": { ... }
}
```

---

#### 6. 删除设备（Delete）

```
DELETE /api/devices/{device_id}
```

**路径参数：** `device_id` - 要删除的设备ID

**成功响应：**
```json
{
  "message": "设备 ESP32-003 删除成功"
}
```

**错误响应（404）：**
```json
{
  "error": "设备不存在"
}
```

---

### curl 测试示例

```bash
# 健康检查
curl http://localhost:5001/api/health

# 获取所有设备
curl http://localhost:5001/api/devices

# 搜索设备
curl "http://localhost:5001/api/devices?keyword=ESP32"

# 获取单个设备
curl http://localhost:5001/api/devices/ESP32-001

# 新增设备
curl -X POST http://localhost:5001/api/devices \
  -H "Content-Type: application/json" \
  -d '{"device_id":"ESP32-003","name":"智能鞋柜","chip":"ESP32-C3","room":"玄关","furniture_type":"鞋柜","status":"online","ip":"192.168.1.105","firmware":"v1.0.0","features":["除臭杀菌","温湿度显示"]}'

# 更新设备
curl -X PUT http://localhost:5001/api/devices/ESP32-003 \
  -H "Content-Type: application/json" \
  -d '{"status":"offline","firmware":"v1.1.0"}'

# 删除设备
curl -X DELETE http://localhost:5001/api/devices/ESP32-003
```

---

## 代码详解

### 后端 app.py

#### 1. MongoDB 连接

```python
from pymongo import MongoClient

MONGO_URI = f"mongodb://{MONGO_USER}:{MONGO_PASS}@{MONGO_HOST}:{MONGO_PORT}/{MONGO_DB}?authSource={MONGO_DB}"
client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
db = client[MONGO_DB]
devices_collection = db["devices"]
```

- 使用 **PyMongo** 驱动连接 Docker 中的 MongoDB
- `authSource=smart_home` 指定认证数据库为应用库
- `serverSelectionTimeoutMS=5000` 设置 5 秒连接超时，避免长时间阻塞

#### 2. 数据序列化工具

```python
def device_to_dict(device):
    """将 MongoDB 文档转换为可 JSON 序列化的字典"""
    return {
        "id": str(device["_id"]),           # ObjectId 转字符串
        "device_id": device.get("device_id", ""),
        # ... 其他字段
        "created_at": device.get("created_at").isoformat(),  # datetime 转 ISO 字符串
    }
```

- MongoDB 的 `_id` 是 `ObjectId` 类型，需转为字符串才能 JSON 序列化
- `datetime` 类型需转为 ISO 格式字符串
- 使用 `.get()` 提供默认值，避免字段缺失时报错

#### 3. CRUD 路由实现

| 操作 | HTTP 方法 | 路由 | PyMongo 方法 |
|------|-----------|------|--------------|
| Create | POST | `/api/devices` | `insert_one()` |
| Read（列表） | GET | `/api/devices` | `find()` |
| Read（详情） | GET | `/api/devices/<id>` | `find_one()` |
| Update | PUT | `/api/devices/<id>` | `update_one()` + `$set` |
| Delete | DELETE | `/api/devices/<id>` | `delete_one()` |

#### 4. 多字段模糊搜索

```python
query = {
    "$or": [
        {"device_id": {"$regex": keyword, "$options": "i"}},
        {"name": {"$regex": keyword, "$options": "i"}},
        {"chip": {"$regex": keyword, "$options": "i"}},
        {"room": {"$regex": keyword, "$options": "i"}},
        {"furniture_type": {"$regex": keyword, "$options": "i"}},
    ]
}
```

- 使用 MongoDB 的 `$regex` 正则表达式实现模糊匹配
- `$options: "i"` 表示不区分大小写
- `$or` 实现多字段任一匹配

---

### 前端页面

#### 1. 科技感设计元素

| 元素 | 实现方式 |
|------|----------|
| **动态网格背景** | CSS `background-image` 线性渐变 + `animation` 位移动画 |
| **扫描线效果** | 固定定位的 2px 横线，从上到下循环移动 |
| **霓虹发光文字** | `text-shadow: 0 0 10px rgba(0,255,200,0.3)` |
| **卡片悬停效果** | `transform: translateY(-3px)` + 发光阴影 |
| **状态呼吸灯** | CSS `@keyframes pulse` 动画 |
| **数字滚动动画** | JS 分步递增实现数字变化过渡 |

#### 2. 配色方案

```css
--bg-primary: #0a0e17;      /* 深空蓝黑背景 */
--accent: #00ffc8;           /* 青绿主色调（科技感） */
--online: #00ff88;           /* 在线绿色 */
--offline: #ff4757;          /* 离线红色 */
--text-primary: #e2e8f0;     /* 主文字色 */
```

#### 3. 前端 CRUD 流程

```
用户操作 → JS 事件处理 → fetch() 调用 API → 处理响应 → 更新 DOM → Toast 提示
```

- **新增**：打开弹窗 → 填写表单 → `POST /api/devices` → 刷新列表
- **编辑**：点击编辑 → 回填表单 → `PUT /api/devices/{id}` → 刷新列表
- **删除**：点击删除 → `confirm()` 二次确认 → `DELETE /api/devices/{id}` → 刷新列表
- **搜索**：输入框 `input` 事件（防抖 300ms）→ 前端过滤渲染

---

## 数据库设计

### 数据库：`smart_home`

### 集合：`devices`

#### 文档结构

```json
{
  "_id": "ObjectId",
  "device_id": "string (唯一索引，业务主键)",
  "name": "string (设备名称)",
  "chip": "string (芯片型号)",
  "room": "string (所在房间)",
  "furniture_type": "string (家具类型)",
  "status": "string (online/offline)",
  "ip": "string (设备IP地址)",
  "firmware": "string (固件版本)",
  "features": ["string (功能特性列表)"],
  "created_at": "Date (创建时间)"
}
```

#### 字段说明

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `_id` | ObjectId | MongoDB 自动生成的主键 | `6a86ab67cc325f9f854d7a08` |
| `device_id` | string | 业务唯一标识，不可重复 | `ESP32-001` |
| `name` | string | 设备名称 | `智能升降桌控制器` |
| `chip` | string | 芯片型号 | `ESP32-S3` / `ESP8266-12F` |
| `room` | string | 部署房间 | `书房` / `客厅` / `主卧` |
| `furniture_type` | string | 家具类型 | `升降桌` / `衣柜` / `沙发` |
| `status` | string | 在线状态 | `online` / `offline` |
| `ip` | string | 局域网 IP | `192.168.1.101` |
| `firmware` | string | 固件版本号 | `v2.1.0` |
| `features` | array | 功能特性标签 | `["高度调节", "久坐提醒"]` |
| `created_at` | Date | 记录创建时间 | `ISODate("2026-01-15T10:00:00Z")` |

#### 索引建议

```javascript
// device_id 唯一索引（业务主键）
db.devices.createIndex({ "device_id": 1 }, { unique: true });

// 状态索引（快速筛选在线/离线设备）
db.devices.createIndex({ "status": 1 });

// 房间索引
db.devices.createIndex({ "room": 1 });
```

---

## Docker MongoDB 常用管理命令

```bash
# 查看容器状态
docker ps --filter name=mongodb

# 查看容器日志
docker logs mongodb

# 进入 mongosh 交互终端（管理员）
docker exec -it mongodb mongosh -u admin -p admin123 --authenticationDatabase admin

# 进入 mongosh（应用用户）
docker exec -it mongodb mongosh -u smarthome -p smart123 --authenticationDatabase smart_home

# 停止容器
docker stop mongodb

# 启动容器
docker start mongodb

# 重启容器
docker restart mongodb

# 删除容器（数据卷保留）
docker rm mongodb

# 查看数据卷
docker volume ls | grep mongodb

# 备份数据库
docker exec mongodb mongodump -u admin -p admin123 --authenticationDatabase admin -d smart_home -o /backup
docker cp mongodb:/backup ./backup

# 恢复数据库
docker cp ./backup mongodb:/backup
docker exec mongodb mongorestore -u admin -p admin123 --authenticationDatabase admin /backup
```

---

## 常见问题

### Q1: 启动应用时提示 `Address already in use` 端口被占用？

**A:** macOS 的 AirPlay Receiver 功能默认占用 5000 端口。解决方案：
- 修改 `app.py` 中的端口号（本项目已默认使用 5001）
- 或在系统设置 → 通用 → 隔空播放与接力中关闭 AirPlay Receiver

### Q2: 连接 MongoDB 提示认证失败？

**A:** 检查以下几点：
1. 确认 MongoDB 容器已启动：`docker ps`
2. 确认用户名密码正确：默认 `smarthome / smart123`
3. 确认 `authSource` 参数正确：应用用户的认证库是 `smart_home`，管理员是 `admin`
4. 确认用户已创建且有 `readWrite` 权限

### Q3: 如何修改 MongoDB 的用户名和密码？

**A:** 
1. 修改 `app.py` 中的 `MONGO_USER` / `MONGO_PASS` 环境变量默认值
2. 或在启动时通过环境变量传入：`MONGO_USER=xxx MONGO_PASS=xxx python3 app.py`
3. 在 MongoDB 中创建对应用户：
   ```javascript
   use smart_home;
   db.createUser({ user: "xxx", pwd: "xxx", roles: [{role:"readWrite", db:"smart_home"}] });
   ```

### Q4: 数据会因为容器删除而丢失吗？

**A:** 不会。本项目使用了 Docker 数据卷 `mongodb_data` 挂载到 `/data/db`，容器删除后数据卷仍然保留。重新创建容器并挂载同一数据卷即可恢复数据。

### Q5: 如何让外部网络访问 MongoDB？

**A:** 不建议直接暴露 MongoDB 到公网。如果需要局域网内其他设备访问：
1. 确保容器端口映射为 `0.0.0.0:27017:27017`（本项目已配置）
2. 配置防火墙允许 27017 端口
3. 使用强密码，避免使用默认密码

### Q6: Flask 开发服务器可以用于生产环境吗？

**A:** 不建议。Flask 内置的开发服务器单线程、性能低，仅适合开发调试。生产环境建议使用 Gunicorn + Nginx：
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5001 app:app
```

---

## Mongo Express 可视化管理工具

> **Mongo Express** 是一个基于 Web 的 MongoDB 数据库管理界面，支持数据库/集合浏览、文档增删改查、索引管理、查询过滤等功能。本项目已通过 Docker 部署，可直接在浏览器中查看和操作 MongoDB 中的数据。

### 现有 MongoDB 账号密码信息汇总

本项目 MongoDB 中配置了以下两个用户，部署 Mongo Express 和连接数据库时会用到：

| 用户名 | 密码 | 认证数据库 (authSource) | 角色权限 | 用途 |
|--------|------|------------------------|----------|------|
| `admin` | `admin123` | `admin` | `root`（超级管理员） | MongoDB 管理员，可管理所有数据库和用户 |
| `smarthome` | `smart123` | `smart_home` | `readWrite`（读写） | 应用专用用户，仅可操作 `smart_home` 数据库 |

**数据库信息：**

| 项目 | 值 |
|------|-----|
| 数据库名 | `smart_home` |
| 集合名 | `devices` |
| 容器内主机名 | `mongodb`（Docker 网络内） |
| 容器内端口 | `27017` |
| 宿主机映射端口 | `27017` |
| 宿主机访问地址 | `localhost:27017` |

**MongoDB 连接字符串：**

```bash
# 管理员连接（用于 Mongo Express）
mongodb://admin:admin123@localhost:27017/?authSource=admin

# 应用用户连接（用于 Flask app.py）
mongodb://smarthome:smart123@localhost:27017/smart_home?authSource=smart_home
```

---

### 一、部署 Mongo Express

本项目使用 Docker 自定义网络方式部署，确保 Mongo Express 容器能通过容器名 `mongodb` 访问到 MongoDB 容器。

#### 步骤 1：创建 Docker 专用网络

```bash
# 创建名为 mongo-net 的 bridge 网络（如果已存在会提示，可忽略）
docker network create mongo-net
```

#### 步骤 2：将 MongoDB 容器接入该网络

```bash
# 将已运行的 mongodb 容器连接到 mongo-net 网络
docker network connect mongo-net mongodb
```

> **说明**：MongoDB 容器原本在默认 `bridge` 网络中，连接到 `mongo-net` 后会同时存在于两个网络中，不影响原有 `localhost:27017` 的访问。

#### 步骤 3：启动 Mongo Express 容器

```bash
docker run -d \
  --name mongo-express \
  --network mongo-net \
  --restart unless-stopped \
  -p 8081:8081 \
  -e ME_CONFIG_MONGODB_SERVER=mongodb \
  -e ME_CONFIG_MONGODB_PORT=27017 \
  -e ME_CONFIG_MONGODB_ADMINUSERNAME=admin \
  -e ME_CONFIG_MONGODB_ADMINPASSWORD=admin123 \
  -e ME_CONFIG_BASICAUTH_USERNAME=admin \
  -e ME_CONFIG_BASICAUTH_PASSWORD=admin123 \
  mongo-express
```

**环境变量说明：**

| 环境变量 | 值 | 说明 |
|----------|-----|------|
| `ME_CONFIG_MONGODB_SERVER` | `mongodb` | MongoDB 主机名，使用 Docker 网络内的容器名 |
| `ME_CONFIG_MONGODB_PORT` | `27017` | MongoDB 端口 |
| `ME_CONFIG_MONGODB_ADMINUSERNAME` | `admin` | MongoDB 管理员用户名 |
| `ME_CONFIG_MONGODB_ADMINPASSWORD` | `admin123` | MongoDB 管理员密码 |
| `ME_CONFIG_BASICAUTH_USERNAME` | `admin` | Mongo Express 网页登录用户名 |
| `ME_CONFIG_BASICAUTH_PASSWORD` | `admin123` | Mongo Express 网页登录密码 |

> **⚠️ 安全提示**：以上账号密码仅用于本地开发环境。如需暴露到公网，务必修改为强密码，并考虑配置 HTTPS。

#### 步骤 4：验证部署

```bash
# 查看容器运行状态
docker ps --filter name=mongo-express

# 应看到 STATUS 为 Up，PORTS 为 0.0.0.0:8081->8081/tcp

# 测试访问（带认证，应返回 200）
curl -u admin:admin123 -o /dev/null -w "%{http_code}" http://localhost:8081/
```

---

### 二、访问 Mongo Express

#### 访问地址

```
http://localhost:8081
```

#### 登录信息

浏览器打开后会弹出基础认证（Basic Auth）窗口，输入：

| 字段 | 值 |
|------|-----|
| 用户名 | `admin` |
| 密码 | `admin123` |

也可以直接在 URL 中携带认证信息免输入：

```
http://admin:admin123@localhost:8081
```

#### 快速直达本项目数据

| 页面 | URL |
|------|-----|
| 首页（所有数据库列表） | `http://admin:admin123@localhost:8081/` |
| smart_home 数据库 | `http://admin:admin123@localhost:8081/db/smart_home` |
| devices 集合（设备数据） | `http://admin:admin123@localhost:8081/db/smart_home/devices` |

---

### 三、界面功能说明

登录后可以看到以下核心功能：

#### 1. 数据库列表（首页）

- 显示 MongoDB 实例中所有数据库
- 点击数据库名进入该数据库的集合列表
- 可创建新数据库、删除数据库

#### 2. 集合列表（数据库页面）

- 显示当前数据库下所有集合（本项目为 `devices`）
- 可创建新集合、删除集合、重命名集合

#### 3. 文档浏览（集合页面，即 `devices` 页面）

这是最常用的页面，功能包括：

| 功能 | 说明 |
|------|------|
| **📄 New Document** | 新增一条文档（对应新增设备） |
| **🔗 New Index** | 为集合创建索引 |
| **🔍 Simple 查询** | 简单模式：按字段名+值+类型进行查询过滤 |
| **🔍 Advanced 查询** | 高级模式：直接写 MongoDB 查询 JSON |
| **✏️ 编辑按钮（蓝色）** | 编辑单条文档内容 |
| **🗑️ 删除按钮（红色）** | 删除单条文档 |
| **Delete all documents** | 批量删除当前查询结果中的所有文档 |

#### 4. 文档编辑

点击文档行的蓝色编辑按钮后，可以：
- 以 JSON 格式直接编辑文档所有字段
- 添加新字段、删除字段
- 修改字段值和类型
- 保存后立即生效

---

### 四、Mongo Express 常用管理命令

```bash
# 查看运行状态
docker ps --filter name=mongo-express

# 查看日志
docker logs mongo-express

# 实时跟踪日志
docker logs -f mongo-express

# 停止容器
docker stop mongo-express

# 启动容器
docker start mongo-express

# 重启容器
docker restart mongo-express

# 删除容器（需先停止）
docker stop mongo-express && docker rm mongo-express

# 进入容器内部
docker exec -it mongo-express sh
```

---

### 五、docker-compose 一键部署方式（可选）

如果希望用 docker-compose 同时管理 MongoDB 和 Mongo Express，可创建 `docker-compose-mongo.yml`：

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    container_name: mongodb
    restart: unless-stopped
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: admin123
    volumes:
      - mongodb_data:/data/db
    networks:
      - mongo-net

  mongo-express:
    image: mongo-express
    container_name: mongo-express
    restart: unless-stopped
    ports:
      - "8081:8081"
    environment:
      ME_CONFIG_MONGODB_SERVER: mongodb
      ME_CONFIG_MONGODB_PORT: 27017
      ME_CONFIG_MONGODB_ADMINUSERNAME: admin
      ME_CONFIG_MONGODB_ADMINPASSWORD: admin123
      ME_CONFIG_BASICAUTH_USERNAME: admin
      ME_CONFIG_BASICAUTH_PASSWORD: admin123
    depends_on:
      - mongodb
    networks:
      - mongo-net

volumes:
  mongodb_data:

networks:
  mongo-net:
    driver: bridge
```

启动：
```bash
docker-compose -f docker-compose-mongo.yml up -d
```

停止：
```bash
docker-compose -f docker-compose-mongo.yml down
```

---

### 六、端口与服务汇总

部署完成后，本项目涉及以下服务和端口：

| 服务 | 容器名 | 端口 | 访问地址 | 说明 |
|------|--------|------|----------|------|
| MongoDB | `mongodb` | 27017 | `localhost:27017` | 数据库服务 |
| Mongo Express | `mongo-express` | 8081 | `http://localhost:8081` | 数据库可视化 Web 界面 |
| Flask 应用 | （宿主机进程） | 5001 | `http://localhost:5001` | 智能家具设备管理平台 |

---

## 许可证

MIT License

---

## 作者

本项目为 Docker + MongoDB + Python Flask 技术栈的 CRUD 实践示例，面向家庭智能家具 IoT 设备管理场景。
