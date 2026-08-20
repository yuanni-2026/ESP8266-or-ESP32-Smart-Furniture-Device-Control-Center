/* ============================================
   智能家具 IoT 设备管理平台 - 前端逻辑
   完整 CRUD + 多主题切换 + 粒子动画
   ============================================ */

const API_BASE = '/api/devices';

// ==================== 全局状态 ====================
let allDevices = [];
let isEditing = false;
let editOriginalId = null;
let currentTheme = localStorage.getItem('theme') || 'cyan';

// ==================== DOM 元素 ====================
const $ = (id) => document.getElementById(id);
const deviceListEl = $('deviceList');
const emptyStateEl = $('emptyState');
const searchInput = $('searchInput');
const modalOverlay = $('modalOverlay');
const modalTitle = $('modalTitle');
const deviceForm = $('deviceForm');

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initParticles();
    updateTime();
    setInterval(updateTime, 1000);
    checkDbHealth();
    loadDevices();
    bindEvents();
});

// ==================== 主题切换系统 ====================
function initTheme() {
    applyTheme(currentTheme);
    // 更新主题切换器激活状态
    document.querySelectorAll('.theme-dot').forEach(dot => {
        dot.classList.toggle('active', dot.dataset.themeValue === currentTheme);
    });
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    currentTheme = theme;
    localStorage.setItem('theme', theme);
    // 粒子颜色随主题变化
    if (window.particleAnimation) {
        updateParticleColors();
    }
}

function bindThemeSwitcher() {
    document.querySelectorAll('.theme-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            const theme = dot.dataset.themeValue;
            applyTheme(theme);
            document.querySelectorAll('.theme-dot').forEach(d => d.classList.remove('active'));
            dot.classList.add('active');
            showToast('info', `已切换至${getThemeName(theme)}主题`);
        });
    });
}

function getThemeName(theme) {
    const names = {
        cyan: '青蓝科技',
        purple: '赛博紫',
        orange: '烈焰橙',
        matrix: '矩阵绿',
        rose: '玫瑰红',
        light: '简约白',
        sky: '淡天蓝',
        lavender: '淡薰衣草',
        peach: '淡蜜桃',
        mint: '淡薄荷'
    };
    return names[theme] || theme;
}

// ==================== 粒子背景动画 ====================
let particles = [];
let particleCanvas, particleCtx;
let particleAnimationId = null;

function initParticles() {
    particleCanvas = $('particleCanvas');
    if (!particleCanvas) return;
    particleCtx = particleCanvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    createParticles();
    animateParticles();
    window.particleAnimation = true;
}

function resizeCanvas() {
    if (!particleCanvas) return;
    particleCanvas.width = window.innerWidth;
    particleCanvas.height = window.innerHeight;
}

function getThemeParticleColor() {
    const styles = getComputedStyle(document.documentElement);
    return styles.getPropertyValue('--particle-color').trim() || 'rgba(0, 255, 200, 0.6)';
}

function updateParticleColors() {
    const color = getThemeParticleColor();
    particles.forEach(p => { p.color = color; });
}

function createParticles() {
    particles = [];
    const count = Math.min(80, Math.floor(window.innerWidth / 20));
    const color = getThemeParticleColor();
    for (let i = 0; i < count; i++) {
        particles.push({
            x: Math.random() * particleCanvas.width,
            y: Math.random() * particleCanvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            radius: Math.random() * 2 + 0.5,
            color: color,
            alpha: Math.random() * 0.5 + 0.2
        });
    }
}

function animateParticles() {
    if (!particleCtx) return;
    particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);

    // 绘制连线
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 120) {
                particleCtx.beginPath();
                particleCtx.strokeStyle = particles[i].color.replace(/[\d.]+\)$/, `${(1 - dist / 120) * 0.15})`);
                particleCtx.lineWidth = 0.5;
                particleCtx.moveTo(particles[i].x, particles[i].y);
                particleCtx.lineTo(particles[j].x, particles[j].y);
                particleCtx.stroke();
            }
        }
    }

    // 绘制粒子
    particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        // 边界反弹
        if (p.x < 0 || p.x > particleCanvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > particleCanvas.height) p.vy *= -1;

        particleCtx.beginPath();
        particleCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        particleCtx.fillStyle = p.color.replace(/[\d.]+\)$/, `${p.alpha})`);
        particleCtx.fill();

        // 粒子光晕
        particleCtx.beginPath();
        particleCtx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
        particleCtx.fillStyle = p.color.replace(/[\d.]+\)$/, `${p.alpha * 0.1})`);
        particleCtx.fill();
    });

    particleAnimationId = requestAnimationFrame(animateParticles);
}

// ==================== 时间显示 ====================
function updateTime() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    $('currentTime').textContent = `${h}:${m}:${s}`;
}

