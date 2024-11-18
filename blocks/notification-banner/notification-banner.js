export default function decorate(block) {
  const [message, action] = block.querySelectorAll(':scope > div');
  message?.classList.add('notification-banner-message');
  action?.classList.add('notification-banner-action');
}
