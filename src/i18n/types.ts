import type en from './locales/en.json'

type FlattenKeys<T, Prefix extends string = ''> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? FlattenKeys<T[K], `${Prefix}${K}.`>
          : `${Prefix}${K}`
        : never
    }[keyof T]
  : never

export type TranslationKey = FlattenKeys<typeof en>
export type Locale = 'en' | 'ja'
