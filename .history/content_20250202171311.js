// 监听来自popup的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log('收到填充请求:', request);
    
    if (request.action === 'fillAccount') {
        const result = handleFillAccount(request);
        sendResponse(result);
    }
    return true; // 保持消息通道开启
});

// 处理填充账号请求
async function handleFillAccount(request) {
    try {
        // 查找输入框
        const usernameInput = findUsernameInput();
        const passwordInput = findPasswordInput();
        
        console.log('找到输入框:', { usernameInput, passwordInput });
        
        if (!usernameInput && !passwordInput) {
            return { 
                success: false, 
                message: '未找到登录表单，请确认页面已加载完成' 
            };
        }

        // 填充账号密码
        let filled = false;
        if (usernameInput) {
            filled = await fillInput(usernameInput, request.username) || filled;
        }
        if (passwordInput) {
            filled = await fillInput(passwordInput, request.password) || filled;
        }

        // 尝试自动提交
        const submitted = await trySubmitForm(usernameInput, passwordInput);

        return {
            success: filled,
            message: getResultMessage(filled, submitted)
        };
    } catch (error) {
        console.error('填充过程出错:', error);
        return {
            success: false,
            message: '填充过程出错: ' + error.message
        };
    }
}

// 查找用户名输入框
function findUsernameInput() {
    const selectors = [
        // 精确匹配
        'input[name="username"]',
        'input[name="email"]',
        'input[name="account"]',
        'input[name="login"]',
        'input[autocomplete="username"]',
        'input[autocomplete="email"]',
        
        // 包含关键字
        'input[type="text"][name*="user"]',
        'input[type="email"]',
        'input[name*="account"]',
        'input[name*="email"]',
        'input[name*="login"]',
        'input[id*="user"]',
        'input[id*="email"]',
        'input[id*="login"]',
        'input[class*="user"]',
        'input[class*="email"]',
        'input[class*="login"]',
        
        // 中文占位符
        'input[placeholder*="用户"]',
        'input[placeholder*="邮箱"]',
        'input[placeholder*="账号"]',
        'input[placeholder*="帐号"]',
        
        // 通用文本输入
        'input[type="text"]'
    ];

    return findVisibleInput(selectors);
}

// 查找密码输入框
function findPasswordInput() {
    const selectors = [
        // 精确匹配
        'input[name="password"]',
        'input[name="pass"]',
        'input[name="pwd"]',
        'input[autocomplete="current-password"]',
        
        // 包含关键字
        'input[type="password"]',
        'input[name*="pass"]',
        'input[name*="pwd"]',
        'input[id*="pass"]',
        'input[id*="pwd"]',
        'input[class*="pass"]',
        'input[class*="pwd"]',
        
        // 中文占位符
        'input[placeholder*="密码"]'
    ];

    return findVisibleInput(selectors);
}

// 查找可见的输入框
function findVisibleInput(selectors) {
    for (let selector of selectors) {
        const inputs = document.querySelectorAll(selector);
        for (let input of inputs) {
            if (isVisible(input) && !input.readOnly && !input.disabled) {
                return input;
            }
        }
    }
    return null;
}

// 检查元素是否可见
function isVisible(element) {
    if (!element) return false;
    
    try {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        
        return rect.width > 0 && 
               rect.height > 0 && 
               style.visibility !== 'hidden' &&
               style.display !== 'none' &&
               style.opacity !== '0' &&
               !element.disabled &&
               element.type !== 'hidden' &&
               element.getAttribute('aria-hidden') !== 'true' &&
               // 检查元素是否在视口内
               rect.top >= 0 &&
               rect.left >= 0 &&
               rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
               rect.right <= (window.innerWidth || document.documentElement.clientWidth);
    } catch (e) {
        console.error('检查元素可见性失败:', e);
        return false;
    }
}

// 填充输入框并触发相关事件
async function fillInput(input, value) {
    try {
        // 保存原始值
        const originalValue = input.value;
        
        // 聚焦输入框
        input.focus();
        await sleep(50);
        
        // 清除现有值
        input.value = '';
        triggerEvent(input, 'input');
        await sleep(50);
        
        // 模拟输入
        for (let i = 0; i < value.length; i++) {
            input.value += value[i];
            triggerEvent(input, 'input');
            await sleep(10);
        }
        
        // 触发所有相关事件
        triggerEvent(input, 'change');
        triggerEvent(input, 'blur');
        
        // 验证填充是否成功
        const success = input.value === value;
        if (!success) {
            // 如果模拟输入失败，直接设置值
            input.value = value;
        }
        
        console.log(`填充输入框 ${success ? '成功' : '失败'}:`, input);
        return success;
    } catch (e) {
        console.error('填充输入框失败:', e);
        return false;
    }
}

// 触发事件
function triggerEvent(element, eventName) {
    try {
        const event = new Event(eventName, { bubbles: true, cancelable: true });
        element.dispatchEvent(event);
        
        // 对于某些特殊的网站，可能需要使用 jQuery 事件
        if (window.jQuery && element.jquery) {
            window.jQuery(element).trigger(eventName);
        }
    } catch (e) {
        console.error(`触发${eventName}事件失败:`, e);
    }
}

// 尝试自动提交表单
async function trySubmitForm(usernameInput, passwordInput) {
    if (!usernameInput || !passwordInput) return false;
    
    try {
        // 获取包含这些输入框的表单
        const form = usernameInput.form || passwordInput.form;
        if (!form) return false;
        
        // 查找提交按钮
        const submitButton = findSubmitButton(form);
        if (!submitButton) return false;
        
        console.log('找到提交按钮，尝试自动提交');
        await sleep(500); // 给页面js时间处理输入
        
        if(submitButton.length > 0){
            submitButton[0].click();
        }else{
            submitButton.click();
        }
        return true;
    } catch (e) {
        console.error('提交表单失败:', e);
        return false;
    }
}

// 查找提交按钮
function findSubmitButton(form) {
    const selectors = [
        'button[type="submit"]',
        'input[type="submit"]',
        'button[class*="submit"]',
        'button[class*="login"]',
        'button[id*="submit"]',
        'button[id*="login"]',
        'a[class*="submit"]',
        'a[class*="login"]',
        // 中文按钮文本
        'button:contains("登录")',
        'button:contains("登陆")',
        'button:contains("提交")',
        'a:contains("登录")',
        'a:contains("登陆")',
        'a:contains("提交")'
    ];
    for (let selector of selectors) {
        const inputs = document.querySelectorAll(selector);
     if (inputs.length > 0) {
            return inputs;
        }
    }
}

// 延时函数
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 获取结果消息
function getResultMessage(filled, submitted) {
    if (!filled) {
        return '未找到合适的输入框，请手动填写';
    }
    if (submitted) {
        return '填充成功并已尝试自动提交';
    }
    return '填充成功，请手动提交';
} 