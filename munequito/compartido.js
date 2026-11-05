// Estado compartido del muñequito en Firebase Realtime Database (munequito/estado), para que sea
// el mismo muñequito en el navegador de cada quien. Cada acción se aplica con una transacción
// sobre el estado más reciente, así dos acciones al mismo tiempo no se pisan; y la hora es la del
// servidor, para que las barras bajen igual en las dos pantallas.
// Si Firebase no carga (sin internet), la página sigue funcionando sola con su copia local.

const SDK = "https://www.gstatic.com/firebasejs/10.12.2";
const CONFIG = {
  apiKey: "AIzaSyC7Nt9pRIFGzasn7UADBbPrbLQ91aSl22Q",
  authDomain: "munequito-edi.firebaseapp.com",
  databaseURL: "https://munequito-edi-default-rtdb.firebaseio.com",
  projectId: "munequito-edi",
  storageBucket: "munequito-edi.firebasestorage.app",
  messagingSenderId: "861427721022",
  appId: "1:861427721022:web:b06963bd5cdbef82adc26f",
};

let offset = 0; // diferencia entre el reloj del servidor y el de este navegador (segundos)
export const serverNow = () => Date.now() / 1000 + offset;

// Conecta y avisa de cada cambio. Devuelve apply(mutar) o null si no se pudo conectar.
//   onState(estado): el estado guardado más reciente (con su «last» en hora del servidor)
//   apply(mutar): corre mutar(estado) dentro de una transacción; mutar devuelve el estado nuevo
export async function connect(onState) {
  try {
    const [{ initializeApp }, db] = await Promise.all([
      import(`${SDK}/firebase-app.js`),
      import(`${SDK}/firebase-database.js`),
    ]);
    const app = initializeApp(CONFIG);
    const database = db.getDatabase(app);
    db.onValue(db.ref(database, ".info/serverTimeOffset"), (s) => { offset = (s.val() || 0) / 1000; });
    const estado = db.ref(database, "munequito/estado");
    db.onValue(estado, (s) => { if (s.exists()) onState(s.val()); });
    return (mutar) => db.runTransaction(estado, (cur) => mutar(cur)).catch((e) => console.warn("no se guardó en Firebase:", e.message));
  } catch (e) {
    console.warn("sin Firebase, el muñequito se guarda solo en este navegador:", e.message);
    return null;
  }
}
