// eslint-disable-next-line no-console
process.on('shutdown', ({ code, signal }) => console.log('Bye!', code, signal));
