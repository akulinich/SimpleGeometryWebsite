export const ui = {
  en: {
    'nav.articles': 'Articles',
    'nav.about': 'About',
    'home.latest': 'Recent articles',
    'home.intro': 'Hi. My name is Alex. I am a mathematician by training and have spent the last 10+ years developing geometry software in C++. In my free time I read books and articles on mathematics and algorithms. This site is my personal collection of notes and ideas that I found interesting.',
    'articles.heading': 'Articles',
    'articles.search': 'Search by title…',
    'articles.tag_filter': 'Filter by tag…',
    'articles.prev': '← Newer',
    'articles.next': 'Older →',
    'articles.empty': 'Nothing matches.',
    'articles.clear': 'Reset',
    'meta.description': 'Notes on geometry',
    'article.date': 'en-US',
    'home.ai_note': 'All article ideas and Russian-language text are written by me. The role of artificial intelligence is limited to proofreading, spell-checking, image generation, translation assistance, and the website itself.',
  },
  ru: {
    'nav.articles': 'Статьи',
    'nav.about': 'Об авторе',
    'home.latest': 'Последние статьи',
    'home.intro': 'Привет. Меня зовут Саша. Я занимаюсь разработкой программ, связанных с геометрией на C++, уже более 10 лет. Математик по образованию. В свободное время читаю книги и статьи по математике и алгоритмам. Этот сайт — мой личный сборник заметок и идей, которые показались мне интересными.',
    'articles.heading': 'Статьи',
    'articles.search': 'Поиск по названию…',
    'articles.tag_filter': 'Фильтр по тегу…',
    'articles.prev': '← Новее',
    'articles.next': 'Старее →',
    'articles.empty': 'Ничего не найдено.',
    'articles.clear': 'Сброс',
    'meta.description': 'Заметки о геометрии',
    'article.date': 'ru-RU',
    'home.ai_note': 'Все идеи статей и русскоязычный текст написаны мной. Участие искусственного интеллекта ограничивается проверкой синтаксиса, орфографии, генерацией картинок, помощью в переводе на английский и работой самого сайта.',
  },
} as const;

export type Lang = keyof typeof ui;
export type TranslationKey = keyof typeof ui['en'];

export function useTranslations(lang: Lang) {
  return (key: TranslationKey): string => ui[lang][key];
}
