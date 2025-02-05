// 当文档加载完成时执行
document.addEventListener("DOMContentLoaded", function () {
  // 获取DOM元素
  const passwordList = document.getElementById("passwordList");
  const searchInput = document.getElementById("searchInput");
  const toggleAllBtn = document.getElementById("toggleAllPasswords");
  const exportBtn = document.getElementById('exportPasswords');
  let isAllPasswordsVisible = false;

  // 添加全局显示/隐藏密码的功能
  function toggleAllPasswords(show) {
    const passwordMasks = document.querySelectorAll(".password-mask");
    const passwordTexts = document.querySelectorAll(".password-text");
    const toggleBtns = document.querySelectorAll(".toggle-password");

    passwordMasks.forEach((mask) => {
      mask.style.display = show ? "none" : "inline";
    });
    passwordTexts.forEach((text) => {
      text.style.display = show ? "inline" : "none";
    });
    toggleBtns.forEach((btn) => {
      btn.textContent = show ? "隐藏" : "显示";
    });
  }

  // 为全局显示/隐藏按钮添加事件监听
  toggleAllBtn.addEventListener("click", function () {
    isAllPasswordsVisible = !isAllPasswordsVisible;
    toggleAllBtn.textContent = isAllPasswordsVisible
      ? "隐藏所有密码"
      : "显示所有密码";
    toggleAllPasswords(isAllPasswordsVisible);
  });

  // 从存储中加载所有密码
  function loadPasswords() {
    // 获取当前标签页的URL
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      // 从chrome.storage.local中获取所有保存的密码
      chrome.storage.local.get(null, function (items) {
        console.log("ddd", items);
        let passwords = [];
        // 遍历所有存储的项目
        for (let key in items) {
          items[key].forEach((item) => {
            console.log("key", item);
            // 将密码信息添加到数组中
            passwords.push({
              website: key, // 移除'pwd_'前缀
              username: item.username,
              password: item.password,
            });
          });
        }

        displayPasswords(passwords);
      });
    });
  }

  // 显示密码列表
  function displayPasswords(passwords) {
    passwordList.innerHTML = "";
    passwords.forEach((item, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
                <td>${escapeHtml(item.website)}</td>
                <td>${escapeHtml(item.username)}</td>
                <td>
                    <span class="password-mask">••••••••</span>
                    <span class="password-text" style="display:none">${escapeHtml(
                      item.password
                    )}</span>
                    <button class="toggle-password">显示</button>
                </td>
                <td>
                    <button class="edit-btn" data-index="${index}">编辑</button>
                    <button class="delete-btn" data-index="${index}">删除</button>
                </td>
            `;
      passwordList.appendChild(row);

      // 为显示/隐藏密码按钮添加事件监听
      const toggleBtn = row.querySelector(".toggle-password");
      const passwordMask = row.querySelector(".password-mask");
      const passwordText = row.querySelector(".password-text");

      toggleBtn.addEventListener("click", function () {
        if (passwordMask.style.display !== "none") {
          passwordMask.style.display = "none";
          passwordText.style.display = "inline";
          toggleBtn.textContent = "隐藏";
        } else {
          passwordMask.style.display = "inline";
          passwordText.style.display = "none";
          toggleBtn.textContent = "显示";
        }
      });

      // 为删除按钮添加事件监听
      const deleteBtn = row.querySelector(".delete-btn");
      deleteBtn.addEventListener("click", function () {
        if (confirm("确定要删除这条记录吗？")) {
          chrome.storage.local.get(item.website, function(result) {
            const passwords = result[item.website] || [];
            // 找到并删除匹配的密码记录
            const updatedPasswords = passwords.filter(
              pwd => pwd.username !== item.username || pwd.password !== item.password
            );
            
            if (updatedPasswords.length === 0) {
              // 如果没有剩余密码，删除整个网站记录
              chrome.storage.local.remove(item.website, function() {
                loadPasswords();
              });
            } else {
              // 更新网站的密码列表
              chrome.storage.local.set({
                [item.website]: updatedPasswords
              }, function() {
                loadPasswords();
              });
            }
          });
        }
      });

      // 为编辑按钮添加事件监听
      const editBtn = row.querySelector(".edit-btn");
      editBtn.addEventListener("click", function () {
        const newWebsite = prompt("请输入新的网站地址:", item.website);
        const newUsername = prompt("请输入新的用户名:", item.username);
        const newPassword = prompt("请输入新的密码:", item.password);

        if (newWebsite && newUsername && newPassword) {
          // 删除旧的记录
          const oldKey = "pwd_" + item.website;
          chrome.storage.local.remove(oldKey, function () {
            // 添加新的记录
            const newKey = "pwd_" + newWebsite;
            chrome.storage.local.set(
              {
                [newKey]: {
                  username: newUsername,
                  password: newPassword,
                },
              },
              function () {
                loadPasswords();
              }
            );
          });
        }
      });
    });
  }

  // 搜索功能
  searchInput.addEventListener("input", function (e) {
    const searchTerm = e.target.value.toLowerCase();
    // 从chrome.storage.local中获取所有保存的密码
    chrome.storage.local.get(null, function (items) {
      let passwords = [];
      // 遍历所有存储的项目
      for (let key in items) {
        console.log("key", key, searchTerm);
        items[key].forEach((item) => {
          if (
            key.toLowerCase().includes(searchTerm) ||
            item.username?.toLowerCase().includes(searchTerm)
          ) {
            passwords.push({
              website: key,
              username: item.username,
              password: item.password,
            });
          }
        });
      }
      displayPasswords(passwords);
    });
  });

  // 添加导出功能
  exportBtn.addEventListener('click', function() {
    chrome.storage.local.get(null, function(items) {
      let exportData = [];
      
      // 遍历所有存储的项目
      for (let key in items) {
        items[key].forEach(item => {
          exportData.push({
            website: key,
            username: item.username,
            password: item.password
          });
        });
      }
      
      // 创建 Blob 对象
      const blob = new Blob(
        [JSON.stringify(exportData, null, 2)], 
        { type: 'application/json' }
      );
      
      // 创建下载链接
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `passwords_${new Date().toISOString().split('T')[0]}.json`;
      
      // 触发下载
      document.body.appendChild(a);
      a.click();
      
      // 清理
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);
    });
  });

  // HTML转义函数，防止XSS攻击
  function escapeHtml(unsafe) {
    return unsafe;

    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // 自动填充账号密码
  function fillAccount(index) {
    chrome.storage.local.get([currentUrl], function(result) {
        const accounts = result[currentUrl] || [];
        const account = accounts[index];
        
        if (!account) {
            alert('未找到账号信息');
            return;
        }

        // 注入填充脚本
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const tabId = tabs[0].id;
            
            // 首先注入辅助函数
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: fillFormFields,
                args: [account.username, account.password]
            });
        });
    });
  }

  // 填充表单的具体实现
  function fillFormFields(username, password) {
    // 常见的用户名输入框选择器
    const usernameSelectors = [
        'input[type="text"][name*="user"]',
        'input[type="email"]',
        'input[name*="account"]',
        'input[name*="email"]',
        'input[autocomplete="username"]',
        'input[name*="login"]'
    ];

    // 常见的密码输入框选择器
    const passwordSelectors = [
        'input[type="password"]',
        'input[name*="pass"]',
        'input[autocomplete="current-password"]'
    ];

    // 查找输入框
    let usernameInput = null;
    let passwordInput = null;

    // 尝试找到用户名输入框
    for (let selector of usernameSelectors) {
        const input = document.querySelector(selector);
        if (input && isVisible(input)) {
            usernameInput = input;
            break;
        }
    }

    // 尝试找到密码输入框
    for (let selector of passwordSelectors) {
        const input = document.querySelector(selector);
        if (input && isVisible(input)) {
            passwordInput = input;
            break;
        }
    }

    // 填充表单
    if (usernameInput) {
        usernameInput.value = username;
        // 触发输入事件
        usernameInput.dispatchEvent(new Event('input', { bubbles: true }));
        usernameInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    if (passwordInput) {
        passwordInput.value = password;
        // 触发输入事件
        passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
        passwordInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // 检查是否成功填充
    if (!usernameInput || !passwordInput) {
        alert('未找到登录表单，请手动填写');
    }
  }

  // 检查元素是否可见
  function isVisible(element) {
    return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length) &&
        window.getComputedStyle(element).visibility !== 'hidden';
  }

  // 初始加载密码列表
  loadPasswords();
});
