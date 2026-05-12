import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "Cove 产品手册",
  description: "OfficeAI Cove 产品说明文档",
  base: '/product-manual/',
  srcDir: '.',

  ignoreDeadLinks: true,

  head: [
    ['link', { rel: 'icon', href: '/favicon.svg' }],
  ],

  themeConfig: {
    logo: '/cove-logo.png',
    search: {
      provider: 'local',
    },

    nav: [
      { text: 'Cove 产品手册', link: '/cove/' },
      { text: '客户端手册', link: '/cove/client/' },
      { text: '服务端手册', link: '/cove/admin/' },
      { text: '更新日志', link: '/cove/changelog/' },
    ],

    sidebar: {
      '/cove/client/': [
        {
          text: '客户端手册',
          items: [
            { text: '产品简介', link: '/cove/client/' },
            { text: '安装与登录', link: '/cove/client/01-安装与登录' },
            { text: '界面速览', link: '/cove/client/02-界面速览' },
            {
              text: '功能详解',
              items: [
                { text: '校对', link: '/cove/client/03-01-校对' },
                { text: '排版', link: '/cove/client/03-02-排版' },
                { text: '校审', link: '/cove/client/03-03-校审' },
                { text: '翻译', link: '/cove/client/03-04-翻译' },
                { text: '总结', link: '/cove/client/03-05-总结' },
                { text: '改写', link: '/cove/client/03-06-改写' },
                { text: '润色', link: '/cove/client/03-07-润色' },
                { text: '小工具', link: '/cove/client/03-08-小工具' },
              ],
            },
            { text: '常见问题', link: '/cove/client/04-常见问题' },
          ],
        },
      ],
      '/cove/admin/': [
        {
          text: '服务端手册',
          items: [
            { text: '产品概述', link: '/cove/admin/' },
            { text: '环境准备', link: '/cove/admin/01-环境准备' },
            { text: '服务端部署', link: '/cove/admin/02-服务端部署' },
            { text: '大模型配置', link: '/cove/admin/03-大模型配置' },
            { text: '用户管理', link: '/cove/admin/04-用户管理' },
            { text: '任务与指令', link: '/cove/admin/05-任务与指令' },
            { text: '技能库', link: '/cove/admin/06-技能库' },
            { text: '安全配置', link: '/cove/admin/07-安全配置' },
            { text: '仪表盘', link: '/cove/admin/08-仪表盘' },
            { text: '常见问题', link: '/cove/admin/09-常见问题' },
          ],
        },
      ],
      '/cove/changelog/': [
        { text: '更新日志', link: '/cove/changelog/' },
      ],
      '/cove/whitepaper/': [
        { text: '产品白皮书', link: '/cove/whitepaper/' },
      ],
    },

    footer: {
      message: '用 AI 解锁新质生产力',
      copyright: '© 2026 OfficeAI Cove',
    },
  },
})
