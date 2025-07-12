/**
 * DOM utilities for the chat widget
 */

export function createElement(tag: string, className?: string, innerHTML?: string): HTMLElement {
  const element = document.createElement(tag)
  if (className) element.className = className
  if (innerHTML) element.innerHTML = innerHTML
  return element
}

export function createSVGIcon(path: string, className?: string): SVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('fill', 'currentColor')
  if (className) svg.setAttribute('class', className)
  
  const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  pathElement.setAttribute('d', path)
  svg.appendChild(pathElement)
  
  return svg
}

export function formatTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    return 'Now'
  }
  return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

export function isElementInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect()
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  )
}

export function scrollToBottom(element: HTMLElement, smooth = true): void {
  element.scrollTo({
    top: element.scrollHeight,
    behavior: smooth ? 'smooth' : 'auto'
  })
}