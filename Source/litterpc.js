window.LitterPC = {}

LitterPC.STORAGE_KEY = 'litterpc_settings';

LitterPC.loadSettings = function() {
    try {
        const saved = localStorage.getItem(LitterPC.STORAGE_KEY);
        LitterPC.data = saved ? JSON.parse(saved) : {};

        LitterPC.data.Avatar = LitterPC.data.Avatar ?? true;
        LitterPC.data.AvatarScale = LitterPC.data.AvatarScale ?? 1;
        LitterPC.data.AvatarOpacity = LitterPC.data.AvatarOpacity ?? 1.0;
        LitterPC.data.AvatarShowBorder = LitterPC.data.AvatarShowBorder ?? false;
        LitterPC.data.AvatarZ = LitterPC.data.AvatarZ ?? 299;
        LitterPC.data.AvatarX = LitterPC.data.AvatarX ?? -72;
        LitterPC.data.AvatarY = LitterPC.data.AvatarY ?? -50;
        LitterPC.data.AvatarStoryBottom = LitterPC.data.AvatarStoryBottom ?? 100;
        LitterPC.data.Locked = LitterPC.data.Locked ?? false;
    } catch (e) {
        console.warn('[LitterPC] 读取 localstorage 失败', e);
    }
};

LitterPC.saveSettings = function() {
    try {
        const data = JSON.stringify(LitterPC.data);
        localStorage.setItem(LitterPC.STORAGE_KEY, data);
    } catch (e) {
        console.warn('[LitterPC] 保存 localstorage 失败', e);
    }
};

// === 注入 =====================================
$(document).on(":passagerender", function (ev) {LitterPC.onPassageRender(ev)});
LitterPC.onPassageRender = function (ev) {
    if (V.LitterPC) {
        LitterPC.data.Avatar = V.LitterPC.Avatar ?? true;
        LitterPC.data.AvatarScale = V.LitterPC.AvatarScale ?? 1;
        LitterPC.data.AvatarOpacity = V.LitterPC.AvatarOpacity ?? 1.0;
        LitterPC.data.AvatarShowBorder = V.LitterPC.AvatarShowBorder ?? false;
        LitterPC.data.AvatarZ = V.LitterPC.AvatarZ ?? 299;
        LitterPC.data.AvatarX = V.LitterPC.AvatarX ?? -72;
        LitterPC.data.AvatarY = V.LitterPC.AvatarY ?? -50;
        LitterPC.data.AvatarStoryBottom = V.LitterPC.AvatarStoryBottom ?? 100;
        LitterPC.data.Locked = V.LitterPC.Locked ?? false;
        delete V.LitterPC;
    }
    LitterPC.updateAvatarConfig();
};


// === 头像 ====================================
LitterPC.LoadAvatar = function() {
    if (!LitterPC.AvatarContainer) {
        // 创建头像容器
        LitterPC.AvatarContainer = document.createElement("div");
        LitterPC.AvatarContainer.id = "avatar-container";
        LitterPC.AvatarContainer.className = "avatar";
        document.querySelector('#story').append(LitterPC.AvatarContainer);

        // 创建头像画布
        LitterPC.AvatarCanvas = document.createElement("canvas");
        LitterPC.AvatarCanvas.id = "avatar";
        LitterPC.AvatarContainer.append(LitterPC.AvatarCanvas);

        // 创建拖拽手柄
        LitterPC.AvatarHandle = document.createElement("div");
        LitterPC.AvatarHandle.id = "avatar-move";
        LitterPC.AvatarHandle.style.inset = "14px 22px 79px 75px";
        LitterPC.AvatarHandle.style.cursor = "move";
        LitterPC.AvatarHandle.style.touchAction = "none";
        if (LitterPC.data.Locked) LitterPC.AvatarHandle.style.pointer_events = "none";
        LitterPC.AvatarContainer.append(LitterPC.AvatarHandle);

        new DraggableAvatar();
    }

    LitterPC.updateAvatarConfig();
    LitterPC.startSync();
};

LitterPC.updateCanvasSize = function() {
    if (!LitterPC.AvatarContainer) return;
    if (!LitterPC.AvatarHandle) return;
    LitterPC.AvatarContainer.style.scale = LitterPC.data.AvatarScale;
    LitterPC.AvatarCanvas.style.opacity = LitterPC.data.AvatarOpacity;
    if (LitterPC.data.Locked) {
        LitterPC.AvatarHandle.style.pointerEvents = "none";
    } else {
        LitterPC.AvatarHandle.style.pointerEvents = "";
    }
    LitterPC.saveSettings();
};