// ==================== 数据库健康检查 ====================
async function checkDbHealth() {
    try {
        const res = await fetch('/api/health');
        const data = await res.json();
        const dot = document.querySelector('.status-dot');
        const text = document.querySelector('.status-text');
        if (data.mongodb === 'connected') {
            dot.classList.add('connected');
            text.textContent = `MongoDB 已连接 · ${data.database}`;
        } else {
            dot.classList.add('disconnected');
            text.textContent = 'MongoDB 连接失败';
        }
    } catch (e) {
        const dot = document.querySelector('.status-dot');
        const text = document.querySelector('.status-text');
        dot.classList.add('disconnected');
        text.textContent = 'MongoDB 连接失败';
    }
}

// ==================== 事件绑定 ====================
function bindEvents() {
    // 主题切换
    bindThemeSwitcher();

    // 搜索
    searchInput.addEventListener('input', debounce(handleSearch, 300));

    // 新增按钮
    $('btnAdd').addEventListener('click', openAddModal);

    // 刷新按钮
    $('btnRefresh').addEventListener('click', () => {
        loadDevices();
        showToast('info', '设备列表已刷新');
    });

    // 弹窗关闭
    $('modalClose').addEventListener('click', closeModal);
    $('btnCancel').addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });

    // 提交表单
    $('btnSubmit').addEventListener('click', handleSubmit);

    // ESC 关闭弹窗
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
            closeModal();
        }
    });
}

