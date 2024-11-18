export default async function decorate(block) {
  block.querySelectorAll('a').forEach((button) => {
    button.target = '_blank';
  });
}
