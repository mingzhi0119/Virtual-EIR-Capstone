// Reuse the actual GOAT appearance engine and Lucide icons; do not fork tokens.
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server.browser'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { buildMathRenderPlan, normalizeDisplayMathMarkdown } from '../../apps/goat/frontend/src/utils/mathRendering'
import { ArrowUp, Brain, Check, Cpu, ExternalLink, MessageSquare, Plus, Settings, SquarePen, UserRound, X, ZodiacCapricorn } from 'lucide-react'
import { applyAppearanceToRoot, DEFAULT_APPEARANCE_CONFIG, getSystemPrefersDark, loadStoredAppearance, persistAppearanceConfig, sanitizeAppearanceConfig, type AppearanceConfig } from '../../apps/goat/frontend/src/utils/appearance'
export { getComputedThemeTokens, sanitizeAppearanceConfig } from '../../apps/goat/frontend/src/utils/appearance'

const icons = { goat: ZodiacCapricorn, new: SquarePen, plus: Plus, settings: Settings, profile: UserRound, memory: Brain, model: Cpu, send: ArrowUp, close: X, check: Check, external: ExternalLink, chat: MessageSquare }
export function paintIcons(root: ParentNode = document): void {
  for (const element of root.querySelectorAll<HTMLElement>('[data-icon]')) {
    const Icon = icons[element.dataset.icon as keyof typeof icons]
    if (Icon) element.innerHTML = renderToStaticMarkup(React.createElement(Icon, { size: 17, strokeWidth: 2, 'aria-hidden': true }))
  }
}
export function renderMarkdown(text: string): string {
  // React escapes content. Markdown raw HTML is skipped; default URL sanitization stays enabled.
  // Malformed dollar amounts from the model are currency, not an unclosed display equation.
  const currencySafe = text.replace(/\$(?:\\)?\$(\d+(?:\.\d{1,2})?)\$(?!\$)/g, (_, amount: string) => '\\$' + amount)
  return renderToStaticMarkup(React.createElement(ReactMarkdown, {
    remarkPlugins: [remarkGfm, remarkMath], rehypePlugins: [[rehypeKatex, { trust: false }]], skipHtml: true,
    children: normalizeDisplayMathMarkdown(buildMathRenderPlan(currencySafe, false).renderedMarkdownPrefix),
    components: { img: ({ alt }) => React.createElement('span', null, alt || 'Image omitted') },
  }))
}
export function initializeAppearance(): void {
  let config: AppearanceConfig
  try { config = loadStoredAppearance(localStorage) } catch { config = DEFAULT_APPEARANCE_CONFIG }
  const style = document.getElementById('theme-style') as HTMLSelectElement
  const mode = document.getElementById('theme-mode') as HTMLSelectElement
  const apply = (): void => {
    applyAppearanceToRoot(document.documentElement, config, getSystemPrefersDark())
    style.value = config.themeStyle
    mode.value = config.themeMode
  }
  apply()
  const update = (): void => {
    config = sanitizeAppearanceConfig({ ...config, themeStyle: style.value, themeMode: mode.value })
    apply()
    try { persistAppearanceConfig(localStorage, config) } catch { /* Session-only appearance when storage is blocked. */ }
  }
  style.addEventListener('change', update)
  mode.addEventListener('change', update)
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', apply)
  paintIcons()
}