// ==================== 防抖 ====================
function debounce(fn, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

// ==================== R: 加载设备列表 ====================
async function loadDevices() {
    try {
        const res = await fetch(API_BASE);
        const data = await res.json();
        allDevices = data.devices || [];
        renderDevices(allDevices);
        updateStats(allDevices);
    } catch (e) {
        showToast('error', '加载设备列表失败: ' + e.message);
    }
}

// ==================== 搜索过滤 ====================
function handleSearch() {
    const keyword = searchInput.value.trim().toLowerCase();
    if (!keyword) {
        renderDevices(allDevices);
        return;
    }
    const filtered = allDevices.filter(d =>
        d.device_id.toLowerCase().includes(keyword) ||
        d.name.toLowerCase().includes(keyword) ||
        d.chip.toLowerCase().includes(keyword) ||
        d.room.toLowerCase().includes(keyword) ||
        d.furniture_type.toLowerCase().includes(keyword)
    );
    renderDevices(filtered);
}

// ==================== 渲染设备卡片 ====================
function renderDevices(devices) {
    if (devices.length === 0) {
        deviceListEl.innerHTML = '';
        emptyStateEl.style.display = 'block';
        return;
    }
    emptyStateEl.style.display = 'none';
    deviceListEl.innerHTML = devices.map((d, index) => `
        <div class="device-card" data-id="${d.device_id}" style="animation: cardIn 0.5s ease ${index * 0.08}s both;">
            <div class="device-card-header">
                <span class="device-id">${escapeHtml(d.device_id)}</span>
                <span class="device-status ${d.status}">
                    <span class="device-status-dot"></span>
                    ${d.status === 'online' ? '在线' : '离线'}
                </span>
            </div>
            <div class="device-name">${escapeHtml(d.name)}</div>
            <div class="device-meta">
                <div class="meta-item">
                    <span class="meta-label">芯片型号</span>
                    <span class="meta-value">${escapeHtml(d.chip)}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">家具类型</span>
                    <span class="meta-value">${escapeHtml(d.furniture_type)}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">所在房间</span>
                    <span class="meta-value">${escapeHtml(d.room || '-')}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">IP 地址</span>
                    <span class="meta-value">${escapeHtml(d.ip || '-')}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">固件版本</span>
                    <span class="meta-value">${escapeHtml(d.firmware)}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">创建时间</span>
                    <span class="meta-value">${formatDate(d.created_at)}</span>
                </div>
            </div>
            <div class="device-features">
                ${(d.features || []).map(f => `<span class="feature-tag">${escapeHtml(f)}</span>`).join('')}
            </div>
            <div class="device-actions">
                <button class="btn btn-refresh btn-sm" onclick="editDevice('${d.device_id}')">✎ 编辑</button>
                <button class="btn btn-danger btn-sm" onclick="deleteDevice('${d.device_id}')">🗑 删除</button>
            </div>
        </div>
    `).join('');

    // 注入卡片入场动画 keyframes（如果还没注入）
    if (!document.getElementById('cardInKeyframes')) {
        const style = document.createElement('style');
        style.id = 'cardInKeyframes';
        style.textContent = `
            @keyframes cardIn {
                from { opacity: 0; transform: translateY(30px) scale(0.95); }
                to { opacity: 1; transform: translateY(0) scale(1); }
            }
        `;
        document.head.appendChild(style);
    }
}

// ==================== 更新统计面板 ====================
function updateStats(devices) {
    const total = devices.length;
    const online = devices.filter(d => d.status === 'online').length;
    const offline = total - online;
    const rooms = new Set(devices.map(d => d.room).filter(Boolean)).size;

    animateNumber('totalDevices', total);
    animateNumber('onlineDevices', online);
    animateNumber('offlineDevices', offline);
    animateNumber('roomCount', rooms);

    // 更新进度条
    $('barTotal').style.width = '100%';
    $('barOnline').style.width = total > 0 ? (online / total * 100) + '%' : '0%';
    $('barOffline').style.width = total > 0 ? (offline / total * 100) + '%' : '0%';
    $('barRoom').style.width = rooms > 0 ? Math.min(rooms * 20, 100) + '%' : '0%';
}

// ==================== 数字动画 ====================
function animateNumber(elementId, target) {
    const el = $(elementId);
    const current = parseInt(el.textContent) || 0;
    const duration = 600;
    const steps = 30;
    const increment = (target - current) / steps;
    let step = 0;
    const timer = setInterval(() => {
        step++;
        el.textContent = Math.round(current + increment * step);
        if (step >= steps) {
            el.textContent = target;
            clearInterval(timer);
        }
    }, duration / steps);
}

// ==================== C: 打开新增弹窗 ====================
function openAddModal() {
    isEditing = false;
    editOriginalId = null;
    modalTitle.textContent = '新增智能设备';
    deviceForm.reset();
    $('formOriginalId').value = '';
    $('formDeviceId').disabled = false;
    modalOverlay.classList.add('active');
}

// ==================== U: 打开编辑弹窗 ====================
function editDevice(deviceId) {
    const device = allDevices.find(d => d.device_id === deviceId);
    if (!device) return;

    isEditing = true;
    editOriginalId = deviceId;
    modalTitle.textContent = '编辑智能设备';
    $('formOriginalId').value = deviceId;
    $('formDeviceId').value = device.device_id;
    $('formDeviceId').disabled = true;
    $('formName').value = device.name;
    $('formChip').value = device.chip;
    $('formRoom').value = device.room || '';
    $('formFurniture').value = device.furniture_type || '其他';
    $('formStatus').value = device.status;
    $('formIp').value = device.ip || '';
    $('formFirmware').value = device.firmware || '';
    $('formFeatures').value = (device.features || []).join(', ');
    modalOverlay.classList.add('active');
}

// ==================== 关闭弹窗 ====================
function closeModal() {
    modalOverlay.classList.remove('active');
}

// ==================== 提交表单（新增/编辑） ====================
async function handleSubmit() {
    const deviceId = $('formDeviceId').value.trim();
    const name = $('formName').value.trim();

    if (!deviceId) {
        showToast('error', '请输入设备ID');
        return;
    }
    if (!name) {
        showToast('error', '请输入设备名称');
        return;
    }

    const features = $('formFeatures').value
        .split(',')
        .map(f => f.trim())
        .filter(Boolean);

    const payload = {
        device_id: deviceId,
        name: name,
        chip: $('formChip').value,
        room: $('formRoom').value.trim(),
        furniture_type: $('formFurniture').value,
        status: $('formStatus').value,
        ip: $('formIp').value.trim(),
        firmware: $('formFirmware').value.trim(),
        features: features,
    };

    try {
        let res;
        if (isEditing) {
            res = await fetch(`${API_BASE}/${encodeURIComponent(editOriginalId)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
        } else {
            res = await fetch(API_BASE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
        }

        const data = await res.json();
        if (res.ok) {
            showToast('success', isEditing ? '设备更新成功' : '设备创建成功');
            closeModal();
            loadDevices();
        } else {
            showToast('error', data.error || '操作失败');
        }
    } catch (e) {
        showToast('error', '请求失败: ' + e.message);
    }
}

// ==================== D: 删除设备 ====================
async function deleteDevice(deviceId) {
    if (!confirm(`确定要删除设备「${deviceId}」吗？此操作不可撤销。`)) {
        return;
    }
    try {
        const res = await fetch(`${API_BASE}/${encodeURIComponent(deviceId)}`, {
            method: 'DELETE',
        });
        const data = await res.json();
        if (res.ok) {
            showToast('success', `设备 ${deviceId} 已删除`);
            loadDevices();
        } else {
            showToast('error', data.error || '删除失败');
        }
    } catch (e) {
        showToast('error', '删除失败: ' + e.message);
    }
}

// ==================== 工具函数 ====================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    try {
        const d = new Date(dateStr);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const h = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        return `${y}-${m}-${day} ${h}:${min}`;
    } catch {
        return '-';
    }
}

// ==================== Toast 通知 ====================
function showToast(type, message) {
    const container = $('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: '✓', error: '✕', info: 'ℹ' };
    toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span><span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 3000);
}
