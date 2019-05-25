process.on('shutdown', ({ code, signal }) => console.log('Bye!', code, signal));

console.log('Hi!');
