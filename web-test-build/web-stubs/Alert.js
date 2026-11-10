// Reemplazo de Alert SOLO para la build web de pruebas.
// react-native-web trae Alert.alert() vacío (no hace nada), así que ninguna alerta de la app
// se vería en el navegador. Este reemplazo dibuja la alerta en el DOM para que Playwright
// pueda leerla (data-testid="rn-alert-title" / "rn-alert-message") y pulsar sus botones.
class Alert {
  static alert(title, message, buttons) {
    if (typeof document === 'undefined') return;
    const previa = document.getElementById('rn-alert-root');
    if (previa) previa.remove();

    const root = document.createElement('div');
    root.id = 'rn-alert-root';
    root.setAttribute('role', 'alertdialog');
    root.setAttribute('data-testid', 'rn-alert');
    root.style.cssText =
      'position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:99999;font-family:system-ui,sans-serif';

    const caja = document.createElement('div');
    caja.style.cssText = 'background:#fff;border-radius:14px;padding:20px;max-width:340px;width:88%;color:#111';

    const t = document.createElement('div');
    t.setAttribute('data-testid', 'rn-alert-title');
    t.style.cssText = 'font-weight:700;font-size:17px;margin-bottom:8px';
    t.textContent = title || '';

    const m = document.createElement('div');
    m.setAttribute('data-testid', 'rn-alert-message');
    m.style.cssText = 'font-size:14px;margin-bottom:16px;white-space:pre-line';
    m.textContent = message || '';

    const fila = document.createElement('div');
    fila.style.cssText = 'display:flex;gap:8px;justify-content:flex-end';

    const lista = Array.isArray(buttons) && buttons.length ? buttons : [{ text: 'OK' }];
    lista.forEach((b) => {
      const btn = document.createElement('button');
      btn.textContent = b.text || 'OK';
      btn.setAttribute('data-testid', 'rn-alert-btn');
      btn.style.cssText = 'padding:8px 14px;border-radius:8px;border:1px solid #1D4ED8;background:#fff;color:#1D4ED8;font-weight:600;cursor:pointer';
      btn.onclick = () => {
        root.remove();
        if (typeof b.onPress === 'function') b.onPress();
      };
      fila.appendChild(btn);
    });

    caja.append(t, m, fila);
    root.appendChild(caja);
    document.body.appendChild(root);
  }
}

export default Alert;
