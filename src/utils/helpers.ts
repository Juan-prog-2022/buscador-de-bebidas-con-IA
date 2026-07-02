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

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatProfitMargin(margin: number) {
  return `${margin.toFixed(1)}%`
}
