// Reuse the actual GOAT appearance engine and Lucide icons; do not fork tokens.
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server.browser'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { buildMathRenderPlan, normalizeDisplayMathMarkdown } from '../../apps/goat/frontend/src/utils/mathRendering'
import { ArrowUp, Brain, Check, Cpu, ExternalLink, MessageSquare, Plus, Settings, SquarePen, UserRound, X, Compass } from 'lucide-react'
import { applyAppearanceToRoot, APPEARANCE_STORAGE_KEY, DEFAULT_APPEARANCE_CONFIG, getSystemPrefersDark, getStyleAccentPresets, loadStoredAppearance, persistAppearanceConfig, sanitizeAppearanceConfig, THEME_STYLES, UI_FONT_OPTIONS, type AppearanceConfig } from '../../apps/goat/frontend/src/utils/appearance'
export { getComputedThemeTokens, sanitizeAppearanceConfig } from '../../apps/goat/frontend/src/utils/appearance'

const icons = { goat: Compass, new: SquarePen, plus: Plus, settings: Settings, profile: UserRound, memory: Brain, model: Cpu, send: ArrowUp, close: X, check: Check, external: ExternalLink, chat: MessageSquare }
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
  const defaults = sanitizeAppearanceConfig({ ...DEFAULT_APPEARANCE_CONFIG, themeStyle: 'urochester', accentColor: getStyleAccentPresets('urochester')[0] })
  let config: AppearanceConfig
  try { config = localStorage.getItem(APPEARANCE_STORAGE_KEY) ? loadStoredAppearance(localStorage) : defaults } catch { config = defaults }
  const style = document.getElementById('theme-style') as HTMLSelectElement
  const mode = document.getElementById('theme-mode') as HTMLSelectElement
  const accent = document.getElementById('theme-accent') as HTMLInputElement
  const font = document.getElementById('theme-font') as HTMLSelectElement
  const contrast = document.getElementById('theme-contrast') as HTMLInputElement
  const translucent = document.getElementById('theme-translucent') as HTMLInputElement
  // The archived read-only showcase still supplies the original two controls.
  const presets = document.getElementById('theme-presets')
  style.replaceChildren(...THEME_STYLES.map(theme => new Option(theme.label, theme.id)))
  font?.replaceChildren(...UI_FONT_OPTIONS.map(option => new Option(option.label, option.id)))
  const apply = (): void => {
    applyAppearanceToRoot(document.documentElement, config, getSystemPrefersDark())
    style.value = config.themeStyle
    mode.value = config.themeMode
    if (accent) accent.value = config.accentColor
    if (font) font.value = config.uiFont
    if (contrast) contrast.value = String(config.contrast)
    if (translucent) translucent.checked = config.translucentSidebar
    const contrastValue = document.getElementById('theme-contrast-value')
    if (contrastValue) contrastValue.textContent = String(config.contrast)
    for (const button of presets?.querySelectorAll<HTMLButtonElement>('button') || []) button.setAttribute('aria-pressed', String(button.dataset.color === config.accentColor))
  }
  const update = (patch: Partial<AppearanceConfig>): void => {
    config = sanitizeAppearanceConfig({ ...config, ...patch })
    apply()
    try { persistAppearanceConfig(localStorage, config) } catch { /* Session-only appearance when storage is blocked. */ }
  }
  const renderPresets = (): void => {
    presets?.replaceChildren(...getStyleAccentPresets(config.themeStyle).map(color => {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'theme-swatch'
      button.style.background = color; button.dataset.color = color; button.setAttribute('aria-label', `Accent ${color}`)
      button.onclick = () => update({ accentColor: color }); return button
    }))
  }
  style.addEventListener('change', () => { update({ themeStyle: style.value as AppearanceConfig['themeStyle'], accentColor: getStyleAccentPresets(style.value as AppearanceConfig['themeStyle'])[0] }); renderPresets(); apply() })
  mode.addEventListener('change', () => update({ themeMode: mode.value as AppearanceConfig['themeMode'] }))
  accent?.addEventListener('input', () => update({ accentColor: accent.value }))
  font?.addEventListener('change', () => update({ uiFont: font.value as AppearanceConfig['uiFont'] }))
  contrast?.addEventListener('input', () => update({ contrast: Number(contrast.value) }))
  translucent?.addEventListener('change', () => update({ translucentSidebar: translucent.checked }))
  document.getElementById('theme-reset')?.addEventListener('click', () => { update(defaults); renderPresets(); apply() })
  renderPresets(); apply()
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', apply)
  paintIcons()
}
