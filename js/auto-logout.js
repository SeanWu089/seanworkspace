(function() {
    // 只在用户登录状态下初始化
    if (document.cookie.includes('authenticated=true') || localStorage.getItem('authenticated')) {
        const TIMEOUT_DURATION = 20 * 60 * 1000;
        let timeoutId;

        function resetTimer() {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(logout, TIMEOUT_DURATION);
        }

        function logout() {
            // 清除认证状态
            document.cookie = 'authenticated=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            localStorage.removeItem('authenticated');
            
            // 重定向到登录页
            window.location.href = '/account.html';
        }

        document.addEventListener('mousemove', resetTimer);
        document.addEventListener('keypress', resetTimer);
        document.addEventListener('click', resetTimer);

        resetTimer();
    }
})();