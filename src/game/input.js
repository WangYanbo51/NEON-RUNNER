/**
 * 键盘 + 触屏滑动输入
 * handlers: { left, right, jump, slide, action }
 */
export function createInput(handlers) {
  const KEYS_LEFT = ['ArrowLeft', 'a', 'A'];
  const KEYS_RIGHT = ['ArrowRight', 'd', 'D'];
  const KEYS_UP = ['ArrowUp', 'w', 'W'];
  const KEYS_DOWN = ['ArrowDown', 's', 'S'];
  const KEYS_ACTION = [' ', 'Spacebar', 'Enter'];

  window.addEventListener(
    'keydown',
    (e) => {
      if (e.repeat) return;
      const k = e.key;
      const all = [...KEYS_LEFT, ...KEYS_RIGHT, ...KEYS_UP, ...KEYS_DOWN, ...KEYS_ACTION];
      if (all.includes(k)) e.preventDefault();

      if (KEYS_LEFT.includes(k)) handlers.left();
      else if (KEYS_RIGHT.includes(k)) handlers.right();
      else if (KEYS_UP.includes(k)) handlers.jump();
      else if (KEYS_DOWN.includes(k)) handlers.slide();
      else if (KEYS_ACTION.includes(k)) handlers.action();
    },
    { passive: false }
  );

  let sx = 0;
  let sy = 0;
  let st = 0;

  window.addEventListener(
    'touchstart',
    (e) => {
      const t = e.changedTouches[0];
      sx = t.clientX;
      sy = t.clientY;
      st = performance.now();
    },
    { passive: true }
  );

  window.addEventListener(
    'touchend',
    (e) => {
      const t = e.changedTouches[0];
      const dx = t.clientX - sx;
      const dy = t.clientY - sy;
      const ax = Math.abs(dx);
      const ay = Math.abs(dy);
      const quick = performance.now() - st < 400;

      if (Math.max(ax, ay) < 26) {
        handlers.action();
        return;
      }
      if (ax > ay) {
        if (dx > 0) handlers.right();
        else handlers.left();
      } else if (dy > 0) {
        handlers.slide();
      } else {
        handlers.jump();
      }
      if (!quick) {
        /* 慢速滑动也照常响应，不做额外处理 */
      }
    },
    { passive: true }
  );
}
