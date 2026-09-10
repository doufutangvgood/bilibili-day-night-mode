// ==UserScript==
// @name         哔哩哔哩日夜间模式
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  静默跟随系统自动切换哔哩哔哩日间/夜间（深色）模式，全站生效。不弹窗、不闪烁。
// @author       Bowen
// @match        *://*.bilibili.com/*
// @grant        GM_addStyle
// @run-at       document-start
// ==/UserScript==

// 原理：
// 1. 首页用 bili_dark，视频/其他页用 night-mode（两 class 互斥，同一页面只出现一种）
// 2. 直接增删 <html> 上的 class 即可即时生效（light_u.css 和 dark.css 常驻加载）
// 3. 同步 theme_style cookie（设为 dark 或 light，而非 auto），确保与原生代码无冲突
// 全程静默，不弹窗、不模拟点击、不闪烁。

(function () {
    "use strict";

    var darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
    var docEl = document.documentElement;

    // 当前页面对应的深色 class 名（首页 bili_dark，其他页 night-mode）
    function darkClass() {
        return location.hostname === "www.bilibili.com" && location.pathname === "/"
            ? "bili_dark"
            : "night-mode";
    }

    function isPageDark() {
        return docEl.classList.contains(darkClass());
    }

    function needsSwitch() {
        return isPageDark() !== darkQuery.matches;
    }

    function setCookie(value) {
        document.cookie =
            "theme_style=" +
            value +
            "; path=/; domain=.bilibili.com; max-age=31536000; SameSite=Lax";
    }

    function applyTheme() {
        if (!needsSwitch()) return;

        var cls = darkClass();
        var isDark = darkQuery.matches;

        // 写 cookie（dark / light，不写 auto，避免原生按 auto 逻辑抢回去）
        setCookie(isDark ? "dark" : "light");

        // 切 class
        docEl.classList.toggle(cls, isDark);
    }

    // 初次立即应用（document-start 已确保 <html> 可访问）
    applyTheme();

    // DOM 完整就绪后再校正一次
    document.addEventListener("DOMContentLoaded", applyTheme);
    window.addEventListener("load", applyTheme);

    // 系统主题变化时跟随
    if (darkQuery.addEventListener) {
        darkQuery.addEventListener("change", applyTheme);
    } else if (darkQuery.addListener) {
        darkQuery.addListener(applyTheme);
    }
})();
