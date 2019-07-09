Заготовка для Node.js проектов, с настроенными npm-скриптами, `eslint`'ом, `prettier`'ом, `source-map`'ами, `babel`'ем, `import`-ами/`export`-ами, алиасами в `import`-ах и автоматическим запуском линтера и форматирования при коммитах.

<details>
<summary>Старт проекта</summary>

Создать новый репозиторий на гитхабе/гитлабе/битбакете и получить его урл - `git@new_project_repository_url.git`

Затем склонировать к себе `node-starter`:

```bash
git clone git@github.com:antixrist/node-starter.git new-project-folder
```

И перейти в папку с новым проектом:

```
cd new-project-folder
```

Далее. Если необходимо сохранить историю коммитов из репозитория `node-starter`, выполнить:

```bash
git remote remove origin
git remote add origin git@new_project_repository_url.git
git push -u origin --all
git push -u origin --tags
```

А если нужно начать с чистого листа:

```bash
rm -rf ./.git
git init
git remote add origin git@new_project_repository_url.git
git add .
git commit -m "Initial commit"
git push -u origin master
```

И только после инициализации git'а можно устанавливать зависимости (иначе `husky` не установит свои хуки для гита):

```bash
npm ci
---
yarn
```

</details>

<details>
<summary>Переменные окружения</summary>

После клонирования проекта скопировать файл `.env.example` в `.env`.

