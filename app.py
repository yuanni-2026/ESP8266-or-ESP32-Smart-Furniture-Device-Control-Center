"""
智能家具 ESP8266/ESP32 设备管理系统 - Flask 后端
基于 Docker 中运行的 MongoDB 数据库，提供完整的增删改查 (CRUD) API。

数据库: smart_home
集合: devices
"""

from flask import Flask, render_template, request, jsonify
from pymongo import MongoClient
from bson.objectid import ObjectId
from datetime import datetime, timezone
import os

app = Flask(__name__)

# ==================== MongoDB 连接配置 ====================
# 连接 Docker 中运行的 MongoDB 容器
MONGO_HOST = os.environ.get("MONGO_HOST", "localhost")
MONGO_PORT = int(os.environ.get("MONGO_PORT", 27017))
MONGO_USER = os.environ.get("MONGO_USER", "smarthome")
MONGO_PASS = os.environ.get("MONGO_PASS", "smart123")
MONGO_DB = os.environ.get("MONGO_DB", "smart_home")

# 构建 MongoDB 连接 URI
MONGO_URI = f"mongodb://{MONGO_USER}:{MONGO_PASS}@{MONGO_HOST}:{MONGO_PORT}/{MONGO_DB}?authSource={MONGO_DB}"

client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
db = client[MONGO_DB]
devices_collection = db["devices"]


# ==================== 工具函数 ====================
def device_to_dict(device):
    """将 MongoDB 文档转换为可序列化的字典"""
    if not device:
        return None
    return {
        "id": str(device["_id"]),
        "device_id": device.get("device_id", ""),
        "name": device.get("name", ""),
        "chip": device.get("chip", ""),
        "room": device.get("room", ""),
        "furniture_type": device.get("furniture_type", ""),
        "status": device.get("status", "offline"),
        "ip": device.get("ip", ""),
        "firmware": device.get("firmware", ""),
        "features": device.get("features", []),
        "created_at": device.get("created_at", datetime.now(timezone.utc)).isoformat() if isinstance(device.get("created_at"), datetime) else str(device.get("created_at", "")),
    }


# ==================== 页面路由 ====================
@app.route("/")
def index():
    """渲染设备管理主页"""
    return render_template("index.html")


# ==================== CRUD API ====================

# ---- C: 创建设备 (Create) ----
@app.route("/api/devices", methods=["POST"])
def create_device():
    """新增一个智能设备"""
    data = request.get_json()
    if not data or not data.get("device_id") or not data.get("name"):
        return jsonify({"error": "device_id 和 name 为必填字段"}), 400

    # 检查 device_id 是否已存在
    if devices_collection.find_one({"device_id": data["device_id"]}):
        return jsonify({"error": f"设备ID {data['device_id']} 已存在"}), 409

    device = {
        "device_id": data["device_id"],
        "name": data["name"],
        "chip": data.get("chip", "ESP32"),
        "room": data.get("room", ""),
        "furniture_type": data.get("furniture_type", ""),
        "status": data.get("status", "offline"),
        "ip": data.get("ip", ""),
        "firmware": data.get("firmware", "v1.0.0"),
        "features": data.get("features", []),
        "created_at": datetime.now(timezone.utc),
    }

    result = devices_collection.insert_one(device)
    created = devices_collection.find_one({"_id": result.inserted_id})
    return jsonify({"message": "设备创建成功", "device": device_to_dict(created)}), 201


# ---- R: 查询所有设备 (Read - List) ----
@app.route("/api/devices", methods=["GET"])
def list_devices():
    """获取所有设备列表，支持按关键字搜索"""
    keyword = request.args.get("keyword", "").strip()
    query = {}
    if keyword:
        # 在多个字段中进行模糊搜索
        query = {
            "$or": [
                {"device_id": {"$regex": keyword, "$options": "i"}},
                {"name": {"$regex": keyword, "$options": "i"}},
                {"chip": {"$regex": keyword, "$options": "i"}},
                {"room": {"$regex": keyword, "$options": "i"}},
                {"furniture_type": {"$regex": keyword, "$options": "i"}},
            ]
        }

    devices = list(devices_collection.find(query).sort("created_at", -1))
    return jsonify({
        "total": len(devices),
        "devices": [device_to_dict(d) for d in devices],
    })


# ---- R: 查询单个设备 (Read - One) ----
@app.route("/api/devices/<device_id>", methods=["GET"])
def get_device(device_id):
    """根据 device_id 获取单个设备详情"""
    device = devices_collection.find_one({"device_id": device_id})
    if not device:
        return jsonify({"error": "设备不存在"}), 404
    return jsonify({"device": device_to_dict(device)})


# ---- U: 更新设备 (Update) ----
@app.route("/api/devices/<device_id>", methods=["PUT"])
def update_device(device_id):
    """根据 device_id 更新设备信息"""
    data = request.get_json()
    if not data:
        return jsonify({"error": "请求体不能为空"}), 400

    # 不允许修改 device_id 和 created_at
    update_fields = {}
    allowed_fields = ["name", "chip", "room", "furniture_type", "status", "ip", "firmware", "features"]
    for field in allowed_fields:
        if field in data:
            update_fields[field] = data[field]

    if not update_fields:
        return jsonify({"error": "没有可更新的字段"}), 400

    result = devices_collection.update_one(
        {"device_id": device_id},
        {"$set": update_fields}
    )

    if result.matched_count == 0:
        return jsonify({"error": "设备不存在"}), 404

    updated = devices_collection.find_one({"device_id": device_id})
    return jsonify({"message": "设备更新成功", "device": device_to_dict(updated)})


# ---- D: 删除设备 (Delete) ----
@app.route("/api/devices/<device_id>", methods=["DELETE"])
def delete_device(device_id):
    """根据 device_id 删除设备"""
    result = devices_collection.delete_one({"device_id": device_id})
    if result.deleted_count == 0:
        return jsonify({"error": "设备不存在"}), 404
    return jsonify({"message": f"设备 {device_id} 删除成功"})


# ==================== 健康检查 ====================
@app.route("/api/health", methods=["GET"])
def health():
    """检查 MongoDB 连接状态"""
    try:
        client.admin.command("ping")
        return jsonify({"status": "healthy", "mongodb": "connected", "database": MONGO_DB})
    except Exception as e:
        return jsonify({"status": "unhealthy", "mongodb": "disconnected", "error": str(e)}), 500


# ==================== 启动应用 ====================
if __name__ == "__main__":
    print("=" * 60)
    print("  智能家具设备管理系统启动中...")
    print(f"  MongoDB 连接: {MONGO_HOST}:{MONGO_PORT}/{MONGO_DB}")
    print("  访问地址: http://localhost:5001")
    print("=" * 60)
    app.run(host="0.0.0.0", port=5001, debug=False)
