window.LitterPC = {}


// === 注入 =====================================
$(document).on(":passagerender", function (ev) {LitterPC.onPassageRender(ev)});
LitterPC.onPassageRender = function (ev) {
    // === 数值存储存档 ==============================
    V.LitterPC = V.LitterPC || {}; 

    V.LitterPC.Avatar = V.LitterPC.Avatar ?? true;
    V.LitterPC.AvatarScale = V.LitterPC.AvatarScale ?? 1;
    V.LitterPC.AvatarOpacity = V.LitterPC.AvatarOpacity ?? 1.0;
    V.LitterPC.AvatarShowBorder = V.LitterPC.AvatarShowBorder ?? false;
    V.LitterPC.AvatarZ = V.LitterPC.AvatarZ ?? 299;
    V.LitterPC.AvatarX = V.LitterPC.AvatarX ?? -72;
    V.LitterPC.AvatarY = V.LitterPC.AvatarY ?? -50;
    V.LitterPC.AvatarStoryBottom = V.LitterPC.AvatarStoryBottom ?? 100;
    V.LitterPC.Locked = V.LitterPC.Locked ?? false;

    LitterPC.LoadAvatar();
    LitterPC.settingStoryBottom();
};


// === 头像 ====================================
LitterPC.LoadAvatar = function() {
    // 获取原始画布
    if (!LitterPC.sourceCanvas) {
        if (V?.passage === "Start") {
            LitterPC.sourceCanvas = document.querySelector("#startImg")?.children[1];
        } else {
            LitterPC.sourceCanvas = document.querySelector(".mainCanvas");
        }
        if (!LitterPC.sourceCanvas) {
            setTimeout(LitterPC.LoadAvatar, 100); 
        }
    }

    // 如果容器已存在，只更新配置
    if (LitterPC.AvatarContainer) {
        LitterPC.updateAvatarConfig();
    } else {
        // 创建头像容器
        LitterPC.AvatarContainer = document.createElement("div");
        LitterPC.AvatarContainer.id = "avatar-container";
        LitterPC.AvatarContainer.className = "avatar";
        LitterPC.AvatarContainer.style.zIndex = V.LitterPC.AvatarZ;
        LitterPC.AvatarContainer.style.left = V.LitterPC.AvatarX + "px";
        LitterPC.AvatarContainer.style.bottom = V.LitterPC.AvatarY + "px";
        document.querySelector('#story').append(LitterPC.AvatarContainer);

        // 创建头像画布
        LitterPC.AvatarCanvas = document.createElement("canvas");
        LitterPC.AvatarCanvas.id = "avatar";
        LitterPC.updateCanvasSize();
        LitterPC.AvatarContainer.append(LitterPC.AvatarCanvas);

        // 创建拖拽手柄
        LitterPC.AvatarHandle = document.createElement("div");
        LitterPC.AvatarHandle.id = "avatar-move";
        LitterPC.AvatarHandle.style.inset = "14px 22px 79px 75px";
        LitterPC.AvatarHandle.style.cursor = "move";
        LitterPC.AvatarHandle.style.touchAction = "none";
        if (V.LitterPC.Locked) LitterPC.AvatarHandle.style.pointer_events = "none";
        LitterPC.updateBorderDisplay();
        LitterPC.AvatarContainer.append(LitterPC.AvatarHandle);

        new DraggableAvatar();
    }

    LitterPC.startSync();
};

LitterPC.updateCanvasSize = function() {
    if (!LitterPC.sourceCanvas || !LitterPC.AvatarCanvas) return;
    LitterPC.AvatarCanvas.width = LitterPC.sourceCanvas.width * V.LitterPC.AvatarScale;
    LitterPC.AvatarCanvas.height = LitterPC.sourceCanvas.height * V.LitterPC.AvatarScale;
    LitterPC.AvatarCanvas.style.opacity = V.LitterPC.AvatarOpacity;
    if (V.LitterPC.Locked) {
        LitterPC.AvatarHandle.style.pointerEvents = "none";
    } else {
        LitterPC.AvatarHandle.style.pointerEvents = "";
    }
};