_Что это за файл, зачем он нужен и почему его нельзя хранить в гите - читать [здесь](https://12factor.net/ru/config) и [здесь](https://github.com/motdotla/dotenv#faq)._

Вместо стандартного `dotenv` используется `dotenv-safe`, смысл которого тот же самый, но, ко всему прочему, этот пакет читает файл `.env.example` и при запуске приложения проверяет - установлены ли перечисленные в нём переменные окружения и, если нет, выдаёт ошибку.

</details>

<details>
<summary>FAQ по Babel ^7.4.0</summary>

## `loose: true`

http://2ality.com/2015/12/babel6-loose-mode.html

По умолчанию `babel` будет транспайлить код максимально близко к es6. Если включать опцию `loose`, то код будет полностью es5. Плюс - es5-код потенциально может быть быстрее, минус - могут быть проблемы совместимости при переходе на более высокую версию транспайлерного кода.
И, по большому счёту, эта опция нужна, чтобы поддерживать совсем уж динозавров, как IE8. Короче включать не советуют.

## `spec: true`

С этой опцией babel будет генерировать код, который полностью соответствует стандартам и обрабатывает больше нюансов и пограничных случаев. Плюсы - понятно, минусы - такой код будет медленней.
По умолчанию опция выключена, потому что эти нюансы в реальном коде встречаются чрезвычайно редко - генерация более быстрого кода предпочтительнее учёта всех возможных пограничных случаев.

## `@babel/plugin-transform-runtime`

https://babeljs.io/docs/en/next/babel-plugin-transform-runtime

`babel` в транспилированном коде использует свои небольшие (а иногда и очень даже большие) хэлперы - `_classCallCheck`, `_extend` и т.п. И по умолчанию код этих хэлперов инлайнится прямо в файл, где они используются. В каждый файл! Соответственно, код бессмысленно раздувается.
Чтобы пресечь эту дичь на корню, надо использовать `@babel/plugin-transform-runtime`.

Что он делает?

1. Заменяет все заинлайненные вызовы хэлперов на их `require`. Т.е. они не инлайнятся, а подключаются в виде зависимостей из `@babel/runtime`. Поэтому `@babel/runtime` нужно устанавливать в `dependencies`, чтобы хэлперы были доступны в рантайме. Отключается опцией `helpers` в конфиге плагина.

2. У плагина есть опция `corejs`, по умолчанию `false`.

- При значении `2` - `babel` заимпортит не только свои хэлперы, но ещё и используемые глобальные фичи (`Promise`, `WeakMap`, etc). Т.е. не заполифиллит их глобально, а заимпортит их из `core-js` и только там, где они используются, чтобы не изменять глобальный scope. Вместо `@babel/runtime` надо устанавливать `@babel/runtime-corejs2`.
- При значении `3` - то же самое, что и `2`, но require'иться будут не только глобальные фичи, но ещё и статические методы классов и методы из прототипов. Вместо `@babel/runtime` надо устанавливать `@babel/runtime-corejs3`.
  Т.е. `babel` из этого:

```javascript
Array.from(new Set([1, 2, 3, 2, 1]));
[1, [2, 3], [4, [5]]].flat(2);
```

сделает что-то вроде этого:

```javascript
import from from 'core-js-pure/stable/array/from';
import flat from 'core-js-pure/stable/array/flat';
import Set from 'core-js-pure/stable/set';

from(new Set([1, 2, 3, 2, 1]));
flat([1, [2, 3], [4, [5]]], 2);
```

Ничего нигде не полифиллится, а вызовы методов из прототипов заменяются статическими функциями.

Ещё раз - отличие `2` от `3` в том, что при значении `2` в примере выше будет заимпортен только `Set`, а вызовы `Array.from` и `.flat()` останутся без изменений и, если в среде выполнения они не доступны, то в рантайме будет ошибка.

В значении опции также можно указать `{ version: 2 | 3, proposals: true }` , чтобы импортились ещё и всякие там `String.matchAll`, `Promise.allSettled`, `Promise.try`, etc, которых ещё нет в стандарте.

3. `babel` по умолчанию все генераторы и async-функции транспайлит в код регенератора, но нигде не подключает его, подразумевая, что он доступен глобально. Опция `regenerator` (включена по умолчанию) добавляет импорт `@babel/runtime/regenerator` там, где используются генераторы и async-функции.

4. Опция `useESModules` (выключена по умолчанию). Нужна для того, чтобы не транспайлить `import`/`export` в CommonJS нотацию. Полезно, например, если в дальнейшем код проходит через webpack (tree shaking там или ещё что-нибудь).

В общем, `@babel/plugin-transform-runtime` нужно использовать при написании переиспользуемых библиотек, чтобы они были изолированными от внешней среды выполнения и не загрязняли глобальный scope полифиллами.

## `@babel/polyfill`

https://babeljs.io/docs/en/next/babel-polyfill

Состоит из `core-js` и `regenerator-runtime`. Расширяет статические методы классов (`Array.from`, `Object.assign`), добавляет недостающее в прототипы (`[].includes()`), полифиллит глобальное api (`Promise`, `WeakMap`).

Его нельзя использовать в библиотеках, потому что он меняет глобальный scope и расширяет прототипы.
И он, блеать, уже депрекейтнутый! В пользу прямого подключения:

```javascript
import 'core-js/stable';
import 'regenerator-runtime/runtime';
```

## `@babel/plugin-transform-modules-commonjs`

https://babeljs.io/docs/en/next/babel-plugin-transform-modules-commonjs

Понятно, что транспайлит `import`/`export` в CommonJS, но у него есть интересная опция - `lazy`. `babel` советует её включать при написании библиотек. Ну и ещё надо включить `strict`.

## `@babel/preset-env`

https://babeljs.io/docs/en/next/babel-preset-env

Не подключает плагины из `stage-x` пресетов. Поэтому такие вещи, как:

- `@babel/plugin-proposal-object-rest-spread`
- `@babel/plugin-proposal-export-default-from`
- `@babel/plugin-proposal-export-namespace-from`
- `@babel/plugin-proposal-class-properties`
- `@babel/plugin-proposal-do-expressions`
- `@babel/plugin-proposal-async-generator-functions` (асинхронные генераторы и `for await of`)
- `@babel/plugin-proposal-decorators`
- `@babel/plugin-proposal-private-methods`

и все остальные `proposal`-плагины надо устанавливать и прописывать в конфиге бабеля вручную.

Настройка:

- под ноду надо указывать `targets.node: true`, под фронт надо прописать нужные браузеры в `.browserlistrc`.

- `useBuiltIns`.

  - Самый нормальный вариант - `usage`. Это когда нужные полифиллы (все они берутся из `core-js`) импортятся только там, где они нужны. Если какой-то полифилл нужен в нескольких файлах, то он будет подключаться везде (это небольшой оверхед на самом деле).

  - Вариант `entry` - это надо вручную в точке входа прописать вот это:

  ```javascript
  import 'core-js/stable';
  import 'regenerator-runtime/runtime';
  ```

  И тогда импорт `core-js` будет заменён на импорт всех необходимых для работы кода полифиллов.

  Т.е. где бы ни было прописано `import "core-js";` - оно везде будет заменено на список необходимых полифиллов. Это может привести к проблемам, если подключение регенератора или каких-то полифиллов будет произведено несколько раз. Поэтому явные импорты регенератора и `core-js` надо прописывать в каждой точке входа единожды.

Т.о. с вариантом `entry` есть дополнительные нюансы, которые надо держать в голове, а `usage` - полный автомат.

- `corejs` - Т.к. все полифиллы подключаются из `core-js`, то в этой настройке можно указать используемую версию - `2` или `3`. Также можно указать в виде объекта с `proposals: true` (как у `@babel/plugin-transform-runtime`), чтобы к транспилированному коду ещё и добавлялись полифиллы к штукам, которых ещё нет в стандарте (но которые используются в коде) - всякие там `String.matchAll`, `Promise.allSettled`, `Promise.try` и т.д.

Но у `@babel/preset-env` есть нюанс - все бабелевские хэлперы всё так же инлайнятся в каждом файле. Т.е. если используются `async`-функции, а текущая версия ноды их не поддерживает, или используются асинхронные генераторы, которых ещё нет в стандарте, то эти жирные хэлперы будут инлайнится везде, где они используются. И вот это уже солидный оверхед (даже не из-за размера, если код пишется только под ноду, а из-за сильного раздутия исполняемого кода). И тут есть 2 варианта:

1. Вместе с `@babel/cli` в комплекте идёт `babel-external-helpers`. Это такая cli-тулза, которая выводит в stout код всех используемых бабелем хэлперов в виде готового исполняемого модуля. Поэтому можно сохранить всё это в отдельный файл, например так:

```bash
npx babel-external-helpers -t umd > ./src/babel-helpers.js
```

А вот чтобы бабель начал этот файл использовать, надо:

- подключить плагин `@babel/plugin-external-helpers` и тогда бабель вместо инлайнинга кода хэлперов будет ссылаться на них с помощью `babelHelpers.<helperName>`, т.е. в рантайме должна быть глобальная переменная `babelHelpers`, в которой будут доступны все хэлперы.
- а чтобы она была доступна в рантайме, надо единожды подключить тот самый сгенерированный файл с хэлперами. Можно вручную в точке входа, а можно через `node -r ./dist/babel-helpers.js <...>`.

2. Т.к. первый вариант мутный, с кучей нюансов и телодвижений, можно поступить проще - поставить `@babel/plugin-transform-runtime` и `@babel/runtime` (как описано выше) и все настройки этого плагина выставить в `false`, кроме одной - `helpers` надо выставить в `true`:

```javascript
plugins: [
  [
    '@babel/plugin-transform-runtime',
    {
      absoluteRuntime: false,
      corejs: false,
      helpers: true,
      regenerator: false,
      useESModules: false,
    },
  ],
];
```

_Кмк, этот плагин желательно подключать в конце списка плагинов, после всех остальных преобразований._

Т.о. за импорт нужных полифиллов из `core-js` и регенератора будет отвечать `@babel/preset-env`, а за импорт хэлперов будет отвечать `@babel/plugin-transform-runtime`.

_Если одновременно использовать и `preset-env`, и `transform-runtime`, и при этом у `transform-runtime` выставить `regenerator: true`, то импорт регенератора будет происходить дважды в каждом файле, где он будет нужен. Поэтому у `transform-runtime` включённым лучше оставлять только `helpers`._

## `.babelrc.js`

В конечном итоге, конфиг бабеля для проектов под ноду, выглядит следующим образом:

```javascript
module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: { node: true },
        useBuiltIns: 'usage',
        corejs: { version: 3, proposals: true },
      },
    ],
  ],
  plugins: [
    '@babel/plugin-proposal-object-rest-spread',
    '@babel/plugin-proposal-export-default-from',
    '@babel/plugin-proposal-export-namespace-from',
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-do-expressions',
    '@babel/plugin-proposal-optional-chaining',
    '@babel/plugin-proposal-nullish-coalescing-operator',
    '@babel/plugin-proposal-throw-expressions',
    '@babel/plugin-proposal-async-generator-functions',
    // '@babel/plugin-proposal-decorators',
    // '@babel/plugin-proposal-private-methods',
    [
      '@babel/plugin-transform-runtime',
      {
        absoluteRuntime: false,
        corejs: false,
        helpers: true,
        regenerator: false,
        useESModules: false,
      },
    ],
    [
      'babel-plugin-module-resolver',
      {
        root: ['./src'],
        alias: {
          '~cwd': './',
          '~': './src',
        },
      },
    ],
  ],
};
```

Получаем полный автомат, подключение только необходимых зависимостей, отсутствие runtime-оверхеда, отсутствие нюансов, которые надо держать в голове и полную свободу в написании кода.

## `babel-plugin-module-resolver`

https://github.com/tleunen/babel-plugin-module-resolver

Плагин для алиасов в импортах.

1. Чтобы алиасы подхватывались Web/PhpStorm'ами, надо:

а) добавить кастомный `Resource root` с помощью `ПКМ на директории` -> `Mark Directory as` -> `Resource Root`;

