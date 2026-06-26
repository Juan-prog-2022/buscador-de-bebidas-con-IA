export function getPlaceholderImg(name: string) {
  return `https://picsum.photos/seed/${encodeURIComponent(name)}/400/300`
}

export function getEmoji(type: string) {
  switch (type) {
    case 'drink': return '🍸'
    case 'dessert': return '🍰'
    default: return '🍽️'
  }
}
