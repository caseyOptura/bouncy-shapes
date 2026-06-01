export const THEMES = [
  { name: 'Sage',  background: '#f2ede4', shapeColors: ['#7aab98','#c49aa0','#9ba8c4','#c9a882','#a8b87a','#c09a7a'] },
  { name: 'Dusk',  background: '#2b2b3a', shapeColors: ['#e07a5f','#f2cc8f','#81b29a','#f4a261','#e9c46a','#a8dadc'] },
  { name: 'Ocean', background: '#e8f1f2', shapeColors: ['#1b6ca8','#2a9d8f','#52b788','#90e0ef','#48cae4','#0096c7'] },
  { name: 'Candy', background: '#fff0f6', shapeColors: ['#ff70a6','#ff9770','#ffd670','#70d6ff','#e9ff70','#c77dff'] },
]
export function nextThemeIndex(i) { return (i + 1) % THEMES.length }
