# OrientSquare — static site

Статическая копия сайта OrientSquare Real Estate. 7 страниц, каждая — самодостаточный HTML
со встроенным Tailwind CSS (интернет для стилей не нужен).

| Файл | Страница |
|---|---|
| `index.html` | Home |
| `properties.html` | Real Estate / Properties |
| `news.html` | News |
| `sold.html` | Sold Projects |
| `favorites.html` | Favorites |
| `about.html` | About Us |
| `auth.html` | Sign In / Sign Up |

## Дизайн-токены

- primary: `50 #FFF3E0` · `100 #FFE0B2` · `200 #FFCC80` · `300 #FFB74D` · `400 #FFA726` ·
  `500/700 #F57C00` · `600 #FB8C00` · `800 #EF6C00` · `900 #E65100`
- gray (Material): `50 #FAFAFA` · `100 #F5F5F5` · `200 #EEEEEE` · `300 #E0E0E0` ·
  `400 #BDBDBD` · `500 #9E9E9E` · `600 #757575` · `700 #616161` · `800 #424242` · `900 #333333`
- шрифт: `ui-sans-serif, system-ui, sans-serif, …` + `@font-face Inter (local)`
- иконки: Lucide, встроены как inline SVG

## Фон главной страницы

Герой на `index.html` использует `assets/hero-skyline.png`. Если файла нет,
подгружается оригинал с `https://orientsquare.com/IMG_5708-Photoroom.png`,
а без интернета остаётся заливка `#FFF3E0`.

## Уведомления (toast)

`toast.js` — всплывающие уведомления в правом нижнем углу, порт Geist-компонента на
чистом JS. Без сборки, без React, без зависимостей: стили внедряются при первом вызове,
Tailwind не нужен. Подключён на всех страницах через `<script src="toast.js" defer>`,
глобальный объект — `Toast`.

```js
Toast.message("Черновик сохранён.");
Toast.success("Квартира 4B забронирована.");
Toast.warning("Цена за м² ещё не указана.");
Toast.error("Не удалось загрузить объявления.");

// кнопка «отменить»
Toast.message({ text: "Удалено из избранного.", onUndoAction: () => restore(id) });

// действие, без автозакрытия
Toast.message({
  text: "Забронировать квартиру 4B?",
  preserve: true,              // не закрывать по таймеру
  action: "Забронировать",     // подпись основной кнопки
  dismissLabel: "Отмена",      // подпись второй кнопки (по умолчанию "Dismiss")
  onAction: () => reserve(id)
});

Toast.remove(id);  // закрыть конкретный
Toast.clear();     // закрыть все
```

Поведение: автозакрытие через 3 с; видны последние три, остальные складываются под ними;
при наведении стек раскрывается и таймеры встают на паузу. Тёмная тема — по
`prefers-color-scheme` или классу `.dark`. Живые примеры — `design-system.html`, раздел
«Компоненты → Уведомления».

## Что не работает

Бэкенда нет: формы не отправляются, списки объектов/новостей/команды пустые
(они пустые и на живом сайте).
