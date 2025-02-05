// 监听来自popup的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log('收到填充请求:', request);
    
    if (request.action === 'fillAccount') {
        // 查找用户名和密码输入框
        const usernameInput = findUsernameInput();
        const passwordInput = findPasswordInput();
        
        console.log('找到输入框:', { usernameInput, passwordInput });
        
        // 填充账号密码
        if (usernameInput) {
            fillInput(usernameInput, request.username);
        }
        if (passwordInput) {
            fillInput(passwordInput, request.password);
        }

        // 尝试自动提交
        trySubmitForm(usernameInput, passwordInput);
    }
});

// 查找用户名输入框
function findUsernameInput() {
    const selectors = [
        'input[type="text"][name*="user"]',
        'input[type="email"]',
        'input[name*="account"]',
        'input[name*="email"]',
        'input[name*="login"]',
        'input[id*="user"]',
        'input[id*="email"]',
        'input[id*="login"]',
        'input[autocomplete="username"]',
        'input[placeholder*="用户"]',
        'input[placeholder*="邮箱"]',
        'input[placeholder*="账号"]',
        'input[type="text"]' // 最后尝试任何文本输入框
    ];

    return findVisibleInput(selectors);
}

// 查找密码输入框
function findPasswordInput() {
    const selectors = [
        'input[type="password"]',
        'input[name*="pass"]',
        'input[name*="pwd"]',
        'input[id*="pass"]',
        'input[id*="pwd"]',
        'input[autocomplete="current-password"]',
        'input[placeholder*="密码"]'
    ];

    return findVisibleInput(selectors);
}

// 查找可见的输入框
function findVisibleInput(selectors) {
    for (let selector of selectors) {
        const inputs = document.querySelectorAll(selector);
        for (let input of inputs) {
            if (isVisible(input) && !input.value) {
                return input;
            }
        }
    }
    return null;
}

// 检查元素是否可见
function isVisible(element) {
    if (!element) return false;
    
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    
    return rect.width > 0 && 
           rect.height > 0 && 
           style.visibility !== 'hidden' &&
           style.display !== 'none' &&
           style.opacity !== '0' &&
           !element.disabled &&
           element.type !== 'hidden' &&
           element.getAttribute('aria-hidden') !== 'true';
}

// 填充输入框并触发相关事件
function fillInput(input, value) {
    try {
        // 聚焦输入框
        input.focus();
        
        // 清除现有值
        input.value = '';
        triggerEvent(input, 'input');
        
        // 设置新值
        input.value = value;
        
        // 触发所有相关事件
        triggerEvent(input, 'input');
        triggerEvent(input, 'change');
        triggerEvent(input, 'blur');
        
        console.log(`成功填充输入框:`, input);
        return true;
    } catch (e) {
        console.error('填充输入框失败:', e);
        return false;
    }
}

// 触发事件
function triggerEvent(element, eventName) {
    const event = new Event(eventName, { bubbles: true, cancelable: true });
    element.dispatchEvent(event);
}

// 尝试自动提交表单
function trySubmitForm(usernameInput, passwordInput) {
    if (!usernameInput || !passwordInput) return;
    
    // 获取包含这些输入框的表单
    const form = usernameInput.form || passwordInput.form;
    if (!form) return;
    
    // 查找提交按钮
    const submitButton = form.querySelector([
        'button[type="submit"]',
        'input[type="submit"]',
        'button[class*="submit"]',
        'button[class*="login"]',
        'button[id*="submit"]',
        'button[id*="login"]',
        'a[class*="submit"]',
        'a[class*="login"]'
    ].join(','));
    
    if (submitButton) {
        console.log('找到提交按钮，尝试自动提交');
        setTimeout(() => {
            submitButton.click();
        }, 500); // 延迟500ms后提交，给页面js时间处理输入
    }
} 