LitterPC.updateBorderDisplay = function() {
    if (!LitterPC.AvatarHandle) return;
    if (LitterPC.data.AvatarShowBorder) {
        LitterPC.AvatarHandle.style.border = "1px solid aqua";
    } else {
        LitterPC.AvatarHandle.style.border = "none";
    }
    LitterPC.saveSettings();
};

LitterPC.updateAvatarConfig = function() {
    if (!LitterPC.AvatarContainer) return;
    LitterPC.AvatarContainer.style.display = LitterPC.data.Avatar ? "": "none"
    LitterPC.AvatarContainer.style.zIndex = `${LitterPC.data.AvatarZ}`;
    LitterPC.AvatarContainer.style.left =  LitterPC.data.AvatarX + "px";
    LitterPC.AvatarContainer.style.bottom = LitterPC.data.AvatarY + "px";
    LitterPC.updateCanvasSize();
    LitterPC.updateBorderDisplay();
    LitterPC.saveSettings();
};

LitterPC.startSync = function() {
    function sync() {
        if (!LitterPC.data.Avatar) return;  // 避免 LitterPC.AvatarCanvas.style.display 冲突修改display

        // 获取原始画布
        if (V?.passage === "Start") {
            LitterPC.sourceCanvas = document.querySelector("#startImg")?.children[1];
        } else {
            LitterPC.sourceCanvas = document.querySelector(".mainCanvas");
        }

        if (LitterPC.sourceCanvas && LitterPC.AvatarCanvas) {
            LitterPC.AvatarCanvas.style.display = "";
            LitterPC.AvatarCanvas.width = LitterPC.sourceCanvas.width;
            LitterPC.AvatarCanvas.height = LitterPC.sourceCanvas.height;
            const ctx = LitterPC.AvatarCanvas.getContext('2d');
            ctx.clearRect(0, 0, LitterPC.AvatarCanvas.width, LitterPC.AvatarCanvas.height);
            ctx.drawImage(
                LitterPC.sourceCanvas,
                0, 0,
                LitterPC.sourceCanvas.width, LitterPC.sourceCanvas.height,
                0, 0,
                LitterPC.AvatarCanvas.width, LitterPC.AvatarCanvas.height
            );
        } else {
            LitterPC.AvatarCanvas.style.display = "none";
        }
        
        LitterPC.syncId = requestAnimationFrame(sync);
    }
    
    // 取消之前的同步
    if (LitterPC.syncId) {
        cancelAnimationFrame(LitterPC.syncId);
    }
    
    LitterPC.syncId = requestAnimationFrame(sync);
};

LitterPC.stopSync = function() {
    if (LitterPC.syncId) {
        cancelAnimationFrame(LitterPC.syncId);
        LitterPC.syncId = null;
    }
};

class DraggableAvatar {
    constructor() {
        this.container = LitterPC.AvatarContainer;
        this.handle = LitterPC.AvatarHandle;
        this.isDragging = false;
        this.startPos = { x: 0, y: 0 };
        this.initialPos = { left: 0, bottom: 0 };
        
        this.init();
    }
    
    init() {
        this.bindEvents();
    }
    
    bindEvents() {
        const handle = this.handle;
        
        // 鼠标事件
        handle.addEventListener('mousedown', this);
        document.addEventListener('mousemove', this);
        document.addEventListener('mouseup', this);
        
        // 触摸事件
        handle.addEventListener('touchstart', this, { passive: false });
        document.addEventListener('touchmove', this, { passive: false });
        document.addEventListener('touchend', this);
        document.addEventListener('touchcancel', this);
        
        // 阻止拖拽默认行为
        handle.addEventListener('dragstart', (e) => e.preventDefault());
    }
    
    // 事件处理
    handleEvent(e) {
        switch(e.type) {
            case 'mousedown':
            case 'touchstart':
                this.onDragStart(e);
                break;
            case 'mousemove':
            case 'touchmove':
                this.onDragMove(e);
                break;
            case 'mouseup':
            case 'touchend':
            case 'touchcancel':
                this.onDragEnd(e);
                break;
        }
    }
    
    getClientPos(e) {
        if (e.type.startsWith('touch')) {
            return {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY
            };
        }
        return {
            x: e.clientX,
            y: e.clientY
        };
    }
    
