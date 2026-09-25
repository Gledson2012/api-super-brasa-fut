/**
 * Rejeita caso a promise não resolva dentro de `ms`. Usado para impedir que
 * operações externas (ex.: Redis) travem o boot da aplicação ou uma resposta.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, label = 'operação'): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout de ${ms}ms excedido em ${label}.`));
    }, ms);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}