б) в корне проекта положить файл `webpack.config.js` (его можно даже в гит не добавлять) с таким содержимым:

```javascript
const path = require('path');

module.exports = {
  context: path.resolve('./src'),
  resolve: {
    extensions: ['.js', '.mjs', '.node'],
    alias: {
      '~cwd': path.resolve('./'),
      '~': path.resolve('./src'),
    },
  },
};
```

В секцию `alias` надо перенести все импорты, которые прописаны в настройках плагина бабеля. Тогда штормы будут корректно резолвить пути в импортах.

Для резолвинга путей в других IDE, можно воспользоваться [инструкцией](https://github.com/tleunen/babel-plugin-module-resolver#editors-autocompletion).

2. Чтобы алиасы корректно работали с eslint'ом, надо поставить `eslint-plugin-import` и `eslint-import-resolver-babel-module`.

_Вместо `babel-plugin-module-resolver` можно использовать `babel-plugin-root-import` в паре с `eslint-import-resolver-babel-plugin-root-import` (и `eslint-plugin-import` соответственно)._

</details>

<details>
<summary>ESLint</summary>

https://github.com/eslint/eslint

Некоторые `fixable` правила установлены в `warn`, т.е. визуально в IDE предупреждение будет отображаться, но при линтинге с опцией `--fix` все эти проблемы будут автоматически исправлены.

Благодаря тому, что `eslint` для файла `.eslintignore` использует `.gitignore`-спецификацию гита, то игнорирование файлов для линтинга настроено таким образом, что линтуются все `*.js` файлы в корне проекта (в том числе `dot`-файлы) и все `*.m?js` файлы из папки `./src`.

Т.е. удалось достичь следующее:

- в проекте может быть сколько угодно папок верхнего уровня (например для хранения каких-нибудь кэшей, хранения статики, прочих файлов с результатами чего бы то ни было) и не надо вручную все эти папки добавлять во все `ignore`-файлы - (`.eslintignore`, `.prettierignore`, etc) и не надо держать в голове, что их надо туда добавлять - меньше когнитивной нагрузки и косяков;
- благодаря линтингу файлов в корне проекта, `eslint` линтует даже собственный конфиг! Ну и все прочие конфиги в том числе - `.babelrc.js`, `.prettierrc.js`, `lintstagedrc.js`, `webpack.config.js` и т.п.;
- При ручном запуске `eslint` можно натравливать на весь проект целиком простым вызовом:

  ```bash
  npx eslint . --ext .js,.mjs --fix
  ```

  Всё-равно отлинтуется только то, что описано выше. И во всех скриптах/конфигах, где нужно запускать линт файлов проекта, не надо вручную прописывать все необходимые файлы/папки - достаточно простого `eslint . --ext .js,.mjs`. А что линтовать, что не линтовать - решается в одном единственном месте - `.eslintignore`;

- подсветка ошибок/варнингов в IDE тоже работает только на этих файлах - `*.js` в корне и `*.m?js` из `./src`. Удобно.

_Для `_.js`-конфигов в корне проекта отключено правило`import/no-commonjs`, в них надо использовать CommonJS-нотацию -`require()`и`module.exports`.\*

Уже подключены и настроены (в т.ч. от конфликтов с prettier'ом) огромное количество правил и пресетов: `airbnb-base`, `babel`, `import`, `node`, `unicorn`, `sonarjs`, `promise` (для правильной работы с промисами), `eslint-comments` (для линтинга комментариев-инструкций `eslint`-а), `optimize-regex` (для сокращения RegExp'ов там, где это возможно) и `security` (для обнаружения небезопасных рэгекспов - ReDoS, возможных timing attacks и т.п.).

Не стесняйтесь добавлять новые и настраивать уже имеющиеся правила.

</details>

<details>
<summary>Prettier</summary>

https://github.com/prettier/prettier

С Prettier'ом то же самое, что и с `eslint`-ом - `.prettierignore` работает по спецификации `.gitignore`, со всеми сопутствующими плюшками, описанными выше.

Плюс `prettier`-то умеет ещё и в `*.json`, и в `*.md` (и много во что ещё, но здесь нужен только `*.json`). Поэтому, ко всему прочему, `prettier` будет форматировать все `*.{json,md}`-файлы в корне проекта и все `*.{json,md}` из `./src`.

И точно также запускатеся одной простой командой:

```bash
npx prettier "**/*.{js.mjs,json,md}" --write
```

Т.е. точно также натравливаем на весь проект, но отформатируются только нужные файлы из корня и из `./src`.

</details>

<details>
<summary>ESLint и Prettier</summary>

Есть 2 варианта того, как можно подружить `eslint` с `prettier`-ом.

### `eslint-config-prettier`

https://github.com/prettier/eslint-config-prettier

Этот конфиг просто отключает те правила `eslint`-а, которые бесполезны из-за того, что `prettier` автоматически это исправляет.

Если конфиг `eslint`-а extend'ится от каких-то дополнительных конфигов (например `eslint-plugin-babel`), то надо дополнительно подключить `prettier/babel`, как это [написано в документации](https://github.com/prettier/eslint-config-prettier#installation).
То же самое надо сделать для всех остальных плагинов, которые используются в проекте и для которых у `prettier`-а есть заглушки.

Чтобы проверить - не конфликтуют какие-либо правила `eslint`-а с `prettier`-ом, надо запустить:

```bash
npm run check-eslint-prettier-rules-conflict
---
yarn check-eslint-prettier-rules-conflict
```

Если конфликты есть, то сперва надо проверить - нету ли у `prettier`-а готовых заглушек (как описано выше), и, если нету, то вручную эти правила отключить.

### `eslint-plugin-prettier`

https://github.com/prettier/eslint-plugin-prettier

Этот плагин заставляет `prettier` работать как правило `eslint`-а.
Т.е. все синтаксические нюансы, которые `prettier` может исправить, будут отображаться как ошибки в отчёте `eslint`-а.

Если запускать `eslint` с опцией `--fix`, то после всех `eslint`-ых фиксов будет запущен `prettier`, который исправит всё остальное, что может исправить.

Вместе с плагином также нужно подключить `eslint-config-prettier` (как это описано у него [в документации](https://github.com/prettier/eslint-plugin-prettier#recommended-configuration)), который отключит конфликтующие правила.

### Что выбрать?

#### `eslint-plugin-prettier`

Если запускать как плагин, то по умолчанию исправлять получится только `*.js` файлы (ну или по списку расширений, переданных в `--ext js,mjs,jsx` при cli-запуске.

В то время, как `prettier` умеет в `json`, `json5`, `html`, `flow`, `md` и много что ещё. Какой парсер использовать - он сам выбирает автоматически.

В IDE будет много шума - код и так будет отформатирован при запуске с `--fix`-ом, но ошибки будут постоянно маячить перед глазами и напрягать. И тогда подсознательно придётся их исправлять сразу же при написании кода. И зачем? `prettier` и так всё это исправит сам.

С другой стороны, в конфиге `eslint`-а можно указать `warn` вместо `error`:

```json
{
  "plugins": ["prettier"],
  "rules": {
    "prettier/prettier": "warn"
  }
}
```

Тогда IDE будет подсвечивать проблемные места не как ошибки, а как код, который будет отформатирован, что гораздо понятнее и даже полезно - всегда будет понятно какие места будут переформатированы при линтинге с `--fix`-ом.

`eslint` можно научить и `json`-у (`eslint-plugin-json`), и `markdown`-у, и даже `graphql`-ю, но заставить `prettier` форматировать `*.json`/`*.md`/`.gql` файлы (через `--fix` `eslint`-а) [нельзя](https://github.com/prettier/eslint-plugin-prettier/issues/81#issuecomment-424550756).

<!-- Т.к. `eslint` по умолчанию запускает проверку только на `*.js` файлах, то и IDE будет подсвечивать ошибки/варнинги только в них (а у шторма ещё и в `*.mjs`). Ни в `*.json` файлах шторм ничего не подсвечивает и не будет, `*.jsx` не тестировался (с VSCode ситуация, возможно, такая же). Если такой вариант устраивает - отлично. -->

#### `eslint-config-prettier`

С конфигом всё проще - никаких ошибок в IDE маячить не будет.

Но тогда надо отдельно настраивать и запускать "watch"-режим (либо [из `npm`-скриптов](https://prettier.io/docs/en/watching-files.html), либо [в `File Watchers` в штормах](https://prettier.io/docs/en/webstorm.html)), что усложняет настройку, но при этом форматирование будет на лету по `Ctrl+S`, что сильно нагляднее.

А если не использовать "watch"-режим, то для линтинга и автоформатирования надо по отдельности запускать `eslint --fix` и `prettier --write`, при чём именно в таком порядке. Это тоже можно настроить в `npm`-скриптах.

### Нюансы

Если `printWidth` в конфиге prettier'а не указан, то он подхватит `max_line_length` из [`.editorconfig`](https://editorconfig.org/), а вот правило `max-len` из eslint'а - нет.
Плюс при разных значениях `printWidth` и `max-len` - они [могут конфликтовать](https://github.com/prettier/eslint-config-prettier#max-len).

Поэтому, чтобы проблем не было, надо вручную синхронизировать опцию `printWidth` с правилом `max-len` из eslint'а и `max_line_length` из `.editorconfig`.

Ну и некоторые конфликтующие правила можно включать, если учитывать нюансы, которые также [описаны в документации](https://github.com/prettier/eslint-config-prettier#special-rules).

### Итог

В данном проекте выбрана следующая схема:

`eslint-plugin-prettier` с правилом `"prettier/prettier": "warn"`, чтобы в IDE отображались места, которые будут отформатированы при запуске `eslint`-а с опцией `--fix`.

Т.е. все `*.{js,mjs}` файлы линтуются и форматируются `prettier`-ом из-под `eslint`-а, а все `*.{json,md}`-файлы форматируются `prettier`-ом отдельной командой:

```bash
npx prettier "**/*.{json,md}" --write
```

Но вручную запускать это каждый раз не нужно - процесс вполне автоматизируемый, об этом далее.

</details>

<details>
<summary>Автоматизация запуска линтига/форматирования, Lint staged и Husky</summary>

https://github.com/okonet/lint-staged

https://github.com/typicode/husky

1. Можно отлинтовать и отформатировать все файлы разом (`*.{js,mjs,json,md}` из корня и `./src`) запуском одной команды:

```bash
npm run lint
```

2. При коммите (благодаря `husky`) автоматически будет запущен линтинг и форматирование файлов, которые в этот коммит попали (благодаря `lint-staged`). Но отлинтуются не все файлы коммита, а только `*.{js,mjs,json,md}` из корня и `./src`. Если в файлах в staging'е есть ошибки линтинга, то коммит прервётся (но отформатированные файлы останутся отформатированными).

3. Дополнительно (но совершенно не обязательно) можно при сохранении файлов на лету форматировать `prettier`-ом все нужные файлы, если разработка ведётся в IDE от JetBrains. Для этого можно взять вот [этот конфиг](https://gist.github.com/antixrist/645799f9540192873dfbe18ffcc441a6), положить его в `~/.PhpStorm2019.1/config/options`, перезапустить IDE, `File` -> `Settings` -> `Tools` -> `File Watchers` и включить необходимые для своего проекта пункты - `.js`, `.mjs`, `.json`, `.json5` или `.md`. И тогда по `Ctrl+S` эти файлы будут автоматически форматироваться.

</details>

<details>
<summary>Режим разработки</summary>

```bash
npm run watch
---
yarn watch
```

После запуска таски `watch` и после того, как будет готов первичный билд, нужно открыть другую консоль и запустить:

```bash
npm run dev ./dist
---
yarn dev ./dist
```

_После названия команды `dev` должен следовать путь к файлу для запуска - `./dist`, `./dist/server.js`, `./dist/worker`, etc.
Т.е. вместо `node ...` пишем `npm run dev ...` или `yarn dev ...`, а вместо `./src` - `./dist`, а дальше всё как обычно._

Первой командой запускается компиляция исходников из папки `./src` в папку `./dist` с полным сохранением структуры файлов и каталогов (`babel` в режиме `--watch --copy-files --source-maps`), а второй командой осуществляется непосредственный запуск приложения из скомпилированных файлов.

Такой подход позволяет иметь несколько точек входа (несколько приложений для запуска) с общей кодовой базой.

Также в команду запуска можно передавать любые cli-аргументы для node.js, например `--inspect` или `--inspect-brk` для отладки в консоли хрома:

```bash
yarn dev --inspect ./dist/server.js
--
yarn dev --inspect-brk ./dist/server.js
```

_Через `npm run dev --inspect ./dist/server.js` это, к сожалению, не работает. Поэтому для разработки можно использовать `yarn`._

Скриптов для автоматического перезапуска запущенного приложения не предусмотрено. Поэтому:

а) запущенное приложение необходимо перезапускать вручную;

б) не стесняйтесь писать свои `npm`-скрипты, которые будут отслеживать в папке `./dist` необходимые файлы и перезапускать необходимые вам точки входа с необходимыми вам параметрами. Например, с помощью [`onchange`](https://github.com/Qard/onchange), [`chokidar-cli`](https://github.com/kimmobrunfeldt/chokidar-cli), [`nodemon`](https://github.com/remy/nodemon) или даже [`pm2`](https://github.com/Unitech/pm2) (но, кмк, для режима разработки он будет оверхедом).

</details>

<details>
<summary>Production режим</summary>

```bash
npm run build
---
yarn build
```

После того, как скомпилировались исходники, можно запускать любую точку входа простой командой:

```bash
npm run start ./dist
---
yarn start ./dist
```

_Т.е. вместо `node ...` пишем `npm run start ...` или `yarn start ...`, а дальше всё как обычно._

Здесь также можно передавать любые cli-аргументы в саму ноду.

В качестве супервизора можно использовать что угодно - `pm2`, `forever`, `nodemon`, `supervisor`. Но, конечно, здесь `pm2` вне конкуренции.

</details>

<details>
<summary>Best practices разработки на Node.js</summary>

[Изучить от корки до корки](https://github.com/i0natan/nodebestpractices).

1. Не раздавать нодой статику. Для этого есть nginx. То же самое с https.
2. nginx перед нодой.
3. Тесты.
4. Использовать `crypto.timingSafeEqual(a, b)` (или `scmp`, или `bcrypt.compare()`) вместо `===` в сранениях строки с пользовательским вводом - для предотвращения `timing attacs`.
5. Не хранить ключи/секреты в гите (или использовать `cryptr`).
6. Не использовать basic-аутентификацию.
7. Для пользовательских паролей - только `bcrypt`.
8. Использовать `helmet`, настроить CSP.
9. Настроить Rate Limit (`rate-limiter-flexible`).
10. `TransactionId` в каждой строчке логов! С помощью `cls-hooked`.
11. Систематически делать `npm audit` или `snyk` для проверки зависимостей на уязвимости.
12. Валидация и санитизация всех входящих данных (JSONSchema и `ajv` в помощь).
13. Если jwt, то должна быть поддержка blacklist'а.
14. Не отправлять детали ошибок и стектрейсы в ответах.

</details>