    onDragStart(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const pos = this.getClientPos(e);
        const rect = this.container.getBoundingClientRect();
        
        this.isDragging = true;
        this.startPos = { x: pos.x, y: pos.y };
        const currentLeft = parseFloat(this.container.style.left) || rect.left;
        const currentBottom = parseFloat(this.container.style.bottom) || (window.innerHeight - rect.bottom);
        
        this.initialPos = { 
            left: currentLeft, 
            bottom: currentBottom 
        };
        
        this.handle.style.cursor = 'grabbing';
    }
    
    onDragMove(e) {
        if (!this.isDragging) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        const pos = this.getClientPos(e);
        const dx = pos.x - this.startPos.x;
        const dy = pos.y - this.startPos.y;
        
        // 计算新位置
        let newLeft = this.initialPos.left + dx;
        let newBottom = this.initialPos.bottom - dy;
        
        // 应用新位置
        this.container.style.left = newLeft + 'px';
        this.container.style.bottom = newBottom + 'px';
        this.container.style.top = 'auto';
        this.container.style.right = 'auto';
    }
    
    onDragEnd(e) {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        this.handle.style.cursor = 'move';
        
        // 保存位置到存档变量
        const rect = this.container.getBoundingClientRect();
        LitterPC.data.AvatarX = Math.round(rect.left);
        LitterPC.data.AvatarY = Math.round(window.innerHeight - rect.bottom);
        LitterPC.saveSettings();
    }
}


// === 设置 ====================================
LitterPC.settingAvatarEnable = function(a0) {
    LitterPC.data.Avatar = a0;
    LitterPC.updateAvatarConfig();
    if (a0) {
        LitterPC.startSync();
    } else {
        LitterPC.stopSync();
    }
    LitterPC.saveSettings();
};
LitterPC.settingAvatarShowBorder = function(a0) {
    LitterPC.data.AvatarShowBorder = a0;
    LitterPC.updateBorderDisplay();
};
LitterPC.settingResetPos = function() {
    LitterPC.data.AvatarX = -72;
    LitterPC.data.AvatarY = -50;
    if (document.querySelector("#litterpcavatarpos")) document.querySelector("#litterpcavatarpos").innerText = `X=${LitterPC.data.AvatarX}, Y=${LitterPC.data.AvatarY}`
    LitterPC.updateAvatarConfig();
};
LitterPC.settingLock = function(a0) {
    LitterPC.data.Locked = a0;
    LitterPC.updateCanvasSize();
};
LitterPC.settingAvatarScale = function(a0) {
    if (a0) {
        LitterPC.data.AvatarScale = a0;
        document.getElementById("numberslider-input--avatarscale").value = a0;
        document.getElementById("numberslider-value--avatarscale").innerText = a0;
    } else {
        LitterPC.data.AvatarScale = T.AvatarScale
    }
    LitterPC.updateCanvasSize();
};
LitterPC.settingAvatarOpacity = function(a0) {
    if (a0) {
        LitterPC.data.AvatarOpacity = a0;
        document.getElementById("numberslider-input--avataropacity").value = a0;
        document.getElementById("numberslider-value--avataropacity").innerText = a0;
    } else {
        LitterPC.data.AvatarOpacity = T.AvatarOpacity
    }
    LitterPC.updateCanvasSize();
};
LitterPC.settingStoryBottom = function(a0) {
    if (a0) {
        LitterPC.data.AvatarStoryBottom = a0;
        document.getElementById("numberslider-input--avatarstorybottom").value = a0;
        document.getElementById("numberslider-value--avatarstorybottom").innerText = a0;
    } else {
        LitterPC.data.AvatarStoryBottom = T.AvatarStoryBottom
    }
    LitterPC.saveSettings();
};


// === 开始 ====================================
LitterPC.loadSettings();
LitterPC.saveSettings();
document.documentElement.style.setProperty('--story-bottom', `${LitterPC.data.AvatarStoryBottom}px`);
LitterPC.LoadAvatar();



`LitterPC.data.AvatarScale = LitterPC.data.AvatarScale || 1.2;
    LitterPC.data.AvatarZ = LitterPC.data.AvatarZ || 299;
    LitterPC.data.AvatarX = LitterPC.data.AvatarX || -100;
    LitterPC.data.AvatarY = LitterPC.data.AvatarY || -100;`