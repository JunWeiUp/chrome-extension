// 当文档加载完成时执行
document.addEventListener("DOMContentLoaded", function () {
  // 获取DOM元素
  const passwordList = document.getElementById("passwordList");
  const searchInput = document.getElementById("searchInput");
  const toggleAllBtn = document.getElementById("toggleAllPasswords");
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
          const key = "pwd_" + item.website;
          chrome.storage.local.remove(key, function () {
            loadPasswords();
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
        if (
          key.toLowerCase().includes(searchTerm) ||
          items[key].username?.toLowerCase().includes(searchTerm)
        ) {
          passwords.push({
            website: key,
            username: items[key].username,
            password: items[key].password,
          });
        }
      }
      displayPasswords(passwords);
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

  // 初始加载密码列表
  loadPasswords();
});
