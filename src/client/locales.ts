/** Simplified Chinese + English dictionaries for the settings section. */
export type BratKey = 'title' | 'description'

export const zh: Record<BratKey, string> = {
  title: '插件管理',
  description: '输入 GitHub 仓库链接安装、更新、删除、启停 dsh 插件。',
}

export const en: Record<BratKey, string> = {
  title: 'Plugin Manager',
  description: 'Install, update, remove and toggle dsh plugins from a GitHub URL.',
}
