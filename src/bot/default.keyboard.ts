const Markup = require('node-vk-bot-api/lib/markup');

export default function DefaultKeyboard(queue_id) {
  return Markup.keyboard([
    [
      Markup.button({
        action: {
          type: 'callback',
          label: 'Записаться',
          payload: JSON.stringify({
            action: 'add',
            queue_id: queue_id,
          }),
        },
        color: 'positive',
      }),
    ],
    [
      Markup.button({
        action: {
          type: 'callback',
          label: 'Выписаться',
          payload: JSON.stringify({
            action: 'remove',
            queue_id: queue_id,
          }),
        },
        color: 'negative',
      }),
    ],
    [
      Markup.button({
        action: {
          type: 'callback',
          label: 'Удалить список',
          payload: JSON.stringify({
            action: 'delete',
            queue_id: queue_id,
          }),
        },
        color: 'primary',
      }),
    ],
  ]).inline();
}