LitterPC.updateBorderDisplay = function() {
    if (!LitterPC.AvatarHandle) return;
    if (V.LitterPC.AvatarShowBorder) {
        LitterPC.AvatarHandle.style.border = "1px solid aqua";
    } else {
        LitterPC.AvatarHandle.style.border = "none";
    }
};

LitterPC.updateAvatarConfig = function() {
    if (!LitterPC.AvatarContainer) return;
    LitterPC.AvatarContainer.style.display = V.LitterPC.Avatar ? "": "none"
    LitterPC.AvatarContainer.style.zIndex = `${V.LitterPC.AvatarZ}`;
    LitterPC.AvatarContainer.style.left =  V.LitterPC.AvatarX + "px";
    LitterPC.AvatarContainer.style.bottom = V.LitterPC.AvatarY + "px";
    LitterPC.updateCanvasSize();
    LitterPC.updateBorderDisplay();
};

LitterPC.startSync = function() {
    function sync() {
        if (V?.passage === "Start") {
            LitterPC.sourceCanvas = document.querySelector("#startImg")?.children[1];
        }
        if (LitterPC.sourceCanvas && LitterPC.AvatarCanvas) {
            const ctx = LitterPC.AvatarCanvas.getContext('2d');
            ctx.clearRect(0, 0, LitterPC.AvatarCanvas.width, LitterPC.AvatarCanvas.height);
            ctx.drawImage(
                LitterPC.sourceCanvas,
                0, 0,
                LitterPC.sourceCanvas.width, LitterPC.sourceCanvas.height,
                0, 0,
                LitterPC.AvatarCanvas.width, LitterPC.AvatarCanvas.height
            );
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
        V.LitterPC.AvatarX = Math.round(rect.left);
        V.LitterPC.AvatarY = Math.round(window.innerHeight - rect.bottom);
    }
}


// === 设置 ====================================
LitterPC.settingAvatarEnable = function(a0) {
    V.LitterPC.Avatar = a0;
    LitterPC.updateAvatarConfig();
    if (a0) {
        LitterPC.startSync();
    } else {
        LitterPC.stopSync();
    }
};
LitterPC.settingAvatarShowBorder = function(a0) {
    V.LitterPC.AvatarShowBorder = a0;
    LitterPC.updateBorderDisplay();
};
LitterPC.settingResetPos = function() {
    V.LitterPC.AvatarX = -72;
    V.LitterPC.AvatarY = -50;
    if (document.querySelector("#litterpcavatarpos")) document.querySelector("#litterpcavatarpos").innerText = `X=${V.LitterPC.AvatarX}, Y=${V.LitterPC.AvatarY}`
    LitterPC.updateAvatarConfig();
};
LitterPC.settingLock = function(a0) {
    V.LitterPC.Locked = a0;
    LitterPC.updateCanvasSize();
};
LitterPC.settingAvatarScale = function(a0) {
    if (a0) {
        V.LitterPC.AvatarScale = a0;
        document.getElementById("numberslider-input-litterpcavatarscale").value = a0;
        document.getElementById("numberslider-value-litterpcavatarscale").innerText = a0;
    }
    LitterPC.updateCanvasSize();
};
LitterPC.settingAvatarOpacity = function(a0) {
    if (a0) {
        V.LitterPC.AvatarOpacity = a0;
        document.getElementById("numberslider-input-litterpcavataropacity").value = a0;
        document.getElementById("numberslider-value-litterpcavataropacity").innerText = a0;
    }
    LitterPC.updateCanvasSize();
};
LitterPC.settingStoryBottom = function(a0) {
    if (a0) {
        V.LitterPC.AvatarStoryBottom = a0;
        document.getElementById("numberslider-input-LitterPCavatarstorybottom").value = a0;
        document.getElementById("numberslider-value-LitterPCavatarstorybottom").innerText = a0;
    }
    document.documentElement.style.setProperty('--story-bottom', `${V.LitterPC.AvatarStoryBottom}px`);
};


`V.LitterPC.AvatarScale = V.LitterPC.AvatarScale || 1.2;
    V.LitterPC.AvatarZ = V.LitterPC.AvatarZ || 299;
    V.LitterPC.AvatarX = V.LitterPC.AvatarX || -100;
    V.LitterPC.AvatarY = V.LitterPC.AvatarY || -100;`