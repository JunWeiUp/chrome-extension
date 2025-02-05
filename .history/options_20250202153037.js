// 当文档加载完成时执行
document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const passwordList = document.getElementById('passwordList');
    const searchInput = document.getElementById('searchInput');

    // 从存储中加载所有密码
    function loadPasswords() {
        chrome.storage.local.get(['passwords'], function(result) {
            const passwords = result.passwords || [];
            displayPasswords(passwords);
        });
    }

    // 显示密码列表
    function displayPasswords(passwords) {
        passwordList.innerHTML = '';
        passwords.forEach((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${escapeHtml(item.website)}</td>
                <td>${escapeHtml(item.username)}</td>
                <td>
                    <span class="password-mask">••••••••</span>
                    <span class="password-text" style="display:none">${escapeHtml(item.password)}</span>
                    <button class="toggle-password">显示</button>
                </td>
                <td>
                    <button class="edit-btn" data-index="${index}">编辑</button>
                    <button class="delete-btn" data-index="${index}">删除</button>
                </td>
            `;
            passwordList.appendChild(row);

            // 为显示/隐藏密码按钮添加事件监听
            const toggleBtn = row.querySelector('.toggle-password');
            const passwordMask = row.querySelector('.password-mask');
            const passwordText = row.querySelector('.password-text');
            
            toggleBtn.addEventListener('click', function() {
                if (passwordMask.style.display !== 'none') {
                    passwordMask.style.display = 'none';
                    passwordText.style.display = 'inline';
                    toggleBtn.textContent = '隐藏';
                } else {
                    passwordMask.style.display = 'inline';
                    passwordText.style.display = 'none';
                    toggleBtn.textContent = '显示';
                }
            });

            // 为删除按钮添加事件监听
            const deleteBtn = row.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', function() {
                if (confirm('确定要删除这条记录吗？')) {
                    passwords.splice(index, 1);
                    chrome.storage.local.set({ passwords }, function() {
                        loadPasswords();
                    });
                }
            });

            // 为编辑按钮添加事件监听
            const editBtn = row.querySelector('.edit-btn');
            editBtn.addEventListener('click', function() {
                const newWebsite = prompt('请输入新的网站地址:', item.website);
                const newUsername = prompt('请输入新的用户名:', item.username);
                const newPassword = prompt('请输入新的密码:', item.password);

                if (newWebsite && newUsername && newPassword) {
                    passwords[index] = {
                        website: newWebsite,
                        username: newUsername,
                        password: newPassword
                    };
                    chrome.storage.local.set({ passwords }, function() {
                        loadPasswords();
                    });
                }
            });
        });
    }

    // 搜索功能
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        chrome.storage.local.get(['passwords'], function(result) {
            const passwords = result.passwords || [];
            const filteredPasswords = passwords.filter(item => 
                item.website.toLowerCase().includes(searchTerm) ||
                item.username.toLowerCase().includes(searchTerm)
            );
            displayPasswords(filteredPasswords);
        });
    });

    // HTML转义函数，防止XSS攻击
    function escapeHtml(unsafe) {
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