// 监听来自popup的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log('收到消息:', request);
    
    if (request.action === 'fillForm') {
        const result = fillFormFields(request.username, request.password);
        sendResponse(result);
    }
    return true; // 保持消息通道开启
});

// 填充表单的具体实现
function fillFormFields(username, password) {
    console.log('开始填充表单:', username, password);
    
    // 用户名输入框选择器
    const usernameSelectors = [
        'input[type="text"][name*="user"]',
        'input[type="email"]',
        'input[name*="account"]',
        'input[name*="email"]',
        'input[autocomplete="username"]',
        'input[name*="login"]',
        'input[id*="user"]',
        'input[id*="email"]',
        'input[id*="login"]',
        'input[class*="user"]',
        'input[class*="email"]',
        'input[class*="login"]',
        'input[placeholder*="用户"]',
        'input[placeholder*="邮箱"]',
        'input[placeholder*="账号"]',
        'input[type="text"]'
    ];

    // 密码输入框选择器
    const passwordSelectors = [
        'input[type="password"]',
        'input[name*="pass"]',
        'input[name*="pwd"]',
        'input[autocomplete="current-password"]',
        'input[id*="pass"]',
        'input[id*="pwd"]',
        'input[class*="pass"]',
        'input[class*="pwd"]',
        'input[placeholder*="密码"]'
    ];

    let usernameInput = null;
    let passwordInput = null;

    // 查找用户名输入框
    for (let selector of usernameSelectors) {
        const inputs = document.querySelectorAll(selector);
        for (let input of inputs) {
            if (isVisible(input)) {
                usernameInput = input;
                break;
            }
        }
        if (usernameInput) break;
    }

    // 查找密码输入框
    for (let selector of passwordSelectors) {
        const inputs = document.querySelectorAll(selector);
        for (let input of inputs) {
            if (isVisible(input)) {
                passwordInput = input;
                break;
            }
        }
        if (passwordInput) break;
    }

    console.log('找到的输入框:', {usernameInput, passwordInput});

    let filled = false;

    // 填充表单
    if (usernameInput) {
        try {
            usernameInput.value = username;
            usernameInput.dispatchEvent(new Event('input', { bubbles: true }));
            usernameInput.dispatchEvent(new Event('change', { bubbles: true }));
            filled = true;
        } catch (e) {
            console.error('填充用户名失败:', e);
        }
    }

    if (passwordInput) {
        try {
            passwordInput.value = password;
            passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
            passwordInput.dispatchEvent(new Event('change', { bubbles: true }));
            filled = true;
        } catch (e) {
            console.error('填充密码失败:', e);
        }
    }

    // 尝试自动提交表单
    if (filled && usernameInput && passwordInput) {
        const form = usernameInput.form || passwordInput.form;
        if (form) {
            const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
            if (submitButton) {
                submitButton.click();
            }
        }
    }

    return {
        success: filled,
        message: filled ? '填充成功' : '未找到合适的输入框，请手动填写'
    };
}

// 检查元素是否可见
function isVisible(element) {
    try {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return !!(
            rect.width && 
            rect.height && 
            element.getClientRects().length
        ) && 
        style.visibility !== 'hidden' &&
        style.display !== 'none' &&
        style.opacity !== '0' &&
        element.type !== 'hidden' &&
        !element.disabled &&
        element.getAttribute('aria-hidden') !== 'true';
    } catch (e) {
        console.error('检查元素可见性失败:', e);
        return false;
    }
} 