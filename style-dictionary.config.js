import StyleDictionary from 'style-dictionary'

// Custom format: 產生 Tailwind v4 的 @theme inline 區塊
// 自動把 token 名加上 color- prefix，映射回原始 CSS 變數
StyleDictionary.registerFormat({
  name: 'tailwind/v4-theme',
  format: ({ dictionary }) => {
    const vars = dictionary.allTokens
      .map(token => `  --color-${token.name}: var(--${token.name});`)
      .join('\n')
    return `@theme inline {\n${vars}\n}\n`
  },
})

const sd = new StyleDictionary({
  source: ['src/config/tokens.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'src/generated/',
      files: [
        {
          destination: 'tokens.css',
          format: 'css/variables',
          options: {
            selector: ':root',
            outputReferences: false,
          },
        },
        {
          destination: 'theme-inline.css',
          format: 'tailwind/v4-theme',
        },
      ],
    },
  },
})

await sd.buildAllPlatforms()
