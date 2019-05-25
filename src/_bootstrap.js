import 'dotenv-safe/config';

/**
 * В стектрейс ноды попадают не все вызовы клиентского кода.
 * Благодаря `trace` в стректрейсе появляется максимально возможное
 * количество вызовов функций (в т.ч. `@babel/runtime` и `regenerator-runtime`).
 * В принципе, не обязателен (может быть слишком много шума из-за `@babel/runtime`, `regenerator-runtime` и т.п.).
 */
import 'trace';

/**
 * `clarify` убирает из стектрейсов все внутренние вызовы ноды,
 * оставляя только строки кода приложения.
 */
import 'clarify';

/**
 * Нода/v8 не умеет в соурсмапы, поэтому в стектрейсах
 * номера строк/столбцов берутся из транспайлерного кода.
 * `source-map-support` исправляет этот недочёт.
 */
import 'source-map-support/register';

/**
 * При непойманном исключении нода падает (показывая ошибку в консоли),
 * но вот при `unhandledRejection` (провалившийся промис без `.catch()`)
 * нода просто покажет возникшую ошибку и продолжит работать как ни в чём ни бывало.
 * Хотя это абсолютно такая же непойманная ошибка, только в асинхронном коде.
 * `make-promises-safe` заставляет ноду падать в таких случаях.
 * Ближайший аналог - `hard-rejection` и немного с другим подходом - `loud-rejection`.
 * Можно вызвать как `require('make-promises-safe').abort = true`,
 * тогда при падении будет сделан ещё и core dump.
 */
import 'make-promises-safe';

/**
 * `onExit` вызывается когда:
 *  - заканчивается выполнение приложения (опустел event loop);
 *  - явно вызывается `process.exit(code)` или `process.kill(pid, sig)`;
 *  - извне получен сигнал фатального завершения процесса (`Ctrl+C` в консоли).
 */
import onExit from 'signal-exit';

/**
 * Если завершение произошло из-за непойманной ошибки или `process.exit()`,
 * то `code` будет равен `1` или тому, что передали в `process.exit(code)`/`process.exitCode`, а `signal === null`.
 * Если завершение произошло из-за явной остановки (например, `Ctrl+C` в консоли или `process.kill(pid, sig)`),
 * то `code === null`, а `signal` - соответствующему сигналу, переданному в процесс (например, `SIGINT` или `SIGTERM`).
 *
 * Поэтому можно заэмитить кастомное событие, на которое можно подписаться
 * где угодно в приложении и сделать необходимые операции перед остановкой.
 * Но в коллбэках выполнится только синхронный код - все последующие tick'и event loop'а будут прерваны.
 */
onExit((code, signal) => process.emit('shutdown', { code, signal }));
